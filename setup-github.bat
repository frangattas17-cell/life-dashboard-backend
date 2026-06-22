@echo off
echo.
echo  *** Life Dashboard Pro - Subir a GitHub ***
echo  ============================================
echo.

cd /d "%~dp0"

echo [1/4] Inicializando repositorio git...
git init
if errorlevel 1 (echo ERROR: git no esta instalado. Instala Git desde https://git-scm.com & pause & exit)

echo.
echo [2/4] Agregando todos los archivos...
git add .
git status

echo.
echo [3/4] Creando commit inicial...
git commit -m "Initial commit: Life Dashboard Pro backend - ORT 2026"

echo.
echo [4/4] Conectando con GitHub y subiendo...
git remote add origin https://github.com/franciscogattas07-ux/life-dashboard-backend.git
git branch -M main
git push -u origin main

echo.
echo  ============================================
echo  LISTO! El codigo esta en GitHub.
echo  URL: https://github.com/franciscogattas07-ux/life-dashboard-backend
echo  ============================================
echo.
pause
