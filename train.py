"""Fine-tune a small causal language model as a technical interview coach.

Install dependencies with ``py -m pip install -r requirements-train.txt`` and run:

    py train.py

Or pass a different dataset with ``--data path/to/interview_train.jsonl``.

Each JSONL row must have a ``messages`` array in chat format, ending in an
assistant response. Example:

    {"messages":[{"role":"system","content":"You are a kind technical interviewer."},{"role":"user","content":"How would you find a pair that sums to a target?"},{"role":"assistant","content":"First, what assumptions can we make about the input?"}]}

The repository includes a tiny starter dataset at data/interview_train.jsonl;
replace it with a larger reviewed dataset for useful fine-tuning. This saves a
PEFT/LoRA adapter, not a complete model. The base model is fetched from Hugging
Face on the first run.
"""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path
from typing import Any


DEFAULT_MODEL = "Qwen/Qwen2.5-0.5B-Instruct"
ALLOWED_ROLES = {"system", "user", "assistant"}


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="LoRA fine-tune an interview-coach language model.")
    parser.add_argument(
        "--data",
        type=Path,
        default=Path("data/interview_train.jsonl"),
        help="JSONL training file containing chat messages (default: data/interview_train.jsonl).",
    )
    parser.add_argument("--model", default=DEFAULT_MODEL, help=f"Hugging Face causal LM (default: {DEFAULT_MODEL}).")
    parser.add_argument("--output-dir", type=Path, default=Path("output/interview-coach"), help="Where to save the LoRA adapter.")
    parser.add_argument("--epochs", type=float, default=3.0)
    parser.add_argument("--learning-rate", type=float, default=2e-4)
    parser.add_argument("--batch-size", type=int, default=1, help="Per-device batch size.")
    parser.add_argument("--gradient-accumulation-steps", type=int, default=8)
    parser.add_argument("--max-length", type=int, default=1024)
    parser.add_argument("--lora-rank", type=int, default=8)
    parser.add_argument("--seed", type=int, default=42)
    return parser.parse_args()


def read_examples(path: Path) -> list[list[dict[str, str]]]:
    if not path.is_file():
        raise ValueError(f"Training file not found: {path}")

    conversations: list[list[dict[str, str]]] = []
    with path.open("r", encoding="utf-8") as file:
        for line_number, line in enumerate(file, start=1):
            if not line.strip():
                continue
            try:
                row = json.loads(line)
            except json.JSONDecodeError as error:
                raise ValueError(f"{path}:{line_number}: invalid JSON ({error.msg})") from error

            messages = row.get("messages") if isinstance(row, dict) else None
            if not isinstance(messages, list) or len(messages) < 2:
                raise ValueError(f"{path}:{line_number}: expected a 'messages' array with at least two turns.")

            normalized: list[dict[str, str]] = []
            for message in messages:
                if not isinstance(message, dict):
                    raise ValueError(f"{path}:{line_number}: each message must be an object.")
                role, content = message.get("role"), message.get("content")
                if role not in ALLOWED_ROLES or not isinstance(content, str) or not content.strip():
                    raise ValueError(f"{path}:{line_number}: messages need a supported role and non-empty string content.")
                normalized.append({"role": role, "content": content.strip()})

            if normalized[-1]["role"] != "assistant":
                raise ValueError(f"{path}:{line_number}: the final message must be the assistant response.")
            if not any(message["role"] == "user" for message in normalized[:-1]):
                raise ValueError(f"{path}:{line_number}: include at least one user turn before the assistant response.")
            conversations.append(normalized)

    if not conversations:
        raise ValueError(f"No training conversations found in {path}.")
    return conversations


