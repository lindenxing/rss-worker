# 小宇宙认证信息测试脚本
# 用于验证 XIAOYUZHOU_ID 和 XIAOYUZHOU_TOKEN 是否有效

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "小宇宙认证信息测试" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# 从 .dev.vars 文件读取配置（如果存在）
$devVarsPath = ".\.dev.vars"
$deviceId = ""
$token = ""

if (Test-Path $devVarsPath) {
    Write-Host "从 .dev.vars 文件读取配置..." -ForegroundColor Yellow
    $content = Get-Content $devVarsPath
    foreach ($line in $content) {
        if ($line -match "^XIAOYUZHOU_ID=(.+)$") {
            $deviceId = $matches[1]
        }
        if ($line -match "^XIAOYUZHOU_TOKEN=(.+)$") {
            $token = $matches[1]
        }
    }
} else {
    Write-Host ".dev.vars 文件不存在，请手动输入认证信息" -ForegroundColor Yellow
}

# 如果没有从文件读取到，则提示用户输入
if (-not $deviceId) {
    Write-Host ""
    $deviceId = Read-Host "请输入 x-jike-device-id"
}

if (-not $token) {
    Write-Host ""
    $token = Read-Host "请输入 x-jike-refresh-token"
}

Write-Host ""
Write-Host "Device ID: $($deviceId.Substring(0, [Math]::Min(20, $deviceId.Length)))..." -ForegroundColor Gray
Write-Host "Token: $($token.Substring(0, [Math]::Min(20, $token.Length)))..." -ForegroundColor Gray
Write-Host ""

# 测试 1: 获取精选列表
Write-Host "测试 1: 获取精选列表 (pickup/list)" -ForegroundColor Yellow
Write-Host "API: https://api.xiaoyuzhoufm.com/v1/pickup/list" -ForegroundColor Gray
Write-Host ""

try {
    $headers = @{
        "Content-Type" = "application/json"
        "x-jike-device-id" = $deviceId
        "x-jike-refresh-token" = $token
        "User-Agent" = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
    }
    
    $body = @{
        limit = 20
    } | ConvertTo-Json
    
    $response = Invoke-RestMethod -Uri "https://api.xiaoyuzhoufm.com/v1/pickup/list" `
        -Method Post `
        -Headers $headers `
        -Body $body `
        -ErrorAction Stop
    
    Write-Host "✅ 认证成功！" -ForegroundColor Green
    Write-Host ""
    
    if ($response.data -and $response.data.Count -gt 0) {
        Write-Host "获取到 $($response.data.Count) 个精选单集：" -ForegroundColor Green
        Write-Host ""
        
        for ($i = 0; $i -lt [Math]::Min(5, $response.data.Count); $i++) {
            $item = $response.data[$i]
            Write-Host "  $($i + 1). $($item.episode.title) - $($item.podcast.title)" -ForegroundColor Cyan
            if ($item.comment) {
                Write-Host "     推荐理由: $($item.comment.Substring(0, [Math]::Min(50, $item.comment.Length)))..." -ForegroundColor Gray
            }
        }
        
        if ($response.data.Count -gt 5) {
            Write-Host "  ... 还有 $($response.data.Count - 5) 个单集" -ForegroundColor Gray
        }
    } else {
        Write-Host "⚠️  API 返回成功，但没有数据" -ForegroundColor Yellow
    }
    
} catch {
    $statusCode = $_.Exception.Response.StatusCode.value__
    Write-Host "❌ 认证失败！" -ForegroundColor Red
    Write-Host ""
    
    if ($statusCode -eq 401) {
        Write-Host "错误: HTTP 401 Unauthorized" -ForegroundColor Red
        Write-Host ""
        Write-Host "可能的原因：" -ForegroundColor Yellow
        Write-Host "  1. Token 已过期，需要重新获取" -ForegroundColor Gray
        Write-Host "  2. Device ID 或 Token 不正确" -ForegroundColor Gray
        Write-Host "  3. Device ID 和 Token 不匹配" -ForegroundColor Gray
        Write-Host ""
        Write-Host "解决方法：" -ForegroundColor Yellow
        Write-Host "  1. 打开小宇宙网站并登录" -ForegroundColor Gray
        Write-Host "  2. 按 F12 打开开发者工具" -ForegroundColor Gray
        Write-Host "  3. 切换到 Network 标签" -ForegroundColor Gray
        Write-Host "  4. 刷新页面或浏览内容" -ForegroundColor Gray
        Write-Host "  5. 找到 api.xiaoyuzhoufm.com 的请求" -ForegroundColor Gray
        Write-Host "  6. 查看请求头，复制新的 x-jike-device-id 和 x-jike-refresh-token" -ForegroundColor Gray
    } else {
        Write-Host "错误: HTTP $statusCode" -ForegroundColor Red
        Write-Host "详细信息: $($_.Exception.Message)" -ForegroundColor Gray
    }
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# 测试 2: 获取播客信息（不需要认证）
Write-Host "测试 2: 获取播客信息 (无需认证)" -ForegroundColor Yellow
Write-Host "测试播客: 知行小酒馆 (6021f949a789fca4eff4492c)" -ForegroundColor Gray
Write-Host ""

try {
    $podcastUrl = "https://www.xiaoyuzhoufm.com/podcast/6021f949a789fca4eff4492c"
    $response = Invoke-WebRequest -Uri $podcastUrl -UseBasicParsing
    
    if ($response.Content -match '__NEXT_DATA__') {
        Write-Host "✅ 网页抓取方式正常工作" -ForegroundColor Green
        Write-Host "   这是当前 pickup 路由使用的方式（无需认证）" -ForegroundColor Gray
    } else {
        Write-Host "⚠️  无法从网页提取数据" -ForegroundColor Yellow
    }
} catch {
    Write-Host "❌ 网页访问失败: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# 总结
Write-Host "总结：" -ForegroundColor Cyan
Write-Host ""
Write-Host "方式一（当前实现）：网页抓取" -ForegroundColor Yellow
Write-Host "  ✅ 无需认证" -ForegroundColor Green
Write-Host "  ✅ 稳定可靠" -ForegroundColor Green
Write-Host "  ❌ 只能获取硬编码的热门播客" -ForegroundColor Red
Write-Host "  ❌ 不是真正的每日精选" -ForegroundColor Red
Write-Host ""
Write-Host "方式二（API 调用）：官方 API" -ForegroundColor Yellow
Write-Host "  ✅ 获取真正的每日精选（App 中的那 3 个）" -ForegroundColor Green
Write-Host "  ✅ 包含推荐理由" -ForegroundColor Green
Write-Host "  ❌ 需要有效的认证信息" -ForegroundColor Red
Write-Host "  ❌ Token 可能过期" -ForegroundColor Red
Write-Host ""

if ($deviceId -and $token) {
    Write-Host "下一步：" -ForegroundColor Cyan
    Write-Host "  如果认证成功，运行以下命令部署：" -ForegroundColor Gray
    Write-Host "    wrangler secret put XIAOYUZHOU_ID" -ForegroundColor White
    Write-Host "    wrangler secret put XIAOYUZHOU_TOKEN" -ForegroundColor White
    Write-Host "    npm run deploy" -ForegroundColor White
}

Write-Host ""
