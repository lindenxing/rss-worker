# 测试小宇宙精选 API
$deviceId = "bbde6e6f-c079-4ed1-a6ac-5eb558374421"
$refreshToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJkYXRhIjoiaFlBYklURUtWS2FFTjBMNE5QUTlMa01IUU5HcDgzQmJWUUFPS093YURxZlBYbitVMkFuaEhGa0ZcL1hLWCt4Y1VwNXdlcXd3OFJyUkwzSEhWQ3Y5aXZnXC9pMXU2VTVsWHBTajl2RndSV2xpYTJYRTViY25ISkNcL0wzcTVRNzJTTFZLYUg2ODNNT1lZSHBKdWN3UUd1c2xRWitOOVJLZjh2MklcL3JcLzA2SktPc05cL0NEVzlYU3E5eU9OXC81Y3VRdjlHNlRsQVUxUG1hY1BtUzRBTkN1RWV4aHYxOFlxSEh0MGFaSzdBclcrVFpXQWQ5U0RqdTdRZWJSNDFrQldPT3JFYVEiLCJ2IjozLCJpdiI6IkFwUkxVZTV5YTNkQmlcL2lTOUgyb1NBPT0iLCJpYXQiOjE3NjkwMDM1MzkuMjk5fQ.ICrauGGizKnmw5u8RT6u_oNHHa28izmYrmNCqPyE8ok"

Write-Host "🧪 测试小宇宙精选 API（正确流程）..." -ForegroundColor Cyan
Write-Host ""

# 第一步：刷新 token
Write-Host "📝 步骤 1: 刷新 token 获取 access token..." -ForegroundColor Yellow

$refreshHeaders = @{
    "Content-Type" = "application/json"
    "User-Agent" = "okhttp/4.7.2"
    "applicationid" = "app.podcast.cosmos"
    "app-version" = "1.6.0"
    "x-jike-device-id" = $deviceId
    "x-jike-refresh-token" = $refreshToken
}

try {
    $tokenResponse = Invoke-RestMethod -Uri "https://api.xiaoyuzhoufm.com/app_auth_tokens.refresh" `
        -Method Post `
        -Headers $refreshHeaders `
        -ErrorAction Stop
    
    $accessToken = $tokenResponse.'x-jike-access-token'
    $newRefreshToken = $tokenResponse.'x-jike-refresh-token'
    
    Write-Host "  ✅ Token 刷新成功！" -ForegroundColor Green
    Write-Host "  - Access Token: $($accessToken.Substring(0, 20))..." -ForegroundColor Gray
    Write-Host ""
    
    # 第二步：使用 access token 获取精选
    Write-Host "📝 步骤 2: 使用 access token 获取精选数据..." -ForegroundColor Yellow
    
    $pickupHeaders = @{
        "Content-Type" = "application/json"
        "User-Agent" = "okhttp/4.7.2"
        "applicationid" = "app.podcast.cosmos"
        "app-version" = "1.6.0"
        "x-jike-device-id" = $deviceId
        "x-jike-access-token" = $accessToken
    }
    
    $pickupBody = @{
        limit = 20
    } | ConvertTo-Json
    
    $pickupResponse = Invoke-RestMethod -Uri "https://api.xiaoyuzhoufm.com/v1/editor-pick/list" `
        -Method Post `
        -Headers $pickupHeaders `
        -Body $pickupBody `
        -ErrorAction Stop
    
    Write-Host "  ✅ 精选数据获取成功！" -ForegroundColor Green
    Write-Host ""
    Write-Host "📊 返回数据：" -ForegroundColor Yellow
    Write-Host "  - 精选数量: $($pickupResponse.data.Count)" -ForegroundColor White
    Write-Host ""
    
    if ($pickupResponse.data.Count -gt 0) {
        Write-Host "📝 前 3 个精选单集：" -ForegroundColor Yellow
        for ($i = 0; $i -lt [Math]::Min(3, $pickupResponse.data.Count); $i++) {
            $item = $pickupResponse.data[$i]
            Write-Host ""
            Write-Host "  [$($i + 1)] $($item.episode.title)" -ForegroundColor Cyan
            Write-Host "      播客: $($item.podcast.title)" -ForegroundColor Gray
            if ($item.comment) {
                $shortComment = if ($item.comment.Length -gt 50) { 
                    $item.comment.Substring(0, 50) + "..." 
                } else { 
                    $item.comment 
                }
                Write-Host "      推荐: $shortComment" -ForegroundColor Gray
            }
        }
    }
    
    Write-Host ""
    Write-Host "🎉 完美！这就是 RSSHub 的工作方式！" -ForegroundColor Green
    Write-Host ""
    Write-Host "💡 关键区别：" -ForegroundColor Yellow
    Write-Host "  1. RSSHub 先用 refresh_token 调用 /app_auth_tokens.refresh" -ForegroundColor Gray
    Write-Host "  2. 获取新的 access_token" -ForegroundColor Gray
    Write-Host "  3. 然后用 access_token 调用 /v1/pickup/list" -ForegroundColor Gray
    Write-Host ""
    Write-Host "  而不是直接用 refresh_token 调用 /v1/pickup/list ❌" -ForegroundColor Gray
    
} catch {
    Write-Host "❌ 测试失败！" -ForegroundColor Red
    Write-Host ""
    Write-Host "错误信息: $($_.Exception.Message)" -ForegroundColor Red
}