def main() -> int:
    args = parse_args()
    if args.epochs <= 0 or args.learning_rate <= 0 or args.batch_size <= 0:
        print("epochs, learning rate, and batch size must be positive.", file=sys.stderr)
        return 2
    if args.gradient_accumulation_steps <= 0 or args.max_length < 32 or args.lora_rank <= 0:
        print("gradient accumulation and LoRA rank must be positive; max length must be at least 32.", file=sys.stderr)
        return 2

    try:
        conversations = read_examples(args.data)
    except (OSError, ValueError) as error:
        print(f"Training data error: {error}", file=sys.stderr)
        return 2

    try:
        import numpy as np
        import torch
        from peft import LoraConfig, get_peft_model
        from torch.utils.data import Dataset
        from transformers import AutoModelForCausalLM, AutoTokenizer, Trainer, TrainingArguments
    except ImportError as error:
        print(
            "Missing training dependency. Install them with: py -m pip install -r requirements-train.txt",
            file=sys.stderr,
        )
        print(f"Details: {error}", file=sys.stderr)
        return 2

    np.random.seed(args.seed)
    torch.manual_seed(args.seed)
    if torch.cuda.is_available():
        torch.cuda.manual_seed_all(args.seed)

    tokenizer = AutoTokenizer.from_pretrained(args.model, use_fast=True)
    if tokenizer.chat_template is None:
        raise ValueError(f"The selected model {args.model!r} has no chat template. Choose an instruct/chat model.")
    if tokenizer.pad_token_id is None:
        tokenizer.pad_token = tokenizer.eos_token

    samples: list[dict[str, list[int]]] = []
    for index, messages in enumerate(conversations, start=1):
        prompt_ids = tokenizer.apply_chat_template(
            messages[:-1], tokenize=True, add_generation_prompt=True
        )
        full_ids = tokenizer.apply_chat_template(messages, tokenize=True, add_generation_prompt=False)
        if not isinstance(prompt_ids, list) or not isinstance(full_ids, list):
            raise ValueError("Tokenizer chat template must return token ID lists.")
        if full_ids[: len(prompt_ids)] != prompt_ids:
            raise ValueError(
                f"Example {index}: the model chat template does not preserve the generation prompt as a prefix."
            )

        input_ids = full_ids[: args.max_length]
        labels = [-100] * min(len(prompt_ids), len(input_ids))
        labels.extend(input_ids[len(labels) :])
        if not any(token != -100 for token in labels):
            print(f"Skipping example {index}: assistant response was truncated by --max-length.", file=sys.stderr)
            continue
        samples.append({"input_ids": input_ids, "attention_mask": [1] * len(input_ids), "labels": labels})

    if not samples:
        print("No trainable examples remain. Increase --max-length or shorten the conversations.", file=sys.stderr)
        return 2

    class ConversationDataset(Dataset):
        def __len__(self) -> int:
            return len(samples)

        def __getitem__(self, index: int) -> dict[str, list[int]]:
            return samples[index]

    class CausalCollator:
        def __call__(self, features: list[dict[str, Any]]) -> dict[str, torch.Tensor]:
            max_batch_length = max(len(feature["input_ids"]) for feature in features)
            padding = max(0, max_batch_length)
            input_ids = [feature["input_ids"] + [tokenizer.pad_token_id] * (padding - len(feature["input_ids"])) for feature in features]
            attention_masks = [feature["attention_mask"] + [0] * (padding - len(feature["attention_mask"])) for feature in features]
            labels = [feature["labels"] + [-100] * (padding - len(feature["labels"])) for feature in features]
            return {
                "input_ids": torch.tensor(input_ids, dtype=torch.long),
                "attention_mask": torch.tensor(attention_masks, dtype=torch.long),
                "labels": torch.tensor(labels, dtype=torch.long),
            }

    use_cuda = torch.cuda.is_available()
    model = AutoModelForCausalLM.from_pretrained(args.model)
    model.config.use_cache = False
    model = get_peft_model(
        model,
        LoraConfig(
            r=args.lora_rank,
            lora_alpha=args.lora_rank * 2,
            lora_dropout=0.05,
            bias="none",
            task_type="CAUSAL_LM",
            target_modules="all-linear",
        ),
    )
    model.print_trainable_parameters()

    training_args = TrainingArguments(
        output_dir=str(args.output_dir),
        num_train_epochs=args.epochs,
        learning_rate=args.learning_rate,
        per_device_train_batch_size=args.batch_size,
        gradient_accumulation_steps=args.gradient_accumulation_steps,
        logging_steps=5,
        save_strategy="epoch",
        save_total_limit=2,
        fp16=use_cuda and not torch.cuda.is_bf16_supported(),
        bf16=use_cuda and torch.cuda.is_bf16_supported(),
        gradient_checkpointing=use_cuda,
        report_to="none",
        seed=args.seed,
        data_seed=args.seed,
        remove_unused_columns=False,
    )
    trainer = Trainer(
        model=model,
        args=training_args,
        train_dataset=ConversationDataset(),
        data_collator=CausalCollator(),
        processing_class=tokenizer,
    )
    trainer.train()
    trainer.save_model(str(args.output_dir))
    tokenizer.save_pretrained(str(args.output_dir))
    print(f"Saved interview-coach LoRA adapter and tokenizer to {args.output_dir.resolve()}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
