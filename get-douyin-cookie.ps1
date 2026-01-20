# 抖音 Cookie 获取指南

Write-Host "=== 抖音 Cookie 获取指南 ===" -ForegroundColor Cyan
Write-Host ""

Write-Host "方法一：使用浏览器控制台（推荐）" -ForegroundColor Yellow
Write-Host ""
Write-Host "1. 在浏览器中打开 https://www.douyin.com 并登录" -ForegroundColor White
Write-Host "2. 按 F12 打开开发者工具" -ForegroundColor White
Write-Host "3. 切换到 Console（控制台）标签" -ForegroundColor White
Write-Host "4. 复制并运行以下代码：" -ForegroundColor White
Write-Host ""
Write-Host "   document.cookie" -ForegroundColor Green
Write-Host ""
Write-Host "5. 复制输出的所有内容" -ForegroundColor White
Write-Host ""

Write-Host "方法二：使用 Application 标签" -ForegroundColor Yellow
Write-Host ""
Write-Host "1. 在浏览器中打开 https://www.douyin.com 并登录" -ForegroundColor White
Write-Host "2. 按 F12 打开开发者工具" -ForegroundColor White
Write-Host "3. 切换到 Application（应用）标签" -ForegroundColor White
Write-Host "4. 左侧找到 Cookies → https://www.douyin.com" -ForegroundColor White
Write-Host "5. 复制所有 Cookie 的 name 和 value" -ForegroundColor White
Write-Host ""

Write-Host "配置到本地环境：" -ForegroundColor Yellow
Write-Host ""
Write-Host "1. 打开 .dev.vars 文件" -ForegroundColor White
Write-Host "2. 找到 DOUYIN_COOKIE=" -ForegroundColor White
Write-Host "3. 将 Cookie 粘贴到引号中" -ForegroundColor White
Write-Host "4. 保存文件" -ForegroundColor White
Write-Host ""

Write-Host "测试：" -ForegroundColor Yellow
Write-Host ""
Write-Host "1. 运行: npm run dev" -ForegroundColor White
Write-Host "2. 访问: http://localhost:8787/rss/douyin/user/你的UID" -ForegroundColor White
Write-Host ""

Write-Host "示例 UID：" -ForegroundColor Yellow
Write-Host "MS4wLjABAAAARcAHmmF9mAG3JEixq_CdP72APhBlGlLVbN-1eBcPqao" -ForegroundColor Green
Write-Host ""

Write-Host "按任意键打开抖音网站..." -ForegroundColor Cyan
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")

Start-Process "https://www.douyin.com"

Write-Host ""
Write-Host "已打开抖音网站，请按照上述步骤获取 Cookie" -ForegroundColor Green
Write-Host ""
Write-Host "获取 Cookie 后，请运行以下命令启动本地测试：" -ForegroundColor Yellow
Write-Host "npm run dev" -ForegroundColor Green
Write-Host ""