@echo off
cd /d "%~dp0"
title Fleure Organize

REM ── Vérifier que Bun est installé ─────────────────────────────────────────
where bun >nul 2>&1
if %errorlevel% neq 0 (
    echo.
    echo  ERREUR : Bun n'est pas installe.
    echo  Telecharge-le sur https://bun.sh puis relance ce script.
    echo.
    pause
    exit /b 1
)

REM ── Premier lancement : installer et builder automatiquement ──────────────
if not exist "frontend\dist\index.html" (
    echo  Premier lancement detecte, installation en cours...
    echo  Cela peut prendre 1-2 minutes, merci de patienter.
    echo.
    call "%~dp0INSTALL.bat" silent
)

REM ── Ouvrir le navigateur après 3 secondes ────────────────────────────────
start /b cmd /c "timeout /t 3 /nobreak >nul && start http://localhost:3001"

REM ── Démarrer l'application ───────────────────────────────────────────────
echo.
echo  ╔══════════════════════════════════════╗
echo  ║        Fleure Organize               ║
echo  ║  http://localhost:3001               ║
echo  ║                                      ║
echo  ║  Laisse cette fenetre ouverte.       ║
echo  ║  Ferme-la pour arreter l'appli.      ║
echo  ╚══════════════════════════════════════╝
echo.

set NODE_ENV=production
set DB_PATH=%~dp0backend\data\fleure.db
set UPLOADS_DIR=%~dp0backend\uploads

bun backend/server.js
