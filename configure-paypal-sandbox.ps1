Write-Host "TAKIVIVU PayPal Sandbox setup" -ForegroundColor Cyan
$clientId = Read-Host "Nhap PayPal Sandbox Client ID"
$secret = Read-Host "Nhap PayPal Sandbox Client Secret" -AsSecureString
$ptr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secret)
try {
    $plain = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($ptr)
    $env:PAYPAL_CLIENT_ID = $clientId
    $env:PAYPAL_CLIENT_SECRET = $plain
    $env:PAYPAL_WEBHOOK_ID = "07D93417BD692080A"
    $env:PAYPAL_VND_PER_USD = "25000"
    Write-Host "Da set bien moi truong cho CUA SO POWERSHELL HIEN TAI." -ForegroundColor Green
    Write-Host "Hay chay Payment Service tu chinh cua so nay neu dung Maven command." -ForegroundColor Yellow
    Write-Host "Neu chay bang IntelliJ, set cac Environment Variables trong Run Configuration cua 07 - Payment Service." -ForegroundColor Yellow
} finally {
    [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($ptr)
}
