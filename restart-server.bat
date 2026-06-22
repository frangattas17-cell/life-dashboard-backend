@echo off
echo Deteniendo servidor anterior...
taskkill /f /im node.exe >nul 2>&1
timeout /t 1 /nobreak >nul

cd /d "%~dp0"

for /f "tokens=1,2 delims==" %%a in (.env) do (
  if not "%%a"=="" if not "%%b"=="" set %%a=%%b
)

echo Iniciando servidor actualizado en http://localhost:3000
echo (Ctrl+C para detener)
echo.
node server.js
