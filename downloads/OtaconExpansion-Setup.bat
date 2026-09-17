@echo off
REM ============================================================
REM  OtaconExpansion-Setup.bat  (Premium foundation installer)
REM  Installs Expansion on top of Lite. Full surface pack (War
REM  Room / Video Studio) continues to ship incrementally.
REM ============================================================
setlocal EnableExtensions
title Otacon Expansion Setup
chcp 65001 >nul

echo.
echo ============================================================
echo   OTACON EXPANSION SETUP
echo   Otaconskeep Premium - Designed by Antonio G. Garcia
echo ============================================================
echo.
echo  What this installs today
echo  ------------------------
echo  Expansion foundation on top of Lite:
echo    - Five-agent roster (Aria / Vector / Ledger / Muse / Sentry)
echo    - Humanized Aria (speech / taste / WHO YOU ARE spine)
echo    - Chat-turn learning (praise, correction, prefer, remember)
echo    - Emotion, relationships, journals, learned claims
echo.
echo  Still shipping next
echo  -------------------
echo  Full one-click surface pack (Dashboard / Codec / War Room /
echo  Video Studio polish) continues to land in updates.
echo.
echo  Requirements
echo  ------------
echo  1. Otaconskeep Lite already installed (OtaconsKeep-Setup.bat)
echo  2. WSL / Git Bash / Linux / macOS available for the foundation script
echo.
echo  Install command (copy/paste in WSL or Git Bash)
echo  -----------------------------------------------
echo.
echo    curl -fsSL https://raw.githubusercontent.com/Otaconskeep/otacons-ai-ecosystem/main/install_otacon_expansion.sh ^| bash
echo.
echo  Then reopen Codec and talk to Aria -- she should sound human and
echo  learn from the conversation (praise, corrections, "remember ...").
echo.
echo  License
echo  -------
echo  Your Premium seat is one license. Do not share password/PIN.
echo  Sharing can revoke the seat. Ask Antonio in Discord if unsure.
echo.
echo ============================================================
echo  Press any key to open the Premium install page.
echo ============================================================
pause >nul

start "" "https://otaconskeep.com/premium/#install"
exit /b 0
