#!/bin/bash

# Clinical Decision Support API Test Script
# Tests all new CDS endpoints to ensure they're working correctly

API_URL="http://localhost:3001"
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  NeuroLogic CDS API Test Suite${NC}"
echo -e "${BLUE}========================================${NC}\n"

# Function to test API endpoint
test_endpoint() {
  local name=$1
  local method=$2
  local endpoint=$3
  local data=$4

  echo -e "${YELLOW}Testing: ${name}${NC}"

  if [ "$method" == "GET" ]; then
    response=$(curl -s -w "\n%{http_code}" "${API_URL}${endpoint}")
  else
    response=$(curl -s -w "\n%{http_code}" -X "$method" "${API_URL}${endpoint}" \
      -H "Content-Type: application/json" \
      -d "$data")
  fi

  http_code=$(echo "$response" | tail -n1)
  body=$(echo "$response" | sed '$d')

  if [ "$http_code" -eq 200 ]; then
    echo -e "${GREEN}✓ SUCCESS${NC} (HTTP $http_code)"
    echo "$body" | python3 -m json.tool 2>/dev/null || echo "$body"
  else
    echo -e "${RED}✗ FAILED${NC} (HTTP $http_code)"
    echo "$body"
  fi

  echo -e "\n"
}

# 1. Test Health Endpoint
test_endpoint "Health Check" "GET" "/api/health"

# 2. Test CURB-65 Calculator
test_endpoint "CURB-65 Calculator" "POST" "/api/calculate" '{
  "calculatorType": "curb65",
  "params": {
    "confusion": true,
    "urea": 25,
    "respiratoryRate": 32,
    "bloodPressure": {"systolic": 85, "diastolic": 55},
    "age": 78
  }
}'

# 3. Test CHA2DS2-VASc Calculator
test_endpoint "CHA2DS2-VASc Calculator" "POST" "/api/calculate" '{
  "calculatorType": "chads2vasc",
  "params": {
    "chf": true,
    "hypertension": true,
    "age": 76,
    "diabetes": false,
    "stroke": false,
    "vascular": true,
    "sex": "female"
  }
}'

# 4. Test Drug Interaction Check
test_endpoint "Drug Interaction Check" "POST" "/api/check-interactions" '{
  "medications": ["warfarin", "aspirin", "amiodarone"]
}'

# 5. Test Clinical Alerts Detection
test_endpoint "Clinical Alerts Detection" "POST" "/api/detect-alerts" '{
  "clinicalData": {
    "vitals": "BP 82/50, HR 125, RR 32, T 102.5, SpO2 85%",
    "labs": "WBC 22, lactate 5.2, troponin 3.5, potassium 6.8",
    "assessment": "Patient with fever, hypotension, confusion"
  }
}'

# 6. Test Guidelines List
test_endpoint "List Clinical Guidelines" "GET" "/api/guidelines"

# 7. Test Specific Guideline
test_endpoint "Pneumonia Guideline" "GET" "/api/guideline/pneumonia"

# 8. Test Comprehensive Clinical Decision Support
test_endpoint "Comprehensive CDS" "POST" "/api/clinical-decision-support" '{
  "clinicalScenario": "68 year old male with 3 days of fever, cough, dyspnea. CXR shows RLL infiltrate.",
  "patientData": {
    "age": 68,
    "vitals": "BP 110/70, HR 102, RR 24, T 101.8, SpO2 91% on RA",
    "labs": "WBC 15.2, Cr 1.2",
    "pmh": "COPD, HTN, former smoker"
  },
  "question": "Should this patient be admitted? What is the recommended treatment?",
  "includeDrugInteractions": false
}'

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  Test Suite Complete${NC}"
echo -e "${BLUE}========================================${NC}"
