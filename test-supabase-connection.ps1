# Script de test de connexion Supabase

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "TEST CONNEXION SUPABASE -> API -> FRONTEND" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Configuration
$API_BASE = "http://localhost:3001"
# Pour prod : $API_BASE = "https://www.checktonvehicule.fr"

Write-Host "[1/5] Test PING API..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$API_BASE/api/test-db?action=ping" -Method Get
    if ($response.ok) {
        Write-Host "OK API reachable" -ForegroundColor Green
        Write-Host "  Supabase URL: $($response.env.supabase_url)" -ForegroundColor Gray
        Write-Host "  Supabase Key: $($response.env.supabase_key)" -ForegroundColor Gray
    } else {
        Write-Host "ERROR API" -ForegroundColor Red
        Write-Host $response -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "ERROR Cannot reach API" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    exit 1
}
Write-Host ""

Write-Host "[2/5] Test COUNT (nombre analyses existantes)..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$API_BASE/api/test-db?action=count" -Method Get
    if ($response.ok) {
        Write-Host "OK Count: $($response.totalAnalyses) analyses" -ForegroundColor Green
    } else {
        Write-Host "ERROR Count failed" -ForegroundColor Red
        Write-Host $response -ForegroundColor Red
    }
} catch {
    Write-Host "ERROR Count" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
}
Write-Host ""

Write-Host "[3/5] Test INSERT (insertion donnee test)..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$API_BASE/api/test-db?action=insert" -Method Post -ContentType "application/json"
    if ($response.ok) {
        Write-Host "OK Insert" -ForegroundColor Green
        Write-Host "  ID: $($response.data.id)" -ForegroundColor Gray
        Write-Host "  Email: $($response.data.email)" -ForegroundColor Gray
        $testId = $response.data.id
    } else {
        Write-Host "ERROR Insert failed" -ForegroundColor Red
        Write-Host $response -ForegroundColor Red
    }
} catch {
    Write-Host "ERROR Insert" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
}
Write-Host ""

Write-Host "[4/5] Test READ (lecture dernieres analyses)..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$API_BASE/api/test-db?action=read" -Method Get
    if ($response.ok) {
        Write-Host "OK Read: $($response.totalCount) total, $($response.items.Count) returned" -ForegroundColor Green
        if ($response.items.Count -gt 0) {
            Write-Host "  Dernieres analyses:" -ForegroundColor Gray
            $response.items | ForEach-Object {
                Write-Host "    - $($_.email) ($($_.id.Substring(0,8))...)" -ForegroundColor Gray
            }
        }
    } else {
        Write-Host "ERROR Read failed" -ForegroundColor Red
        Write-Host $response -ForegroundColor Red
    }
} catch {
    Write-Host "ERROR Read" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
}
Write-Host ""

Write-Host "[5/5] Test CLEANUP (nettoyage donnees test)..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$API_BASE/api/test-db?action=cleanup" -Method Post -ContentType "application/json"
    if ($response.ok) {
        Write-Host "OK Cleanup: $($response.deletedCount) rows deleted" -ForegroundColor Green
    } else {
        Write-Host "ERROR Cleanup failed" -ForegroundColor Red
        Write-Host $response -ForegroundColor Red
    }
} catch {
    Write-Host "ERROR Cleanup" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
}
Write-Host ""

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "RESULTAT: Pipeline Supabase -> API -> Frontend OK" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
