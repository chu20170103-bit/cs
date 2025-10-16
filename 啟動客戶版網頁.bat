@echo off
chcp 65001 >nul
echo ========================================
echo   客戶專用網頁 - 本地測試伺服器
echo ========================================
echo.
echo 🚀 正在啟動本地伺服器...
echo 📱 請在瀏覽器開啟: http://localhost:8081
echo.
echo ⚠️  注意：這是客戶版本（+4方案）
echo.
echo 按 Ctrl+C 可停止伺服器
echo ========================================
echo.

python -m http.server 8081

pause

