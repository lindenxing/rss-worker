# 小宇宙路由测试

## 测试前准备

1. 确保已配置环境变量：
   - XIAOYUZHOU_ID
   - XIAOYUZHOU_TOKEN

2. 启动本地开发服务器：
   ```bash
   npm run dev
   ```

## 测试路由

### 1. 测试播客订阅

```bash
# 测试播客订阅（请替换为实际的播客 ID）
curl "http://127.0.0.1:8787/rss/xiaoyuzhou/podcast/6021f949a789fca4eff4492c"
```

预期结果：
- 返回 XML 格式的 RSS feed
- 包含播客的基本信息（标题、描述、链接）
- 包含最近的单集列表（最多 20 个）
- 每个单集包含：标题、链接、描述、发布时间、音频附件等

### 2. 测试精选订阅

```bash
# 测试精选订阅
curl "http://127.0.0.1:8787/rss/xiaoyuzhou/pickup"
```

预期结果：
- 返回 XML 格式的 RSS feed
- 包含小宇宙首页精选内容
- 每个条目包含：单集信息、推荐理由、播客信息等

## 常见问题

### 1. 错误：Missing XIAOYUZHOU_ID or XIAOYUZHOU_TOKEN

**解决方法**：
- 检查 `.dev.vars` 文件是否存在并包含正确的配置
- 或使用 wrangler secret 命令配置

### 2. 错误：Failed to fetch podcast data

**可能原因**：
- 认证信息过期或无效
- 播客 ID 不存在
- 网络问题

**解决方法**：
- 重新获取认证信息
- 检查播客 ID 是否正确
- 检查网络连接

## 获取测试用的播客 ID

1. 打开小宇宙网站：https://www.xiaoyuzhoufm.com
2. 浏览或搜索你感兴趣的播客
3. 进入播客页面
4. 从 URL 中获取播客 ID

例如：
- URL: `https://www.xiaoyuzhoufm.com/podcast/6021f949a789fca4eff4492c`
- 播客 ID: `6021f949a789fca4eff4492c`

## RSS 阅读器测试

将生成的 RSS URL 添加到你的 RSS 阅读器中测试：
- Feedly
- Inoreader
- NetNewsWire
- 等等

## 验证 RSS 格式

可以使用在线工具验证 RSS 格式是否正确：
- https://validator.w3.org/feed/
- https://www.rssboard.org/rss-validator/

## 性能测试

测试响应时间和数据大小：

```bash
# 测试响应时间
time curl "http://127.0.0.1:8787/rss/xiaoyuzhou/podcast/YOUR_PODCAST_ID"

# 查看响应头
curl -I "http://127.0.0.1:8787/rss/xiaoyuzhou/podcast/YOUR_PODCAST_ID"
```

## 部署后测试

部署到 Cloudflare Workers 后：

```bash
# 替换为你的 Worker 域名
curl "https://your-worker.workers.dev/rss/xiaoyuzhou/podcast/YOUR_PODCAST_ID"
curl "https://your-worker.workers.dev/rss/xiaoyuzhou/pickup"
```
