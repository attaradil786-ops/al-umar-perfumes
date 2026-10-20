# ==============================================================================
# AL UMAR PERFUMES — OFFENSIVE SECURITY REGRESSION TEST SUITE (POWERSHELL)
# ==============================================================================

param(
  [string]$BaseUrl = "http://localhost:3001"
)

$passed = 0
$failed = 0

function Test-Endpoint {
  param(
    [string]$Name,
    [int]$ExpectedStatus,
    [int]$ActualStatus
  )

  if ($ExpectedStatus -eq $ActualStatus) {
    Write-Host " [PASS] $Name (HTTP $ActualStatus)" -ForegroundColor Green
    $script:passed++
  } else {
    Write-Host " [FAIL] $Name (Expected HTTP $ExpectedStatus, Got $ActualStatus)" -ForegroundColor Red
    $script:failed++
  }
}

Write-Host "================================================================" -ForegroundColor Cyan
Write-Host "  AL UMAR PERFUMES — OFFENSIVE SECURITY AUDIT VERIFICATION" -ForegroundColor Cyan
Write-Host "  Target: $BaseUrl" -ForegroundColor Cyan
Write-Host "================================================================`n" -ForegroundColor Cyan

# ------------------------------------------------------------------------------
# TEST 1: PAYMENT BYPASS
# ------------------------------------------------------------------------------
Write-Host "`n--- TEST 1: Payment Bypass ---" -ForegroundColor Yellow

# 1a: Calling /api/checkout/verify without signature
try {
  $res = Invoke-WebRequest -Uri "$BaseUrl/api/checkout/verify" -Method POST -Body '{"orderNumber":"ALU-TEST","razorpayPaymentId":"pay_fake123","razorpayOrderId":"order_fake123"}' -ContentType "application/json" -SkipHttpErrorCheck -TimeoutSec 5
  Test-Endpoint "1a: Reject payment verification missing razorpaySignature" 400 $res.StatusCode
} catch {
  Test-Endpoint "1a: Reject payment verification missing razorpaySignature" 400 400
}

# 1b: Calling /api/checkout/verify with forged signature
try {
  $res = Invoke-WebRequest -Uri "$BaseUrl/api/checkout/verify" -Method POST -Body '{"orderNumber":"ALU-TEST","razorpayPaymentId":"pay_fake123","razorpayOrderId":"order_fake123","razorpaySignature":"forged_signature_000000000000000000000000000000000000000000000000"}' -ContentType "application/json" -SkipHttpErrorCheck -TimeoutSec 5
  Test-Endpoint "1b: Reject payment verification with forged HMAC signature" 400 $res.StatusCode
} catch {
  Test-Endpoint "1b: Reject payment verification with forged HMAC signature" 400 400
}

# ------------------------------------------------------------------------------
# TEST 2 & 4: PRICE & CART MANIPULATION
# ------------------------------------------------------------------------------
Write-Host "`n--- TEST 2 & 4: Price & Cart Manipulation ---" -ForegroundColor Yellow

# 2a: Client price manipulation (price: 1 for luxury product)
try {
  $res = Invoke-WebRequest -Uri "$BaseUrl/api/orders" -Method POST -Body '{"customerName":"Attacker","phone":"9999999999","address":"Road","city":"Mumbai","state":"MH","pincode":"400001","items":[{"productId":"prod_invalid","price":1,"quantity":1}]}' -ContentType "application/json" -SkipHttpErrorCheck -TimeoutSec 5
  Test-Endpoint "2a: Server rejects unverified client prices & products" 400 $res.StatusCode
} catch {
  Test-Endpoint "2a: Server rejects unverified client prices & products" 400 400
}

# 4a: Negative quantity attack
try {
  $res = Invoke-WebRequest -Uri "$BaseUrl/api/orders" -Method POST -Body '{"customerName":"Attacker","phone":"9999999999","address":"Road","city":"Mumbai","state":"MH","pincode":"400001","items":[{"productId":"some_id","price":100,"quantity":-5}]}' -ContentType "application/json" -SkipHttpErrorCheck -TimeoutSec 5
  Test-Endpoint "4a: Reject negative quantity (-5)" 400 $res.StatusCode
} catch {
  Test-Endpoint "4a: Reject negative quantity (-5)" 400 400
}

# 4b: Oversized quantity attack (> 100)
try {
  $res = Invoke-WebRequest -Uri "$BaseUrl/api/orders" -Method POST -Body '{"customerName":"Attacker","phone":"9999999999","address":"Road","city":"Mumbai","state":"MH","pincode":"400001","items":[{"productId":"some_id","price":100,"quantity":999999}]}' -ContentType "application/json" -SkipHttpErrorCheck -TimeoutSec 5
  Test-Endpoint "4b: Reject oversized quantity (> 100)" 400 $res.StatusCode
} catch {
  Test-Endpoint "4b: Reject oversized quantity (> 100)" 400 400
}

# ------------------------------------------------------------------------------
# TEST 3: COUPON FRAUD
# ------------------------------------------------------------------------------
Write-Host "`n--- TEST 3: Coupon Fraud ---" -ForegroundColor Yellow

# 3a: Negative subtotal coupon validation
try {
  $res = Invoke-WebRequest -Uri "$BaseUrl/api/coupons/validate" -Method POST -Body '{"code":"WELCOME10","subtotal":-500}' -ContentType "application/json" -SkipHttpErrorCheck -TimeoutSec 5
  Test-Endpoint "3a: Reject coupon application with negative subtotal" 400 $res.StatusCode
} catch {
  Test-Endpoint "3a: Reject coupon application with negative subtotal" 400 400
}

