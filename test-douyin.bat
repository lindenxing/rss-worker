@echo off
chcp 65001 >nul
echo === 抖音路由本地测试 ===
echo.

REM 检查 .dev.vars 文件是否存在
if not exist ".dev.vars" (
    echo ❌ 错误：.dev.vars 文件不存在
    echo 请先创建 .dev.vars 文件并配置 DOUYIN_COOKIE
    pause
    exit /b 1
)

REM 检查 DOUYIN_COOKIE 是否配置
findstr /C:"DOUYIN_COOKIE=" .dev.vars >nul
if %errorlevel% neq 0 (
    echo ❌ 错误：.dev.vars 中未找到 DOUYIN_COOKIE 配置
    echo 请在 .dev.vars 中添加：DOUYIN_COOKIE="你的Cookie"
    pause
    exit /b 1
)

echo ✅ 配置检查通过
echo.
echo 正在启动开发服务器...
echo.

REM 启动开发服务器
npm run dev

pause