@echo off
REM 小宇宙路由测试脚本
REM 使用前请确保：
REM 1. 已配置 .dev.vars 文件
REM 2. 已启动开发服务器 (npm run dev)

echo ========================================
echo 小宇宙 RSS 路由测试
echo ========================================
echo.

REM 设置测试用的播客 ID（请替换为实际的播客 ID）
set PODCAST_ID=6021f949a789fca4eff4492c

echo 测试 1: 播客订阅路由
echo URL: http://127.0.0.1:8787/rss/xiaoyuzhou/podcast/%PODCAST_ID%
echo.
curl "http://127.0.0.1:8787/rss/xiaoyuzhou/podcast/%PODCAST_ID%"
echo.
echo.

echo ========================================
echo.

echo 测试 2: 精选订阅路由
echo URL: http://127.0.0.1:8787/rss/xiaoyuzhou/pickup
echo.
curl "http://127.0.0.1:8787/rss/xiaoyuzhou/pickup"
echo.
echo.

echo ========================================
echo 测试完成！
echo ========================================
pause
