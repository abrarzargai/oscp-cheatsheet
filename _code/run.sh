#!/usr/bin/env bash
set -e
cd "$(dirname "${BASH_SOURCE[0]}")"

if ! python3 -c "import flask" 2>/dev/null; then
    echo "Flask not found — installing..."
    pip install flask
fi

exec python3 app.py
