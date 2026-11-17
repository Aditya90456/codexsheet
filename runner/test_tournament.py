import os
import shutil
import subprocess
import unittest
from threading import Event, Lock
from time import sleep
from types import SimpleNamespace
from unittest.mock import patch

from runner.app import (
    AI_TOURNAMENT_CASES,
    AI_TOURNAMENT_QUESTIONS,
    AI_TOURNAMENT_REFERENCE_SOLUTIONS,
    AI_TOURNAMENT_TEAMS,
    ai_tournament_solution,
    app,
    gemini_reply,
)


class StudentTournamentTests(unittest.TestCase):
    def setUp(self):
        self.client = app.test_client()

    def test_tournament_has_nine_valid_problem_team_pairs(self):
        self.assertEqual(len(AI_TOURNAMENT_QUESTIONS), 9)
        self.assertEqual(len(AI_TOURNAMENT_TEAMS), 9)
        self.assertTrue(all(question in AI_TOURNAMENT_CASES for question in AI_TOURNAMENT_QUESTIONS))

    def test_extracts_ai_code_and_learning_notes(self):
        answer = (
            '{"code":"console.log(\'ok\');","approach":"Track prefix sums.",'
            '"time_complexity":"O(n).","space_complexity":"O(n)."}'
        )
        with patch("runner.app.gemini_reply", return_value=answer):
            code, notes = ai_tournament_solution("Count subarrays.", 1)

        self.assertEqual(code, "console.log('ok');")
        self.assertIn("Approach: Track prefix sums.", notes)
        self.assertIn("Time complexity: O(n).", notes)
        self.assertIn("Space complexity: O(n).", notes)

    def test_requests_bounded_structured_ai_output(self):
        answer = (
            '{"code":"console.log(\'ok\');","approach":"Track prefix sums.",'
            '"time_complexity":"O(n).","space_complexity":"O(n)."}'
        )
        with patch("runner.app.gemini_reply", return_value=answer) as generate:
            ai_tournament_solution("Count subarrays.", 1)

        self.assertEqual(generate.call_args.kwargs["response_mime_type"], "application/json")
        self.assertEqual(generate.call_args.kwargs["timeout_ms"], 15_000)

    def test_rejects_incomplete_ai_json(self):
        with patch("runner.app.gemini_reply", return_value='{"code":"console.log(1)"}'):
            with self.assertRaisesRegex(ValueError, "learning notes"):
                ai_tournament_solution("Count subarrays.", 1)

    def test_gemini_deadline_uses_fallback_model(self):
        class DeadlineError(Exception):
            code = 504

        with patch.dict(os.environ, {
            "GEMINI_API_KEY": "test-key",
            "GEMINI_MODEL": "primary-model",
            "GEMINI_FALLBACK_MODEL": "fallback-model",
        }), patch("google.genai.Client") as create_client:
            generate = create_client.return_value.models.generate_content
            generate.side_effect = [DeadlineError("Deadline expired"), SimpleNamespace(text="fallback reply")]

            answer = gemini_reply("system", "question", 100)

        self.assertEqual(answer, "fallback reply")
        self.assertEqual(
            [call.kwargs["model"] for call in generate.call_args_list],
            ["primary-model", "fallback-model"],
        )

    def test_tournament_uses_reference_solution_when_gemini_is_unavailable(self):
        class ServiceUnavailableError(Exception):
            code = 503

        with patch("runner.app.gemini_reply", side_effect=ServiceUnavailableError("busy")):
            code, notes = ai_tournament_solution("Pair sum.", 1)

        self.assertEqual(code, AI_TOURNAMENT_REFERENCE_SOLUTIONS["pair-sum"][0])
        self.assertIn("verified backup solution", notes)

    @unittest.skipUnless(shutil.which("node"), "Node.js is required to validate reference solutions")
    def test_reference_solutions_pass_all_hidden_cases(self):
        node = shutil.which("node")
        if node is None:
            self.skipTest("Node.js is required to validate reference solutions")
        for question_id, cases in AI_TOURNAMENT_CASES.items():
            source, _ = AI_TOURNAMENT_REFERENCE_SOLUTIONS[question_id]
            for stdin, expected in cases:
                with self.subTest(question=question_id, stdin=stdin):
                    result = subprocess.run(
                        [node, "-e", source],
                        input=stdin,
                        capture_output=True,
                        text=True,
                        timeout=10,
                        check=False,
                    )
                    self.assertEqual(result.returncode, 0, result.stderr)
                    self.assertEqual(" ".join(result.stdout.split()), expected)

    def test_rejects_problem_and_team_that_do_not_match_round(self):
        with patch.dict(os.environ, {"GEMINI_API_KEY": "test-key"}), patch(
            "runner.app.ai_tournament_solution"
        ) as generate:
            response = self.client.post("/api/student-tournament", json={
                "round": 1,
                "team": "Mumbai Indians",
                "question_id": "pair-sum",
                "source_code": "console.log('answer')",
            })

        self.assertEqual(response.status_code, 400)
        generate.assert_not_called()

    def test_judges_student_against_ai_on_hidden_cases(self):
        pair_cases = AI_TOURNAMENT_CASES["pair-sum"]
        active = 0
        max_active = 0
        active_lock = Lock()
        release_execution = Event()

        def fake_execution(language, source, stdin, identity):
            nonlocal active, max_active
            with active_lock:
                active += 1
                max_active = max(max_active, active)
                if active >= 5:
                    release_execution.set()
            if not release_execution.wait(timeout=3):
                raise RuntimeError("Tournament judging did not start submissions concurrently.")
            sleep(0.1)
            expected = next(output for case_input, output in pair_cases if case_input == stdin)
            output = expected if source == "ai solution" else ("NO" if expected == "NO" else "wrong")
            with active_lock:
                active -= 1
            return {"status": "Finished", "stdout": output, "compile_output": "", "time": "0.01"}

        with patch.dict(os.environ, {"GEMINI_API_KEY": "test-key"}), patch(
            "runner.app.ai_tournament_solution", return_value=("ai solution", "Approach: test")
        ), patch("runner.app.tournament_execute_case", new=fake_execution):
            response = self.client.post("/api/student-tournament", json={
                "round": 1,
                "team": "Chennai Super Kings",
                "question_id": "pair-sum",
                "source_code": "student solution",
            }, environ_base={"REMOTE_ADDR": "tournament-test"})

        self.assertEqual(response.status_code, 200, response.get_json())
        result = response.get_json()
        self.assertEqual(result["winner"], "ai")
        self.assertLess(result["student"]["passed_cases"], result["ai"]["passed_cases"])
        self.assertEqual(result["ai"]["total_cases"], len(pair_cases))
        self.assertGreaterEqual(max_active, 5)

    def test_returns_compiler_failure_instead_of_masking_it(self):
        with patch.dict(os.environ, {"GEMINI_API_KEY": "test-key"}), patch(
            "runner.app.ai_tournament_solution", return_value=("ai solution", "Approach: test")
        ), patch(
            "runner.app.tournament_execute_case",
            return_value={"error": "Judge0 could not be reached."},
        ):
            response = self.client.post("/api/student-tournament", json={
                "round": 1,
                "team": "Chennai Super Kings",
                "question_id": "pair-sum",
                "source_code": "student solution",
            }, environ_base={"REMOTE_ADDR": "compiler-error-test"})

        self.assertEqual(response.status_code, 502)
        self.assertIn("Judge0 could not be reached.", response.get_json()["error"])


if __name__ == "__main__":
    unittest.main()
