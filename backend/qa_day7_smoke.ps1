$ErrorActionPreference = 'Stop'

$baseUrl = 'http://127.0.0.1:8000'
$stamp = [DateTimeOffset]::UtcNow.ToUnixTimeSeconds()

function Write-Step {
    param([string]$Message)
    Write-Host "`n==> $Message" -ForegroundColor Cyan
}

function Invoke-Api {
    param(
        [Parameter(Mandatory = $true)][string]$Method,
        [Parameter(Mandatory = $true)][string]$Path,
        [object]$Body = $null
    )

    $uri = "$baseUrl$Path"

    try {
        if ($null -ne $Body) {
            $json = $Body | ConvertTo-Json -Depth 10
            $result = Invoke-RestMethod -Method $Method -Uri $uri -ContentType 'application/json' -Body $json
        }
        else {
            $result = Invoke-RestMethod -Method $Method -Uri $uri
        }

        return @{ status = 200; body = $result }
    }
    catch {
        $statusCode = $_.Exception.Response.StatusCode.value__
        $stream = $_.Exception.Response.GetResponseStream()
        $reader = New-Object System.IO.StreamReader($stream)
        $raw = $reader.ReadToEnd()
        $parsed = $null

        try {
            $parsed = $raw | ConvertFrom-Json
        }
        catch {
            $parsed = @{ detail = $raw }
        }

        return @{ status = $statusCode; body = $parsed }
    }
}

function Assert-True {
    param(
        [Parameter(Mandatory = $true)][bool]$Condition,
        [Parameter(Mandatory = $true)][string]$Message
    )

    if (-not $Condition) {
        throw "ASSERT FAILED: $Message"
    }
}

Write-Step 'Health check'
$health = Invoke-Api -Method 'GET' -Path '/'
Assert-True -Condition ($health.status -eq 200) -Message 'API no responde en /'

Write-Step 'Create/reuse role users'
$company = Invoke-Api -Method 'POST' -Path '/users/' -Body @{
    email = "qa-company-$stamp@company.com"
    password_hash = 'qa'
    role = 'company'
    profile_data = @{ source = 'qa_day7' }
}
$admin = Invoke-Api -Method 'POST' -Path '/users/' -Body @{
    email = "qa-admin-$stamp@train.com"
    password_hash = 'qa'
    role = 'admin'
    profile_data = @{ source = 'qa_day7' }
}
$student = Invoke-Api -Method 'POST' -Path '/users/' -Body @{
    email = "qa-student-$stamp@student.com"
    password_hash = 'qa'
    role = 'student'
    profile_data = @{ source = 'qa_day7' }
}

$companyId = [int64]$company.body.id
$adminId = [int64]$admin.body.id
$studentId = [int64]$student.body.id

Assert-True -Condition ($companyId -gt 0) -Message 'No se obtuvo companyId'
Assert-True -Condition ($adminId -gt 0) -Message 'No se obtuvo adminId'
Assert-True -Condition ($studentId -gt 0) -Message 'No se obtuvo studentId'

Write-Step 'Company creates pending opportunity'
$oppCreate = Invoke-Api -Method 'POST' -Path '/company/opportunities/' -Body @{
    actor_user_id = $companyId
    title = "QA Day7 Opportunity $stamp"
    description = 'Flujo e2e QA automatizado'
    requirements = 'Testing, API, SQL'
}
Assert-True -Condition ($oppCreate.status -eq 200) -Message 'No se pudo crear oportunidad de empresa'
Assert-True -Condition ($oppCreate.body.status -eq 'pending_review') -Message 'La oportunidad no quedó en pending_review'
$opportunityId = [int64]$oppCreate.body.id

Write-Step 'Pending list contains opportunity'
$pending = Invoke-Api -Method 'GET' -Path "/admin/opportunities/pending?admin_id=$adminId"
Assert-True -Condition ($pending.status -eq 200) -Message 'No se pudo listar pendientes admin'
$pendingMatch = $pending.body | Where-Object { $_.id -eq $opportunityId }
Assert-True -Condition ($null -ne $pendingMatch) -Message 'La oportunidad no aparece en pendientes'

