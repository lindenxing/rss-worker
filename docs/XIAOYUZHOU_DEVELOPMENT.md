# 小宇宙功能开发总结

## 开发内容

本次开发为 RSSWorker 项目添加了小宇宙（xiaoyuzhoufm.com）的 RSS 订阅功能，包括两个主要路由：

### 1. 播客订阅路由 (`/rss/xiaoyuzhou/podcast/:id`)

**功能特性：**
- 支持通过播客 ID 订阅整个播客的所有单集
- 支持通过单集 ID 订阅单个单集
- 返回最近 20 个单集（按发布时间排序）
- 包含完整的单集信息：标题、描述、封面、音频链接、时长等

**实现文件：**
- `src/lib/xiaoyuzhou/podcast.js`

**API 调用：**
- `POST https://api.xiaoyuzhoufm.com/v1/podcast/get` - 获取播客信息
- `POST https://api.xiaoyuzhoufm.com/v1/episode/list` - 获取单集列表
- `POST https://api.xiaoyuzhoufm.com/v1/episode/get` - 获取单集信息

### 2. 精选订阅路由 (`/rss/xiaoyuzhou/pickup`)

**功能特性：**
- 订阅小宇宙首页的精选内容
- 包含推荐理由和播客信息
- 返回最近 20 个精选单集

**实现文件：**
- `src/lib/xiaoyuzhou/pickup.js`

**API 调用：**
- `POST https://api.xiaoyuzhoufm.com/v1/pickup/list` - 获取精选列表

## 技术实现

### 认证机制

小宇宙 API 需要两个认证参数：
- `x-jike-device-id`: 设备 ID
- `x-jike-refresh-token`: 刷新令牌

这两个参数通过环境变量配置：
- `XIAOYUZHOU_ID`
- `XIAOYUZHOU_TOKEN`

### RSS 内容格式

每个 RSS 条目包含：
- **title**: 单集标题
- **link**: 单集页面链接
- **description**: 富文本描述，包含：
  - 封面图片
  - 播客信息（仅精选路由）
  - 推荐理由（仅精选路由）
  - 单集简介
  - HTML5 音频播放器
  - 时长信息
- **pubDate**: 发布时间（ISO 8601 格式）
- **guid**: 单集唯一标识符
- **author**: 播客作者或播客名称
- **enclosure**: 音频附件（支持播客客户端直接播放）

### 轻量化设计

为了符合 Cloudflare Workers 的体积限制：
- 使用原生 `fetch` API 进行网络请求
- 不依赖第三方 HTTP 库
- 复用项目现有的工具函数（`parseDate`, `renderRss2`）
- 代码简洁高效

## 文件清单

### 核心代码
1. `src/lib/xiaoyuzhou/podcast.js` - 播客订阅路由实现
2. `src/lib/xiaoyuzhou/pickup.js` - 精选订阅路由实现
3. `src/route.js` - 路由注册（已更新）

### 文档
4. `docs/XIAOYUZHOU_GUIDE.md` - 详细使用指南
5. `docs/XIAOYUZHOU_TEST.md` - 测试说明文档
6. `README.md` - 项目主文档（已更新）
7. `.dev.vars.example` - 环境变量示例（已更新）

### 测试脚本
8. `test-xiaoyuzhou.bat` - Windows 批处理测试脚本
9. `test-xiaoyuzhou.ps1` - PowerShell 测试脚本

## 使用示例

### 订阅播客
```
https://your-worker.workers.dev/rss/xiaoyuzhou/podcast/6021f949a789fca4eff4492c
```

### 订阅精选
```
https://your-worker.workers.dev/rss/xiaoyuzhou/pickup
```

## 配置步骤

### 1. 获取认证信息

1. 打开小宇宙网站并登录
2. 打开浏览器开发者工具（F12）
3. 切换到 Network 标签
4. 刷新页面或浏览播客
5. 找到 API 请求，查看请求头：
   - `x-jike-device-id` → `XIAOYUZHOU_ID`
   - `x-jike-refresh-token` → `XIAOYUZHOU_TOKEN`

### 2. 配置环境变量

**本地开发：**
在 `.dev.vars` 文件中添加：
```
XIAOYUZHOU_ID=your_device_id_here
XIAOYUZHOU_TOKEN=your_refresh_token_here
```

**生产环境：**
```bash
wrangler secret put XIAOYUZHOU_ID
wrangler secret put XIAOYUZHOU_TOKEN
```

### 3. 测试

启动开发服务器：
```bash
npm run dev
```

运行测试脚本：
```powershell
.\test-xiaoyuzhou.ps1
```

或手动测试：
```bash
curl "http://127.0.0.1:8787/rss/xiaoyuzhou/pickup"
```

## 参考资料

本实现参考了 RSSHub 的小宇宙路由：
- RSSHub 小宇宙播客路由
- RSSHub 小宇宙精选路由

主要改进：
- 适配 Cloudflare Workers 环境
- 使用项目统一的工具函数
- 优化错误处理
- 添加详细的中文文档

## 注意事项

1. **认证信息安全**：请妥善保管认证信息，不要提交到版本控制系统
2. **Token 有效期**：`x-jike-refresh-token` 可能会过期，需要定期更新
3. **请求频率**：建议 RSS 阅读器设置合理的更新间隔（如 30 分钟）
4. **API 稳定性**：小宇宙 API 可能会变动，如遇问题请及时反馈

## 后续优化建议

1. **缓存机制**：添加缓存以减少 API 请求次数
2. **错误重试**：实现自动重试机制
3. **更多路由**：
   - 用户订阅的播客列表
   - 播客分类浏览
   - 搜索结果订阅
4. **性能优化**：
   - 并行请求优化
   - 响应压缩
5. **功能增强**：
   - 支持分页
   - 支持筛选条件
   - 支持自定义返回数量

## 测试清单

- [x] 播客订阅路由基本功能
- [x] 精选订阅路由基本功能
- [x] 错误处理（缺少环境变量）
- [x] 错误处理（无效的播客 ID）
- [x] RSS 格式验证
- [x] 音频附件支持
- [x] 时间格式转换
- [ ] 实际部署测试
- [ ] 多个 RSS 阅读器兼容性测试
- [ ] 长期稳定性测试

## 开发时间

- 开发日期：2026-01-21
- 开发时长：约 1 小时
- 代码行数：约 400 行（含注释和文档）
