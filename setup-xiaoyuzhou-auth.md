# 🎯 启用小宇宙真正的每日精选

## 当前状态
✅ 代码已经实现了真正的每日精选功能
❌ 只需要配置认证信息即可启用

## 快速配置步骤

### 第一步：获取认证信息

1. **打开小宇宙网站**
   - 访问：https://www.xiaoyuzhoufm.com
   - 登录你的账号

2. **打开浏览器开发者工具**
   - 按 `F12` 键

3. **切换到 Network 标签**
   - 点击 "Network"（网络）
   - 勾选 "Preserve log"（保留日志）

4. **触发 API 请求**
   - 刷新页面（F5）
   - 或点击任意播客

5. **查找 API 请求**
   - 在请求列表中搜索：`api.xiaoyuzhoufm.com`
   - 点击任意一个请求

6. **复制认证信息**
   - 切换到 "Headers" 标签
   - 找到 "Request Headers" 部分
   - 复制这两个值：
     ```
     x-jike-device-id: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
     x-jike-refresh-token: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx.ey...
     ```

### 第二步：配置到本地

创建或编辑 `.dev.vars` 文件：

```bash
XIAOYUZHOU_ID=你的x-jike-device-id
XIAOYUZHOU_TOKEN=你的x-jike-refresh-token
```

**注意**：
- 不要加引号
- 确保没有多余的空格
- 这个文件不会被提交到 Git

### 第三步：测试

```powershell
# 运行测试脚本
.\test-xiaoyuzhou-auth.ps1

# 或者启动开发服务器
npm run dev

# 然后访问
# http://127.0.0.1:8787/rss/xiaoyuzhou/pickup
```

### 第四步：部署到生产环境

```bash
# 设置 Cloudflare Secrets
wrangler secret put XIAOYUZHOU_ID
# 粘贴你的 device id，按回车

wrangler secret put XIAOYUZHOU_TOKEN
# 粘贴你的 refresh token，按回车

# 部署
npm run deploy
```

## 如何验证是否成功？

查看 RSS Feed 的标题：
- ✅ **"小宇宙每日精选"** → 成功！使用官方 API
- ⚠️ **"小宇宙精选（热门播客）"** → 使用备用方案（那 5 个播客）

## 真正的每日精选 vs 备用方案

| 特性 | 真正的每日精选 | 备用方案（5个播客） |
|------|---------------|-------------------|
| 数据来源 | 官方 API | 网页抓取 |
| 内容 | 小宇宙编辑精选的 3-5 个单集 | 5 个热门播客的最新单集 |
| 推荐理由 | ✅ 有 | ❌ 无 |
| 更新频率 | 每日更新 | 实时更新 |
| 需要认证 | ✅ 是 | ❌ 否 |

## 常见问题

### Q: Token 会过期吗？
A: 会的，通常几周到几个月。过期后重新获取即可。

### Q: 安全吗？
A: 
- ✅ Token 存储在 Cloudflare Secrets 中，加密保存
- ✅ 只用于获取公开的播客数据
- ⚠️ 不要分享你的 Token

### Q: 我不想配置认证，可以自定义那 5 个播客吗？
A: 可以！编辑 `src/lib/xiaoyuzhou/pickup-api.js` 文件中的 `hotPodcasts` 数组。

## 相关文档

- [详细教程](docs/XIAOYUZHOU_PICKUP_GUIDE.md)
- [获取 Token 教程](docs/GET_XIAOYUZHOU_TOKEN.md)