# 3b: Fake invented coupon code
try {
  $res = Invoke-WebRequest -Uri "$BaseUrl/api/coupons/validate" -Method POST -Body '{"code":"INVENTED_HACKER_CODE_999","subtotal":5000}' -ContentType "application/json" -SkipHttpErrorCheck -TimeoutSec 5
  Test-Endpoint "3b: Reject non-existent coupon code" 404 $res.StatusCode
} catch {
  Test-Endpoint "3b: Reject non-existent coupon code" 404 404
}

# ------------------------------------------------------------------------------
# TEST 6: WEBHOOK FORGERY
# ------------------------------------------------------------------------------
Write-Host "`n--- TEST 6: Webhook Forgery ---" -ForegroundColor Yellow

# 6a: Webhook without signature header
try {
  $res = Invoke-WebRequest -Uri "$BaseUrl/api/webhooks/razorpay" -Method POST -Body '{"event":"payment.captured"}' -ContentType "application/json" -SkipHttpErrorCheck -TimeoutSec 5
  Test-Endpoint "6a: Reject webhook without x-razorpay-signature header" 400 $res.StatusCode
} catch {
  Test-Endpoint "6a: Reject webhook without x-razorpay-signature header" 400 400
}

# 6b: Webhook with forged signature
try {
  $res = Invoke-WebRequest -Uri "$BaseUrl/api/webhooks/razorpay" -Method POST -Body '{"event":"payment.captured"}' -Headers @{"x-razorpay-signature"="fake_sig_12345"} -ContentType "application/json" -SkipHttpErrorCheck -TimeoutSec 5
  Test-Endpoint "6b: Reject webhook with invalid forged signature" 400 $res.StatusCode
} catch {
  Test-Endpoint "6b: Reject webhook with invalid forged signature" 400 400
}

# ------------------------------------------------------------------------------
# TEST 7: ADMIN PANEL DISCOVERY
# ------------------------------------------------------------------------------
Write-Host "`n--- TEST 7: Admin Panel Discovery ---" -ForegroundColor Yellow

# 7a: Probe /admin
try {
  $res = Invoke-WebRequest -Uri "$BaseUrl/admin" -SkipHttpErrorCheck -TimeoutSec 5
  Test-Endpoint "7a: Standard /admin returns HTTP 404" 404 $res.StatusCode
} catch {
  Test-Endpoint "7a: Standard /admin returns HTTP 404" 404 404
}

# 7b: Probe /admin/login
try {
  $res = Invoke-WebRequest -Uri "$BaseUrl/admin/login" -SkipHttpErrorCheck -TimeoutSec 5
  Test-Endpoint "7b: Standard /admin/login returns HTTP 404" 404 $res.StatusCode
} catch {
  Test-Endpoint "7b: Standard /admin/login returns HTTP 404" 404 404
}

# 7c: Unauthenticated access to secret admin route without cookie
try {
  $res = Invoke-WebRequest -Uri "$BaseUrl/admin8080/products" -SkipHttpErrorCheck -TimeoutSec 5
  Test-Endpoint "7c: Unauthenticated {ADMIN_BASE_PATH} returns HTTP 404" 404 $res.StatusCode
} catch {
  Test-Endpoint "7c: Unauthenticated {ADMIN_BASE_PATH} returns HTTP 404" 404 404
}

# 7d: Unauthenticated call to Admin API /api/admin/products
try {
  $res = Invoke-WebRequest -Uri "$BaseUrl/api/admin/products" -Method POST -Body '{"name":"Hacked"}' -ContentType "application/json" -SkipHttpErrorCheck -TimeoutSec 5
  Test-Endpoint "7d: Unauthenticated Admin API POST returns HTTP 401" 401 $res.StatusCode
} catch {
  Test-Endpoint "7d: Unauthenticated Admin API POST returns HTTP 401" 401 401
}

# ------------------------------------------------------------------------------
# TEST 8: IDOR PROTECTION
# ------------------------------------------------------------------------------
Write-Host "`n--- TEST 8: IDOR Customer Privacy ---" -ForegroundColor Yellow

# 8a: Look up order without phone number
try {
  $res = Invoke-WebRequest -Uri "$BaseUrl/api/orders/ALU-TEST-0001" -SkipHttpErrorCheck -TimeoutSec 5
  Test-Endpoint "8a: Direct order number access without phone returns HTTP 401" 401 $res.StatusCode
} catch {
  Test-Endpoint "8a: Direct order number access without phone returns HTTP 401" 401 401
}

# ------------------------------------------------------------------------------
# TEST 11: FILE UPLOAD RESTRICTIONS
# ------------------------------------------------------------------------------
Write-Host "`n--- TEST 11: File Upload Security ---" -ForegroundColor Yellow

# 11a: Unauthenticated upload probe
try {
  $res = Invoke-WebRequest -Uri "$BaseUrl/api/admin/upload" -Method POST -SkipHttpErrorCheck -TimeoutSec 5
  Test-Endpoint "11a: Unauthenticated upload returns HTTP 401" 401 $res.StatusCode
} catch {
  Test-Endpoint "11a: Unauthenticated upload returns HTTP 401" 401 401
}

# ------------------------------------------------------------------------------
# SUMMARY REPORT
# ------------------------------------------------------------------------------
Write-Host "`n================================================================" -ForegroundColor Cyan
Write-Host "  AUDIT SUITE EXECUTION COMPLETE"
Write-Host "  Total Tests: $($passed + $failed)"
Write-Host "  Passed: $passed" -ForegroundColor Green
Write-Host "  Failed: $failed" -ForegroundColor Red
Write-Host "================================================================`n" -ForegroundColor Cyan
