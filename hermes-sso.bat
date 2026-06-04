@echo off
REM Hermes Agent Launcher for SSO VietProDev
REM Usage: hermes-sso.bat [hermes-args]
REM
REM This script:
REM   1. Sets HERMES_HOME to point to the local Hermes config
REM   2. Launches Hermes with the SSO project as working directory
REM   3. CodeGraph MCP server is auto-loaded from ~/.hermes/config.yaml

set "HERMES_VENV=C:\Users\onoso\AppData\Local\hermes\hermes-agent\venv\Scripts\python.exe"
set "HERMES_SCRIPT=C:\Users\onoso\AppData\Local\hermes\hermes-agent\cli.py"
set "PROJECT_DIR=C:\VietProDev\sso-vietprodev"

REM Change to project directory
cd /d "%PROJECT_DIR%" || exit /b 1

REM Launch Hermes
"%HERMES_VENV%" "%HERMES_SCRIPT%" %*
