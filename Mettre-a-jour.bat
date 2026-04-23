@echo off
cd /d "%~dp0"
title Mise a jour - Fleure Organize

echo.
echo  Mise a jour de Fleure Organize...
echo  (Ferme l'application avant de continuer)
echo.
pause

REM ── Récupérer les modifications depuis GitHub ────────────────────────────
echo  [1/3] Recuperation des mises a jour...
git pull origin master
if %errorlevel% neq 0 (
    echo.
    echo  ERREUR lors de la mise a jour. Contacte Morgan.
    pause
    exit /b 1
)

REM ── Mettre à jour les dépendances et rebuilder ───────────────────────────
echo  [2/3] Mise a jour des dependances...
bun install --frozen-lockfile 2>nul || bun install
cd frontend
bun install --frozen-lockfile 2>nul || bun install

echo  [3/3] Reconstruction de l'application...
bun run build
cd ..

echo.
echo  ✓ Mise a jour terminee !
echo  Lance "Demarrer.bat" pour relancer l'application.
echo.
pause
