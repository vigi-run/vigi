#!/bin/bash

BASE_URL="http://localhost:8034/api/v1"
EMAIL="test_invoice_$(date +%s)@example.com"
PASSWORD="Password@123"
NAME="Test User"

echo "---------------------------------------------------"
echo "1. Registering User: $EMAIL"
echo "---------------------------------------------------"
REGISTER_RES=$(curl -s -X POST "$BASE_URL/auth/register" \
  -H "Content-Type: application/json" \
  -d "{\"email\": \"$EMAIL\", \"password\": \"$PASSWORD\", \"name\": \"$NAME\"}")
echo $REGISTER_RES

echo ""
echo "---------------------------------------------------"
echo "2. Logging In"
echo "---------------------------------------------------"
LOGIN_RES=$(curl -s -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\": \"$EMAIL\", \"password\": \"$PASSWORD\"}")
TOKEN=$(echo $LOGIN_RES | jq -r '.data.accessToken')

if [ "$TOKEN" == "null" ]; then
  echo "Login failed. Exiting."
  exit 1
fi
echo "Token obtained."

echo ""
echo "---------------------------------------------------"
echo "3. Creating Organization"
echo "---------------------------------------------------"
ORG_NAME="Invoice Test Org $(date +%s)"
ORG_RES=$(curl -s -X POST "$BASE_URL/organizations" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"name\": \"$ORG_NAME\", \"slug\": \"inv-test-$(date +%s)\"}")
echo $ORG_RES
ORG_ID=$(echo $ORG_RES | jq -r '.data.id')
echo "Organization ID: $ORG_ID"

echo ""
echo "---------------------------------------------------"
echo "4. Creating Client"
echo "---------------------------------------------------"
CLIENT_RES=$(curl -s -X POST "$BASE_URL/organizations/$ORG_ID/clients" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"name\": \"Test Client\", \"classification\": \"company\", \"status\": \"active\"}")
echo $CLIENT_RES
CLIENT_ID=$(echo $CLIENT_RES | jq -r '.data.id')
echo "Client ID: $CLIENT_ID"

echo ""
echo "---------------------------------------------------"
echo "5. Creating Invoice"
echo "---------------------------------------------------"
INVOICE_NUM="INV-$(date +%s)"
INVOICE_RES=$(curl -s -X POST "$BASE_URL/organizations/$ORG_ID/invoices" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"clientId\": \"$CLIENT_ID\",
    \"number\": \"$INVOICE_NUM\",
    \"date\": \"$(date -u +"%Y-%m-%dT%H:%M:%SZ")\",
    \"dueDate\": \"$(date -v+30d -u +"%Y-%m-%dT%H:%M:%SZ")\",
    \"items\": [
        {\"description\": \"Service A\", \"quantity\": 10, \"unitPrice\": 50},
        {\"description\": \"Service B\", \"quantity\": 5, \"unitPrice\": 20.5}
    ]
  }")
echo $INVOICE_RES
INVOICE_ID=$(echo $INVOICE_RES | jq -r '.data.id')
echo "Invoice ID: $INVOICE_ID"

echo ""
echo "---------------------------------------------------"
echo "6. Listing Invoices"
echo "---------------------------------------------------"
LIST_RES=$(curl -s -X GET "$BASE_URL/organizations/$ORG_ID/invoices" \
  -H "Authorization: Bearer $TOKEN")
echo $LIST_RES | jq '.'

echo ""
echo "---------------------------------------------------"
echo "7. Getting Invoice Details"
echo "---------------------------------------------------"
GET_RES=$(curl -s -X GET "$BASE_URL/invoices/$INVOICE_ID" \
  -H "Authorization: Bearer $TOKEN")
echo $GET_RES | jq '.'

echo ""
echo "---------------------------------------------------"
echo "8. Updating Invoice (Status to SENT)"
echo "---------------------------------------------------"
UPDATE_RES=$(curl -s -X PATCH "$BASE_URL/invoices/$INVOICE_ID" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"status\": \"SENT\"}")
echo $UPDATE_RES | jq '.'

echo ""
echo "---------------------------------------------------"
echo "9. Verification Complete"
echo "---------------------------------------------------"
