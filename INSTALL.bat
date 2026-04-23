@echo off
cd /d "%~dp0"

if "%1"=="silent" goto install

title Installation - Fleure Organize
echo.
echo  Installation de Fleure Organize...
echo.

:install

REM ── Dossiers de données ───────────────────────────────────────────────────
if not exist "backend\data" mkdir backend\data
if not exist "backend\uploads" mkdir backend\uploads

REM ── Dépendances backend ───────────────────────────────────────────────────
echo  [1/3] Installation des dependances...
bun install --frozen-lockfile 2>nul || bun install

REM ── Dépendances frontend ─────────────────────────────────────────────────
cd frontend
bun install --frozen-lockfile 2>nul || bun install

REM ── Build frontend ────────────────────────────────────────────────────────
echo  [2/3] Construction de l'application...
bun run build
cd ..

echo  [3/3] Termine !

if "%1"=="silent" exit /b 0

echo.
echo  Lance "Demarrer.bat" pour utiliser l'application.
echo.
pause
