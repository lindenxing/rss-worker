# 小宇宙路由测试脚本
# 使用前请确保：
# 1. 已配置 .dev.vars 文件
# 2. 已启动开发服务器 (npm run dev)

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "小宇宙 RSS 路由测试" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# 设置测试用的播客 ID（请替换为实际的播客 ID）
$PODCAST_ID = "6021f949a789fca4eff4492c"

Write-Host "测试 1: 播客订阅路由" -ForegroundColor Yellow
Write-Host "URL: http://127.0.0.1:8787/rss/xiaoyuzhou/podcast/$PODCAST_ID" -ForegroundColor Gray
Write-Host ""

try {
    $response1 = Invoke-WebRequest -Uri "http://127.0.0.1:8787/rss/xiaoyuzhou/podcast/$PODCAST_ID" -UseBasicParsing
    Write-Host "状态码: $($response1.StatusCode)" -ForegroundColor Green
    Write-Host "内容类型: $($response1.Headers['Content-Type'])" -ForegroundColor Green
    Write-Host "响应长度: $($response1.Content.Length) 字节" -ForegroundColor Green
    Write-Host ""
    Write-Host "响应内容预览（前 500 字符）:" -ForegroundColor Gray
    Write-Host $response1.Content.Substring(0, [Math]::Min(500, $response1.Content.Length))
} catch {
    Write-Host "错误: $_" -ForegroundColor Red
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "测试 2: 精选订阅路由" -ForegroundColor Yellow
Write-Host "URL: http://127.0.0.1:8787/rss/xiaoyuzhou/pickup" -ForegroundColor Gray
Write-Host ""

try {
    $response2 = Invoke-WebRequest -Uri "http://127.0.0.1:8787/rss/xiaoyuzhou/pickup" -UseBasicParsing
    Write-Host "状态码: $($response2.StatusCode)" -ForegroundColor Green
    Write-Host "内容类型: $($response2.Headers['Content-Type'])" -ForegroundColor Green
    Write-Host "响应长度: $($response2.Content.Length) 字节" -ForegroundColor Green
    Write-Host ""
    Write-Host "响应内容预览（前 500 字符）:" -ForegroundColor Gray
    Write-Host $response2.Content.Substring(0, [Math]::Min(500, $response2.Content.Length))
} catch {
    Write-Host "错误: $_" -ForegroundColor Red
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "测试完成！" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "提示：" -ForegroundColor Yellow
Write-Host "- 如果看到 XML 内容，说明路由工作正常" -ForegroundColor Gray
Write-Host "- 如果看到错误信息，请检查环境变量配置" -ForegroundColor Gray
Write-Host "- 详细配置说明请查看 docs/XIAOYUZHOU_GUIDE.md" -ForegroundColor Gray
