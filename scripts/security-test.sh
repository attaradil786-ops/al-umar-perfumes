#!/usr/bin/env bash
# ==============================================================================
# AL UMAR PERFUMES — AUTOMATED OFFENSIVE SECURITY REGRESSION TEST SUITE
# ==============================================================================

BASE_URL="${1:-http://localhost:3001}"
PASS_COUNT=0
FAIL_COUNT=0

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

echo -e "${CYAN}================================================================${NC}"
echo -e "${CYAN}  AL UMAR PERFUMES — OFFENSIVE SECURITY AUDIT VERIFICATION    ${NC}"
echo -e "${CYAN}  Target: ${BASE_URL}                                         ${NC}"
echo -e "${CYAN}================================================================${NC}\n"

run_test() {
  local test_name="$1"
  local expected_status="$2"
  local actual_status="$3"
  local extra_check="$4"

  if [ "$expected_status" -eq "$actual_status" ]; then
    echo -e " [${GREEN}PASS${NC}] ${test_name} (HTTP ${actual_status})"
    ((PASS_COUNT++))
  else
    echo -e " [${RED}FAIL${NC}] ${test_name} (Expected HTTP ${expected_status}, Got ${actual_status})"
    ((FAIL_COUNT++))
  fi
}

# ------------------------------------------------------------------------------
# TEST 1: PAYMENT BYPASS
# ------------------------------------------------------------------------------
echo -e "\n${YELLOW}--- TEST 1: Payment Bypass ---${NC}"

# 1a: Calling /api/checkout/verify without signature
STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X POST "${BASE_URL}/api/checkout/verify" \
  -H "Content-Type: application/json" \
  -d '{"orderNumber":"ALU-TEST","razorpayPaymentId":"pay_fake123","razorpayOrderId":"order_fake123"}')
run_test "1a: Reject payment verification missing razorpaySignature" 400 "$STATUS"

# 1b: Calling /api/checkout/verify with forged signature
STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X POST "${BASE_URL}/api/checkout/verify" \
  -H "Content-Type: application/json" \
  -d '{"orderNumber":"ALU-TEST","razorpayPaymentId":"pay_fake123","razorpayOrderId":"order_fake123","razorpaySignature":"forged_signature_000000000000000000000000000000000000000000000000"}')
run_test "1b: Reject payment verification with forged HMAC signature" 400 "$STATUS"

# ------------------------------------------------------------------------------
# TEST 2 & 4: PRICE MANIPULATION & NEGATIVE/OVERSIZED QUANTITY
# ------------------------------------------------------------------------------
echo -e "\n${YELLOW}--- TEST 2 & 4: Price & Cart Manipulation ---${NC}"

# 2a: Client price manipulation (price: 1 for luxury product)
RESP=$(curl -s -X POST "${BASE_URL}/api/orders" \
  -H "Content-Type: application/json" \
  -d '{"customerName":"Attacker","phone":"9999999999","address":"Road","city":"Mumbai","state":"MH","pincode":"400001","items":[{"productId":"prod_invalid","price":1,"quantity":1}]}')
STATUS=$(echo "$RESP" | grep -q "no longer active" && echo 400 || echo 200)
run_test "2a: Server rejects unverified client prices & products" 400 "$STATUS"

# 4a: Negative quantity attack
STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X POST "${BASE_URL}/api/orders" \
  -H "Content-Type: application/json" \
  -d '{"customerName":"Attacker","phone":"9999999999","address":"Road","city":"Mumbai","state":"MH","pincode":"400001","items":[{"productId":"some_id","price":100,"quantity":-5}]}')
run_test "4a: Reject negative quantity (-5)" 400 "$STATUS"

# 4b: Oversized quantity attack (> 100)
STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X POST "${BASE_URL}/api/orders" \
  -H "Content-Type: application/json" \
  -d '{"customerName":"Attacker","phone":"9999999999","address":"Road","city":"Mumbai","state":"MH","pincode":"400001","items":[{"productId":"some_id","price":100,"quantity":999999}]}')
run_test "4b: Reject oversized quantity (> 100)" 400 "$STATUS"

# ------------------------------------------------------------------------------
# TEST 3: COUPON FRAUD
# ------------------------------------------------------------------------------
echo -e "\n${YELLOW}--- TEST 3: Coupon Fraud ---${NC}"

# 3a: Negative subtotal coupon validation
STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X POST "${BASE_URL}/api/coupons/validate" \
  -H "Content-Type: application/json" \
  -d '{"code":"WELCOME10","subtotal":-500}')
run_test "3a: Reject coupon application with negative subtotal" 400 "$STATUS"

# 3b: Fake invented coupon code
STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X POST "${BASE_URL}/api/coupons/validate" \
  -H "Content-Type: application/json" \
  -d '{"code":"INVENTED_HACKER_CODE_999","subtotal":5000}')