Write-Step 'Admin upserts course'
$courseUpsert = Invoke-Api -Method 'PATCH' -Path "/admin/opportunities/$opportunityId/course" -Body @{
    admin_id = $adminId
    content_url = "https://example.com/qa-day7-$stamp"
    quiz_data = @{ level = 'basic'; version = 'day7' }
}
Assert-True -Condition ($courseUpsert.status -eq 200) -Message 'No se pudo guardar curso asociado'
$courseId = [int64]$courseUpsert.body.id
Assert-True -Condition ($courseId -gt 0) -Message 'No se obtuvo courseId'

Write-Step 'Admin publishes opportunity'
$publish = Invoke-Api -Method 'PATCH' -Path "/admin/opportunities/$opportunityId/publish" -Body @{ admin_id = $adminId }
Assert-True -Condition ($publish.status -eq 200) -Message 'No se pudo publicar oportunidad'
Assert-True -Condition ($publish.body.status -eq 'published') -Message 'La oportunidad no quedó published'

Write-Step 'Student sees opportunity as locked'
$studentOpsBefore = Invoke-Api -Method 'GET' -Path "/students/$studentId/opportunities/"
Assert-True -Condition ($studentOpsBefore.status -eq 200) -Message 'No se pudo listar oportunidades de estudiante'
$studentOppBefore = $studentOpsBefore.body | Where-Object { $_.id -eq $opportunityId }
Assert-True -Condition ($null -ne $studentOppBefore) -Message 'El estudiante no ve la oportunidad publicada'
Assert-True -Condition (-not [bool]$studentOppBefore.can_apply) -Message 'La oportunidad no debería estar desbloqueada aún'

Write-Step 'Apply before complete is denied'
$applyDenied = Invoke-Api -Method 'POST' -Path '/apply/' -Body @{ user_id = $studentId; opportunity_id = $opportunityId }
Assert-True -Condition ($applyDenied.status -eq 403) -Message 'Apply debía devolver 403 antes de completar curso'

Write-Step 'Complete course'
$complete = Invoke-Api -Method 'POST' -Path "/courses/$courseId/complete" -Body @{ user_id = $studentId; score = 95 }
Assert-True -Condition ($complete.status -eq 200) -Message 'No se pudo completar curso'
Assert-True -Condition ([bool]$complete.body.is_completed) -Message 'is_completed no quedó true'

Write-Step 'Student sees opportunity unlocked'
$studentOpsAfter = Invoke-Api -Method 'GET' -Path "/students/$studentId/opportunities/"
$studentOppAfter = $studentOpsAfter.body | Where-Object { $_.id -eq $opportunityId }
Assert-True -Condition ($null -ne $studentOppAfter) -Message 'No aparece oportunidad tras completar curso'
Assert-True -Condition ([bool]$studentOppAfter.can_apply) -Message 'La oportunidad debería estar desbloqueada'

Write-Step 'Apply success and duplicate protection'
$applySuccess = Invoke-Api -Method 'POST' -Path '/apply/' -Body @{ user_id = $studentId; opportunity_id = $opportunityId }
Assert-True -Condition ($applySuccess.status -eq 200) -Message 'No se pudo postular tras completar curso'
$applyDuplicate = Invoke-Api -Method 'POST' -Path '/apply/' -Body @{ user_id = $studentId; opportunity_id = $opportunityId }
Assert-True -Condition ($applyDuplicate.status -eq 200) -Message 'Duplicado no devolvió respuesta manejada'

Write-Host "`n✅ QA Day 7 Smoke Test completado correctamente." -ForegroundColor Green
Write-Host "Opportunity ID: $opportunityId | Course ID: $courseId | Student ID: $studentId"
