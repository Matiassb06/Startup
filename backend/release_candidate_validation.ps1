$ErrorActionPreference = 'Stop'

$baseUrl = 'http://127.0.0.1:8000'
$adminId = 4
$windowDays = 30

function Step {
    param([string]$Message)
    Write-Host "`n==> $Message" -ForegroundColor Cyan
}

function Assert {
    param([bool]$Condition, [string]$Message)
    if (-not $Condition) {
        throw "ASSERT FAILED: $Message"
    }
}

Step 'API root and DB health'
$root = Invoke-RestMethod -Method Get -Uri "$baseUrl/"
$health = Invoke-RestMethod -Method Get -Uri "$baseUrl/health"
Assert ($root.status -eq 'active') 'Root endpoint no responde activo'
Assert ($health.status -eq 'ok') 'Health endpoint no responde ok'

Step 'Critical E2E smoke'
. "$PSScriptRoot\phase1_smoke_test.ps1"

Step 'Metrics summary snapshot'
$metrics = Invoke-RestMethod -Method Get -Uri "$baseUrl/admin/metrics/summary?admin_id=$adminId&window_days=$windowDays"

Write-Host "`n=== Release Candidate Metrics ===" -ForegroundColor Yellow
$metrics | ConvertTo-Json -Depth 10

Assert ($metrics.published_opportunities -ge 1) 'Debe existir al menos 1 oportunidad publicada'
Assert ($metrics.apply_attempts -ge 1) 'Debe existir al menos 1 intento de apply'

Write-Host "`n✅ DAY 10 RC PASSED" -ForegroundColor Green
