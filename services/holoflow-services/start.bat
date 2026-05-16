@echo off
REM start.bat — launch the HoloFlow Services sidecar
REM
REM Default: localhost:8765 with hot reload.
REM
REM First-time setup:
REM   pip install -r requirements.txt
REM
REM Daily start:
REM   start.bat

cd /d "%~dp0"
echo Starting HoloFlow Services sidecar on http://127.0.0.1:8765
echo Press Ctrl+C to stop.
echo.
python -m uvicorn main:app --host 127.0.0.1 --port 8765 --reload
