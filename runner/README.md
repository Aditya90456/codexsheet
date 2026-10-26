# Local JavaScript runner

For local development, install `python -m pip install -r runner/requirements.txt`, then start the API with `npm run runner`. It uses Waitress on `127.0.0.1`. Node.js 22.13 or newer is required for the runtime permission flag.

The Flask API exposes `/api/execute` for JavaScript test runs and `/api/tutor` for DSA questions answered by Google Gemini. For local use, put `GEMINI_API_KEY=...` in the root `.env` file; the backend loads it, and the key never belongs in a Vite `VITE_*` variable. `GEMINI_MODEL` can optionally override the default `gemini-3.8-flash` model. On a Gemini 503, the tutor automatically tries `GEMINI_FALLBACK_MODEL` (default `gemini-3.6-flash`). For Vercel, add `GEMINI_API_KEY` and optional `GEMINI_MODEL` / `GEMINI_FALLBACK_MODEL` in Project Settings → Environment Variables. Python Function entry points are in `api/`, and the root `requirements.txt` installs Flask and the Gemini SDK. `https://codexsheet.in` is an allowed origin by default. Set `RUNNER_ALLOWED_ORIGINS` to a comma-separated list when using another production domain.

In another terminal, run `npm run dev`. Vite proxies `/api/execute` to Flask. If the Flask process is not running, the test editor falls back to its browser worker.
