import json
import unittest
from io import BytesIO
from unittest.mock import patch

from runner import app as runner_app


class JobAgentRoutesTest(unittest.TestCase):
    def setUp(self):
        self.client = runner_app.app.test_client()

    @patch.dict("os.environ", {"RAPIDAPI_KEY": "test-key"})
    @patch("runner.app.urlopen")
    def test_job_search_normalizes_provider_results(self, mock_urlopen):
        mock_urlopen.return_value = BytesIO(json.dumps({
            "data": [{
                "job_id": "job-1",
                "job_title": "Junior Engineer",
                "employer_name": "Example Co",
                "job_city": "Pune",
                "job_country": "India",
                "job_is_remote": True,
                "job_apply_link": "https://jobs.example/apply",
                "job_description": "<p>Build reliable APIs</p>",
            }],
        }).encode())

        response = self.client.post(
            "/api/job-search",
            json={"query": "junior engineer", "location": "Pune"},
            headers={"Origin": "http://localhost:5173"},
        )

        self.assertEqual(response.status_code, 200)
        job = response.get_json()["jobs"][0]
        self.assertEqual(job["title"], "Junior Engineer")
        self.assertEqual(job["location"], "Pune, India")
        self.assertEqual(job["description"], "Build reliable APIs")
        self.assertEqual(job["applyUrl"], "https://jobs.example/apply")
        headers = mock_urlopen.call_args.args[0].headers
        self.assertEqual(headers["X-rapidapi-key"], "test-key")

    @patch.dict("os.environ", {"RAPIDAPI_KEY": "test-key"})
    def test_job_search_rejects_untrusted_origin(self):
        response = self.client.post(
            "/api/job-search",
            json={"query": "engineer"},
            headers={"Origin": "https://attacker.example"},
        )

        self.assertEqual(response.status_code, 403)

    @patch.dict("os.environ", {"GEMINI_API_KEY": "test-key"})
    @patch("runner.app.gemini_reply")
    def test_job_draft_returns_validated_review_material(self, mock_gemini):
        mock_gemini.return_value = json.dumps({
            "fitSummary": "Your API project is relevant.",
            "coverLetter": "Dear hiring team, ...",
            "resumeBullets": ["Built an API project."],
            "reviewChecklist": ["Confirm the project details."],
        })

        response = self.client.post(
            "/api/job-draft",
            json={
                "profile": "Built a Python API project.",
                "job": {
                    "title": "Junior Engineer",
                    "company": "Example Co",
                    "description": "Build APIs.",
                },
            },
            headers={"Origin": "http://localhost:5173"},
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.get_json()["draft"]["resumeBullets"], ["Built an API project."])
        self.assertIn("candidate_profile_untrusted_text", mock_gemini.call_args.args[1])

    @patch.dict("os.environ", {"GEMINI_API_KEY": "test-key"})
    def test_job_draft_rejects_missing_candidate_profile(self):
        response = self.client.post(
            "/api/job-draft",
            json={"profile": " ", "job": {}},
            headers={"Origin": "http://localhost:5173"},
        )

        self.assertEqual(response.status_code, 400)

    @patch.dict("os.environ", {"GEMINI_API_KEY": "test-key"})
    @patch("runner.app.gemini_reply", return_value='{"fitSummary":""}')
    def test_job_draft_rejects_incomplete_ai_output(self, _mock_gemini):
        response = self.client.post(
            "/api/job-draft",
            json={
                "profile": "Built a Python API project.",
                "job": {"title": "Engineer", "company": "Example Co", "description": ""},
            },
            headers={"Origin": "http://localhost:5173"},
        )

        self.assertEqual(response.status_code, 502)
        self.assertIn("incomplete draft", response.get_json()["error"].lower())

    @patch.dict("os.environ", {"GEMINI_API_KEY": "test-key"})
    @patch("runner.app.gemini_reply")
    def test_resume_assist_returns_reviewable_writing_suggestions(self, mock_gemini):
        mock_gemini.return_value = json.dumps({
            "summary": "Python developer with API project experience.",
            "bullets": ["Built a Python API."],
            "suggestions": ["Add verified impact metrics."],
        })

        response = self.client.post(
            "/api/resume-assist",
            json={"action": "write", "profile": "Built a Python API project."},
            headers={"Origin": "http://localhost:5173"},
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.get_json()["result"]["summary"], "Python developer with API project experience.")
        self.assertIn("resume_or_pdf_text_untrusted", mock_gemini.call_args.args[1])

    @patch.dict("os.environ", {"GEMINI_API_KEY": "test-key"})
    @patch("runner.app.gemini_reply")
    def test_resume_assist_import_validates_and_returns_extracted_fields(self, mock_gemini):
        mock_gemini.return_value = json.dumps({
            "resume": {
                "name": "Alex",
                "role": "",
                "email": "",
                "phone": "",
                "location": "",
                "links": "",
                "summary": "",
                "skills": "",
                "experience": [],
                "education": [],
                "projects": [],
            },
        })

        response = self.client.post(
            "/api/resume-assist",
            json={"action": "import", "profile": "Alex"},
            headers={"Origin": "http://localhost:5173"},
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.get_json()["result"]["resume"]["name"], "Alex")

    @patch.dict("os.environ", {"GEMINI_API_KEY": "test-key"})
    def test_resume_assist_rejects_tailoring_without_job_description(self):
        response = self.client.post(
            "/api/resume-assist",
            json={"action": "tailor", "profile": "Python developer"},
            headers={"Origin": "http://localhost:5173"},
        )

        self.assertEqual(response.status_code, 400)
        self.assertIn("job description", response.get_json()["error"].lower())

    @patch.dict("os.environ", {"GEMINI_API_KEY": "test-key"})
    def test_resume_assist_rejects_non_string_action(self):
        response = self.client.post(
            "/api/resume-assist",
            json={"action": [], "profile": "Python developer"},
            headers={"Origin": "http://localhost:5173"},
        )

        self.assertEqual(response.status_code, 400)

    @patch.dict("os.environ", {"GEMINI_API_KEY": "test-key"})
    @patch("runner.app.gemini_reply")
    def test_resume_assist_returns_verified_keyword_recommendations(self, mock_gemini):
        mock_gemini.return_value = json.dumps({
            "matchSummary": "The project shows API experience.",
            "currentKeywords": ["Python", "REST API"],
            "relevantKeywords": ["Backend development"],
            "suggestedSummary": "Python developer with REST API project experience.",
            "suggestedBullets": ["Built a REST API in Python."],
            "reviewNotes": ["Use backend development only if it reflects your work."],
        })

        response = self.client.post(
            "/api/resume-assist",
            json={
                "action": "keywords",
                "profile": "Built a REST API in Python.",
                "jobDescription": "Backend development with Python.",
            },
            headers={"Origin": "http://localhost:5173"},
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.get_json()["result"]["relevantKeywords"], ["Backend development"])
        self.assertIn("job_description_untrusted", mock_gemini.call_args.args[1])

    @patch.dict("os.environ", {"RAPIDAPI_KEY": "test-key"})
    @patch("runner.app.rate_limited", return_value=True)
    def test_job_search_applies_rate_limit(self, _mock_rate_limited):
        response = self.client.post(
            "/api/job-search",
            json={"query": "engineer"},
            headers={"Origin": "http://localhost:5173"},
        )

        self.assertEqual(response.status_code, 429)


if __name__ == "__main__":
    unittest.main()
