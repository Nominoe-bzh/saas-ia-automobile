# Script PowerShell de test des endpoints API après déploiement
# Remplacez YOUR_DOMAIN par votre domaine Cloudflare Pages

$DOMAIN = "www.checktonvehicule.fr"
$BASE_URL = "https://$DOMAIN"

Write-Host "===================================" -ForegroundColor Cyan
Write-Host "Test des endpoints API" -ForegroundColor Cyan
Write-Host "Domain: $BASE_URL" -ForegroundColor Cyan
Write-Host "===================================" -ForegroundColor Cyan
Write-Host ""

# Test 1: Inscription liste d'attente
Write-Host "1. Test /api/join (inscription liste d'attente)" -ForegroundColor Yellow
Write-Host "-----------------------------------"
$body1 = @{
    email = "test@example.com"
    prenom = "Test"
    type_utilisateur = "Particulier"
} | ConvertTo-Json

try {
    $response1 = Invoke-WebRequest -Uri "$BASE_URL/api/join" -Method POST -Body $body1 -ContentType "application/json" -UseBasicParsing
    Write-Host "Status: $($response1.StatusCode)" -ForegroundColor Green
    Write-Host $response1.Content
} catch {
    Write-Host "Erreur: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

# Test 2: Analyse IA
Write-Host "2. Test /api/analyse (analyse IA)" -ForegroundColor Yellow
Write-Host "-----------------------------------"
$body2 = @{
    annonce = "Renault Clio 4, 2015, 80000 km, diesel, bon etat, 7500 euros"
    email = "test@example.com"
} | ConvertTo-Json

try {
    $response2 = Invoke-WebRequest -Uri "$BASE_URL/api/analyse" -Method POST -Body $body2 -ContentType "application/json" -UseBasicParsing
    Write-Host "Status: $($response2.StatusCode)" -ForegroundColor Green
    Write-Host $response2.Content
} catch {
    Write-Host "Erreur: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

# Test 3: Historique
Write-Host "3. Test /api/historique (recuperation analyses)" -ForegroundColor Yellow
Write-Host "-----------------------------------"
$body3 = @{
    email = "test@example.com"
} | ConvertTo-Json

try {
    $response3 = Invoke-WebRequest -Uri "$BASE_URL/api/historique" -Method POST -Body $body3 -ContentType "application/json" -UseBasicParsing
    Write-Host "Status: $($response3.StatusCode)" -ForegroundColor Green
    Write-Host $response3.Content
} catch {
    Write-Host "Erreur: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

Write-Host "===================================" -ForegroundColor Cyan
Write-Host "Tests termines" -ForegroundColor Cyan
Write-Host "===================================" -ForegroundColor Cyan

