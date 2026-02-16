$root = Split-Path -Parent $MyInvocation.MyCommand.Path

$backendCmd = "Set-Location '$root\backend'; ..\.venv\Scripts\python.exe -m uvicorn main:app --reload"
$frontendCmd = "Set-Location '$root\frontend'; npm run dev"

Start-Process powershell -ArgumentList "-NoExit", "-Command", $backendCmd
Start-Process powershell -ArgumentList "-NoExit", "-Command", $frontendCmd

Write-Host "Backend:  http://127.0.0.1:8000"
Write-Host "Frontend: http://localhost:5173 (or 5174 if 5173 is busy)"
