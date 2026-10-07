#!/usr/bin/env bash
#
# Launch the cheatsheet helper app inside a project-local virtualenv.
# Safe to run repeatedly: the venv is created once and reused, and
# dependencies are (re)installed idempotently. The user's global Python
# environment is never modified.
#
# Dev auto-reload: run.sh defaults to APP_ENV=development, which turns on
# Flask's reloader (Python edits apply without a manual restart). Override
# with:  APP_ENV=production ./run.sh
#
set -euo pipefail
cd "$(dirname "${BASH_SOURCE[0]}")"

VENV_DIR=".venv"
PYTHON="${PYTHON:-python3}"
VENV_PY="$VENV_DIR/bin/python"

# 1. Create the virtualenv once.
if [ ! -x "$VENV_PY" ]; then
    echo "[run.sh] creating virtualenv in $VENV_DIR ..."
    "$PYTHON" -m venv "$VENV_DIR"
fi

# 2. Install / update dependencies inside the venv only.
echo "[run.sh] installing dependencies from requirements.txt ..."
"$VENV_PY" -m pip install --quiet --upgrade pip
"$VENV_PY" -m pip install --quiet -r requirements.txt

# 3. Start the app with the venv's Python (dev mode unless overridden).
export APP_ENV="${APP_ENV:-development}"
echo "[run.sh] starting app (APP_ENV=$APP_ENV) ..."
exec "$VENV_PY" app.py
