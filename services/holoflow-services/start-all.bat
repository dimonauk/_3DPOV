@echo off
REM ============================================================================
REM start-all.bat - launches the full HoloFlow stack
REM
REM Opens 3 windows:
REM   1. Mosquitto MQTT broker  (port 1883)
REM   2. HTTP sidecar           (port 8765 - FastAPI + Pixelorama bridge)
REM   3. MCP HTTP server        (port 8770 - agent-callable tool surface)
REM
REM Close any window to stop that service. Ctrl+C also works.
REM
REM For Claude Desktop / Claude Code integration: see claude_mcp_config.json
REM ============================================================================

setlocal

set "HERE=%~dp0"
set "PY=C:\Users\dimon\AppData\Local\Programs\Python\Python312\python.exe"
set "FASTMCP=C:\Users\dimon\AppData\Local\Programs\Python\Python312\Scripts\fastmcp.exe"
set "MOSQUITTO=C:\Program Files\mosquitto\mosquitto.exe"

echo.
echo ========================================
echo HoloFlow stack: starting 3 services
echo ========================================
echo.

REM --- Mosquitto broker ---
echo [1/3] Mosquitto MQTT broker (port 1883)
if exist "%MOSQUITTO%" (
    start "Mosquitto MQTT" cmd /k ""%MOSQUITTO%" -v"
) else (
    echo     WARNING: mosquitto not at %MOSQUITTO% - skipping
)
timeout /t 2 /nobreak > nul

REM --- HTTP sidecar ---
echo [2/3] HTTP sidecar (port 8765)
start "HoloFlow Sidecar" cmd /k "cd /d %HERE% && %PY% -m uvicorn main:app --host 127.0.0.1 --port 8765 --reload"
timeout /t 2 /nobreak > nul

REM --- MCP HTTP server ---
echo [3/3] MCP HTTP server (port 8770)
if exist "%FASTMCP%" (
    start "HoloFlow MCP" cmd /k "cd /d %HERE% && "%FASTMCP%" run mcp_server.py:mcp --transport http --host 127.0.0.1 --port 8770"
) else (
    echo     WARNING: fastmcp not at %FASTMCP% - skipping
)

echo.
echo All three services launched in separate windows.
echo.
echo URLs:
echo   Sidecar:  http://127.0.0.1:8765/status
echo   MCP HTTP: http://127.0.0.1:8770/mcp
echo   MQTT:    mqtt://127.0.0.1:1883
echo.
echo To monitor MQTT traffic:
echo   "C:\Program Files\mosquitto\mosquitto_sub.exe" -h 127.0.0.1 -t "holoflow/#" -v
echo.
echo Press any key to close THIS window (services keep running)...
pause > nul
