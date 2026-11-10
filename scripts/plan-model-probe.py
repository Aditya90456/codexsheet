"""One-shot probe of the planner's Gemini call: latency, tokens, and whether the
SDK accepts a JSON response type. Not part of the app."""
import json
import os
import time
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
for line in (ROOT / ".env").read_text(encoding="utf-8").splitlines():
    if "=" in line and not line.startswith("#"):
        key, value = line.split("=", 1)
        os.environ.setdefault(key.strip(), value.strip())

from google import genai
from google.genai import types

print("sdk", getattr(genai, "__version__", "?"), "mime_field", "response_mime_type" in types.GenerateContentConfig.model_fields)
client = genai.Client(api_key=os.environ["GEMINI_API_KEY"].strip())
brief = json.dumps({
    "brief": "placements in 10 days, I can study 5 days a week, DP and graphs kill me",
    "solved": 30,
    "tracks": [{"id": "sprint10", "days": 10, "label": "10-day sprint"}, {"id": "m3", "days": 84, "label": "12-week ladder"}],
    "patterns": ["Arrays & Hashing", "Graphs", "1-D DP"],
})
system = (
    "You are a study planner. Answer with one JSON object and nothing else, no fences:\n"
    '{"track":"<id>","daysPerWeek":<3|5|7>,"dailyTarget":<2-6>,"weakPatterns":["<names copied from patterns>"],"note":"<max 20 words>"}\n'
    "Never invent problems or pattern names."
)

for model in [os.environ.get("GEMINI_MODEL", "gemini-3.8-flash"), os.environ.get("GEMINI_FALLBACK_MODEL", "gemini-3.6-flash")]:
    for mime in ["", "application/json"]:
        config = types.GenerateContentConfig(system_instruction=system, temperature=0.2, max_output_tokens=600)
        if mime:
            try:
                config.response_mime_type = mime
            except Exception as exc:
                print(f"{model}: response_mime_type unsupported ({exc})")
                continue
        started = time.time()
        try:
            response = client.models.generate_content(model=model, contents=[{"role": "user", "parts": [{"text": brief}]}], config=config)
        except Exception as exc:
            print(f"{model} mime={mime or 'none'}: FAILED {type(exc).__name__} {str(exc)[:120]} {time.time()-started:.1f}s")
            continue
        text = (response.text or "")
        usage = getattr(response, "usage_metadata", None)
        print(f"{model} mime={mime or 'none'}: {time.time()-started:.1f}s len={len(text)} tokens={getattr(usage,'total_token_count',None)} thinking={getattr(usage,'thoughts_token_count',None)}")
        print("   ", text[:220].replace("\n", " "))
