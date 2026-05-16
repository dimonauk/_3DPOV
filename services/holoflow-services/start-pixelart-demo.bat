@echo off
REM ============================================================================
REM start-pixelart-demo.bat - interactive pixel art generator launcher
REM
REM Prompts for a subject, frame count, palette, then generates and opens the
REM result in Pixelorama. Useful for quick "does it work?" tests without the
REM React app or MCP.
REM
REM Prerequisites:
REM   - Ollama running on 127.0.0.1:11434 with dolphin-mistral:latest pulled
REM   - Mosquitto running on 127.0.0.1:1883 (optional — events are no-op'd if down)
REM ============================================================================

setlocal

set "HERE=%~dp0"
set "PY=C:\Users\dimon\AppData\Local\Programs\Python\Python312\python.exe"

cd /d "%HERE%"

echo.
echo ========================================
echo HoloFlow Pixel Art Generator
echo ========================================
echo.

REM --- Subject ---
set "SUBJECT="
set /p "SUBJECT=What to draw? (e.g. 'fire elemental walking'): "
if "%SUBJECT%"=="" (
    echo No subject given, exiting.
    pause
    exit /b 1
)

REM --- Frames ---
set "FRAMES=1"
set /p "FRAMES=How many frames? (1 = single sprite, 8 = animation) [1]: "
if "%FRAMES%"=="" set "FRAMES=1"

REM --- Size ---
set "SIZE=16"
set /p "SIZE=Canvas size in cells (8, 12, 16, 24, 32) [16]: "
if "%SIZE%"=="" set "SIZE=16"

REM --- Palette ---
echo.
echo Palettes:
echo   1. holoflow-8     ^(Dimona's signature pink/cyan/gold/black/white^)
echo   2. holoflow-5     ^(simpler signature - pink/cyan/black/white^)
echo   3. mono-magenta   ^(pink ramp^)
echo   4. mono-cyan      ^(cyan ramp^)
echo   5. warm-fire      ^(black/red/orange/yellow - best for flames^)
echo   6. pico-8         ^(retro game 16-color^)
echo   7. endesga-16     ^(modern indie palette^)
echo   8. gameboy-4      ^(green LCD^)
echo   9. bw-1bit        ^(pure black + white^)
set "PCHOICE=1"
set /p "PCHOICE=Palette? [1]: "

if "%PCHOICE%"=="1" set "PALETTE=holoflow-8"
if "%PCHOICE%"=="2" set "PALETTE=holoflow-5"
if "%PCHOICE%"=="3" set "PALETTE=mono-magenta"
if "%PCHOICE%"=="4" set "PALETTE=mono-cyan"
if "%PCHOICE%"=="5" set "PALETTE=warm-fire"
if "%PCHOICE%"=="6" set "PALETTE=pico-8"
if "%PCHOICE%"=="7" set "PALETTE=endesga-16"
if "%PCHOICE%"=="8" set "PALETTE=gameboy-4"
if "%PCHOICE%"=="9" set "PALETTE=bw-1bit"
if "%PALETTE%"=="" set "PALETTE=holoflow-8"

REM --- Open in Pixelorama? ---
set "OPENFLAG="
set "OPENCHOICE=y"
set /p "OPENCHOICE=Open result in Pixelorama? (y/n) [y]: "
if /i "%OPENCHOICE%"=="y" set "OPENFLAG=--open"
if /i "%OPENCHOICE%"=="yes" set "OPENFLAG=--open"

echo.
echo ----------------------------------------
echo Subject:   %SUBJECT%
echo Size:      %SIZE% x %SIZE%
echo Frames:    %FRAMES%
echo Palette:   %PALETTE%
echo ----------------------------------------
echo.
echo Generating... (first call may take 30-60s while dolphin-mistral cold-starts)
echo.

"%PY%" pixelart_generator.py "%SUBJECT%" --frames %FRAMES% --width %SIZE% --height %SIZE% --palette %PALETTE% %OPENFLAG%

echo.
echo ----------------------------------------
echo Output saved to: D:\HoloFlow\bridge\to-pixelorama\
echo ----------------------------------------
echo.
pause
