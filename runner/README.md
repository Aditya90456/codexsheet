# Local JavaScript runner

For local development, install `python -m pip install -r runner/requirements.txt`, then start the API with `npm run runner`. It uses Waitress on `127.0.0.1`. Node.js 22.13 or newer is required for the runtime permission flag.

Vercel exposes the same Flask app at `/api/execute` through `api/execute.py`; the root `requirements.txt` installs Flask for the Python Function. `https://codexsheet.in` is an allowed origin by default. Set `RUNNER_ALLOWED_ORIGINS` to a comma-separated list when using another production domain.

In another terminal, run `npm run dev`. Vite proxies `/api/execute` to Flask. If the Flask process is not running, the test editor falls back to its browser worker.
