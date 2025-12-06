#!/bin/bash
# Script de test des endpoints API après déploiement
# Remplacez YOUR_DOMAIN par votre domaine Cloudflare Pages

DOMAIN="YOUR_DOMAIN.pages.dev"
BASE_URL="https://$DOMAIN"

echo "==================================="
echo "Test des endpoints API"
echo "Domain: $BASE_URL"
echo "==================================="
echo ""

# Test 1: Inscription liste d'attente
echo "1. Test /api/join (inscription liste d'attente)"
echo "-----------------------------------"
curl -X POST "$BASE_URL/api/join" \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","prenom":"Test","type_utilisateur":"Particulier"}' \
  -w "\nHTTP Status: %{http_code}\n" \
  -s
echo ""
echo ""

# Test 2: Analyse IA
echo "2. Test /api/analyse (analyse IA)"
echo "-----------------------------------"
curl -X POST "$BASE_URL/api/analyse" \
  -H "Content-Type: application/json" \
  -d '{"annonce":"Renault Clio 4, 2015, 80000 km, diesel, bon etat, 7500 euros","email":"test@example.com"}' \
  -w "\nHTTP Status: %{http_code}\n" \
  -s
echo ""
echo ""

# Test 3: Historique
echo "3. Test /api/historique (recuperation analyses)"
echo "-----------------------------------"
curl -X POST "$BASE_URL/api/historique" \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com"}' \
  -w "\nHTTP Status: %{http_code}\n" \
  -s
echo ""
echo ""

echo "==================================="
echo "Tests termines"
echo "==================================="

