#!/usr/bin/env bash
# Starts both the FastAPI backend and the Next.js frontend with one command.
# Ctrl+C stops both. See README.md if you'd rather run them separately
# (e.g. to see backend logs on their own).
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT_DIR"

if [ ! -d "backend/.venv" ]; then
  echo "==> First run: creating backend/.venv and installing dependencies..."
  python3 -m venv backend/.venv
  backend/.venv/bin/pip install --quiet --upgrade pip
  backend/.venv/bin/pip install --quiet -r backend/requirements.txt
fi

if [ ! -d "node_modules" ]; then
  echo "==> First run: installing frontend dependencies..."
  npm install
fi

cleanup() {
  echo
  echo "==> Stopping backend and frontend..."
  kill "$BACKEND_PID" "$FRONTEND_PID" 2>/dev/null || true
  wait "$BACKEND_PID" "$FRONTEND_PID" 2>/dev/null || true
}
trap cleanup EXIT INT TERM

echo "==> Starting backend (FastAPI) on http://localhost:8000 ..."
(cd backend && .venv/bin/uvicorn app.main:app --reload --port 8000) &
BACKEND_PID=$!

echo "==> Starting frontend (Next.js) on http://localhost:3000 ..."
npm run dev &
FRONTEND_PID=$!

wait "$BACKEND_PID" "$FRONTEND_PID"
