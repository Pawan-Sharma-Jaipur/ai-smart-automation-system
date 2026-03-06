@echo off
echo Generating Self-Signed SSL Certificate...
echo.

cd ssl

openssl req -x509 -newkey rsa:4096 -keyout server.key -out server.cert -days 365 -nodes -subj "/C=IN/ST=State/L=City/O=AI Automation/CN=localhost"

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ✅ SSL Certificate generated successfully!
    echo.
    echo Files created:
    echo   - ssl/server.key
    echo   - ssl/server.cert
    echo.
    echo HTTPS will be available on port 3443
) else (
    echo.
    echo ❌ OpenSSL not found!
    echo.
    echo Please install OpenSSL:
    echo   1. Download from: https://slproweb.com/products/Win32OpenSSL.html
    echo   2. Install Win64 OpenSSL
    echo   3. Run this script again
)

pause
