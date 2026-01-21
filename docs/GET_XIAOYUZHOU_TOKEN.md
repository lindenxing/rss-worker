# 如何获取小宇宙认证信息

## 方法一：使用浏览器开发者工具（推荐）

### 1. 打开小宇宙网站
访问 https://www.xiaoyuzhoufm.com 并登录你的账号

### 2. 打开开发者工具
- Windows/Linux: 按 `F12` 或 `Ctrl + Shift + I`
- Mac: 按 `Cmd + Option + I`

### 3. 切换到 Network（网络）标签
- 确保 "Preserve log"（保留日志）选项已勾选
- 清空当前的网络请求列表

### 4. 触发 API 请求
在小宇宙网站上进行以下任一操作：
- 刷新页面
- 点击"发现"标签
- 浏览任意播客
- 播放任意单集

### 5. 查找 API 请求
在网络请求列表中，找到以下任一请求：
- `api.xiaoyuzhoufm.com` 开头的请求
- 例如：`pickup/list`、`podcast/get`、`episode/list` 等

### 6. 查看请求头
点击找到的请求，切换到 "Headers"（请求头）标签，向下滚动找到 "Request Headers"（请求标头）部分

### 7. 复制认证信息
找到并复制以下两个值：
```
x-jike-device-id: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
x-jike-refresh-token: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

**示例截图位置：**
```
Request Headers:
  accept: application/json
  accept-language: zh-CN,zh;q=0.9
  content-type: application/json
  x-jike-device-id: 12345678-1234-1234-1234-123456789abc  ← 复制这个
  x-jike-refresh-token: abcdefgh-1234-5678-90ab-cdefghijklmn.eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...  ← 复制这个
```

## 方法二：使用抓包工具

### 1. 安装抓包工具
- Windows: Fiddler (https://www.telerik.com/fiddler)
- Mac: Charles (https://www.charlesproxy.com/)
- 跨平台: mitmproxy (https://mitmproxy.org/)

### 2. 配置 HTTPS 抓包
- 安装 SSL 证书
- 启用 HTTPS 解密

### 3. 在手机或电脑上打开小宇宙 App
- 配置代理指向抓包工具
- 登录并浏览内容

### 4. 查找请求
在抓包工具中找到 `api.xiaoyuzhoufm.com` 的请求

### 5. 提取认证信息
从请求头中复制 `x-jike-device-id` 和 `x-jike-refresh-token`

## 配置到 Cloudflare Workers

### 本地开发环境

创建 `.dev.vars` 文件（如果不存在）：
```bash
# .dev.vars
XIAOYUZHOU_ID=你的device_id
XIAOYUZHOU_TOKEN=你的refresh_token
```

### 生产环境

使用 wrangler 命令设置密钥：

```bash
# 设置 Device ID
wrangler secret put XIAOYUZHOU_ID
# 粘贴你的 device id，然后按回车

# 设置 Refresh Token
wrangler secret put XIAOYUZHOU_TOKEN
# 粘贴你的 refresh token，然后按回车
```

或者在 Cloudflare Dashboard 中设置：
1. 登录 Cloudflare Dashboard
2. 进入 Workers & Pages
3. 选择你的 Worker
4. 点击 "Settings" → "Variables"
5. 添加环境变量：
   - `XIAOYUZHOU_ID`
   - `XIAOYUZHOU_TOKEN`

## 验证认证信息

### 测试 API 调用

使用 curl 测试：
```bash
curl -X POST https://api.xiaoyuzhoufm.com/v1/pickup/list \
  -H "Content-Type: application/json" \
  -H "x-jike-device-id: 你的device_id" \
  -H "x-jike-refresh-token: 你的refresh_token" \
  -d '{"limit": 20}'
```

如果返回 JSON 数据（而不是 401 错误），说明认证信息有效。

## 常见问题

### Q: Token 会过期吗？
A: 是的，`x-jike-refresh-token` 可能会过期。如果遇到 401 错误，需要重新获取。

### Q: 多久需要更新一次？
A: 通常可以使用几周到几个月，具体取决于小宇宙的策略。

### Q: Device ID 和 Token 有什么区别？
A: 
- `x-jike-device-id`: 设备标识符，相对稳定
- `x-jike-refresh-token`: 用户认证令牌，会过期

### Q: 安全吗？
A: 这些是你的个人认证信息，请妥善保管：
- ❌ 不要分享给他人
- ❌ 不要提交到公开的代码仓库
- ✅ 使用 Cloudflare Secrets 存储
- ✅ 使用 `.gitignore` 忽略 `.dev.vars` 文件

### Q: 为什么我的认证信息返回 401？
可能的原因：
1. Token 已过期 → 重新获取
2. 复制时包含了多余的空格或换行 → 检查并重新复制
3. Device ID 和 Token 不匹配 → 确保从同一个请求中获取
4. 小宇宙更新了认证机制 → 查看最新的 API 文档

## 下一步

获取到认证信息后，你可以：
1. 配置环境变量
2. 重新部署 Worker
3. 访问 `/rss/xiaoyuzhou/pickup` 获取真正的每日精选
