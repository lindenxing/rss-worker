# 快速设置指南

## 🚀 生产环境部署

### 1. 部署到 Cloudflare Workers

```powershell
# 登录 Cloudflare
wrangler login

# 部署项目
wrangler deploy
```

### 2. 配置 Secrets（必需）

```powershell
# 配置微博 Cookies
wrangler secret put WEIBO_COOKIES
# 粘贴你的微博 Cookie 字符串

# 配置 Bilibili Cookies
wrangler secret put BILIBILI_COOKIES
# 格式：UID=COOKIE_STRING
# 示例：1466714313=your_cookie_here
```

### 3. 验证部署

访问：`https://your-worker.workers.dev/`

---

## 💻 本地开发

### 1. 安装依赖

```powershell
npm install
```

### 2. 配置本地环境变量

```powershell
# 复制示例文件
Copy-Item .dev.vars.example .dev.vars

# 编辑 .dev.vars 文件，填入你的 Cookie
notepad .dev.vars
```

### 3. 启动开发服务器

```powershell
npm run dev
# 或
wrangler dev
```

访问：`http://localhost:8787/`

---

## 🔑 获取 Cookies

### 微博 Cookie

1. 登录 https://weibo.com
2. 按 F12 打开开发者工具
3. 切换到 **Network** 标签
4. 刷新页面
5. 点击任意请求，找到 **Request Headers** 中的 **Cookie**
6. 复制整个 Cookie 字符串

### Bilibili Cookie

1. 登录 https://www.bilibili.com
2. 按 F12 打开开发者工具
3. 切换到 **Application** → **Cookies** → `https://www.bilibili.com`
4. 复制所有 Cookie 值（建议复制整行）
5. 格式化为：`UID=COOKIE_STRING`

**获取 UID：**
- 访问你的 Bilibili 个人空间
- URL 格式：`https://space.bilibili.com/1466714313`
- 数字部分即为 UID

---

## 📝 常用命令

```powershell
# 查看已设置的 Secrets
wrangler secret list

# 更新 Secret
wrangler secret put SECRET_NAME

# 删除 Secret
wrangler secret delete SECRET_NAME

# 查看部署日志
wrangler tail

# 本地开发
npm run dev

# 部署到生产环境
wrangler deploy
```

---

## ⚠️ 注意事项

1. **永远不要**将 `.dev.vars` 提交到 Git
2. **永远不要**在 `wrangler.toml` 的 `[vars]` 中放置敏感信息
3. Cookie 可能会过期，需要定期更新
4. 生产环境必须使用 Secrets，不要使用环境变量

---

## 🆘 故障排除

### Cookie 无效或过期

重新获取 Cookie 并更新：

```powershell
wrangler secret put WEIBO_COOKIES
# 或
wrangler secret put BILIBILI_COOKIES
```

### 本地开发无法访问

1. 检查 `.dev.vars` 文件是否存在
2. 检查 Cookie 格式是否正确
3. 尝试重启开发服务器

### 部署后无法访问

1. 检查 Secrets 是否已设置：`wrangler secret list`
2. 查看日志：`wrangler tail`
3. 验证 Cookie 是否有效

---

## 📚 更多信息

- 详细安全配置：[SECURITY.md](SECURITY.md)
- 完整文档：[README.md](README.md)
- Cloudflare Workers 文档：https://developers.cloudflare.com/workers/