run_test "3b: Reject non-existent coupon code" 404 "$STATUS"

# ------------------------------------------------------------------------------
# TEST 6: WEBHOOK FORGERY
# ------------------------------------------------------------------------------
echo -e "\n${YELLOW}--- TEST 6: Webhook Forgery ---${NC}"

# 6a: Webhook without signature header
STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X POST "${BASE_URL}/api/webhooks/razorpay" \
  -H "Content-Type: application/json" \
  -d '{"event":"payment.captured"}')
run_test "6a: Reject webhook without x-razorpay-signature header" 400 "$STATUS"

# 6b: Webhook with forged signature
STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X POST "${BASE_URL}/api/webhooks/razorpay" \
  -H "Content-Type: application/json" \
  -H "x-razorpay-signature: fake_signature_12345" \
  -d '{"event":"payment.captured"}')
run_test "6b: Reject webhook with invalid forged signature" 400 "$STATUS"

# ------------------------------------------------------------------------------
# TEST 7: ADMIN PANEL DISCOVERY & ACCESS
# ------------------------------------------------------------------------------
echo -e "\n${YELLOW}--- TEST 7: Admin Panel Discovery ---${NC}"

# 7a: Probe /admin
STATUS=$(curl -s -o /dev/null -w "%{http_code}" "${BASE_URL}/admin")
run_test "7a: Standard /admin returns HTTP 404" 404 "$STATUS"

# 7b: Probe /admin/login
STATUS=$(curl -s -o /dev/null -w "%{http_code}" "${BASE_URL}/admin/login")
run_test "7b: Standard /admin/login returns HTTP 404" 404 "$STATUS"

# 7c: Unauthenticated access to secret admin route without cookie
STATUS=$(curl -s -o /dev/null -w "%{http_code}" "${BASE_URL}/studio-alumar-9f7x2k/products")
run_test "7c: Unauthenticated {ADMIN_BASE_PATH} returns HTTP 404" 404 "$STATUS"

# 7d: Unauthenticated call to Admin API /api/admin/products
STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X POST "${BASE_URL}/api/admin/products" \
  -H "Content-Type: application/json" \
  -d '{"name":"Hacked"}')
run_test "7d: Unauthenticated Admin API POST returns HTTP 401" 401 "$STATUS"

# ------------------------------------------------------------------------------
# TEST 8: IDOR PROTECTION
# ------------------------------------------------------------------------------
echo -e "\n${YELLOW}--- TEST 8: IDOR Customer Privacy ---${NC}"

# 8a: Look up order without phone number
STATUS=$(curl -s -o /dev/null -w "%{http_code}" "${BASE_URL}/api/orders/ALU-TEST-0001")
run_test "8a: Direct order number access without phone returns HTTP 401" 401 "$STATUS"

# ------------------------------------------------------------------------------
# TEST 11: FILE UPLOAD RESTRICTIONS
# ------------------------------------------------------------------------------
echo -e "\n${YELLOW}--- TEST 11: File Upload Security ---${NC}"

# 11a: Unauthenticated upload probe
STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X POST "${BASE_URL}/api/admin/upload")
run_test "11a: Unauthenticated upload returns HTTP 401" 401 "$STATUS"

# ------------------------------------------------------------------------------
# TEST 12: INFORMATION DISCLOSURE
# ------------------------------------------------------------------------------
echo -e "\n${YELLOW}--- TEST 12: Information Disclosure ---${NC}"

# 12a: Health check sanitization
RESP=$(curl -s "${BASE_URL}/api/health")
HAS_RAW_LEAK=$(echo "$RESP" | grep -iE "(password|aws-0|supabase.co|database_url)" && echo 1 || echo 0)
if [ "$HAS_RAW_LEAK" -eq 0 ]; then
  echo -e " [${GREEN}PASS${NC}] 12a: /api/health does not leak raw database credentials or topology"
  ((PASS_COUNT++))
else
  echo -e " [${RED}FAIL${NC}] 12a: /api/health leaks raw database information!"
  ((FAIL_COUNT++))
fi

# ------------------------------------------------------------------------------
# SUMMARY REPORT
# ------------------------------------------------------------------------------
echo -e "\n${CYAN}================================================================${NC}"
echo -e "  AUDIT SUITE EXECUTION COMPLETE"
echo -e "  Total Tests: $((PASS_COUNT + FAIL_COUNT))"
echo -e "  Passed: ${GREEN}${PASS_COUNT}${NC}"
echo -e "  Failed: ${RED}${FAIL_COUNT}${NC}"
echo -e "${CYAN}================================================================${NC}\n"

if [ "$FAIL_COUNT" -gt 0 ]; then
  exit 1
fi
exit 0
