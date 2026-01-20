# 抖音路由使用指南

## 路由地址

```
/douyin/user/:uid
```

## 参数说明

### 必需参数

- `uid`: 抖音用户的唯一标识符，格式为 `MS4wLjABAAAA...`

### 可选参数

通过 query string 传递：

- `embed`: 是否内嵌视频
  - `0` 或 `false`: 仅显示封面图和视频链接（默认）
  - `1` 或 `true`: 内嵌视频播放器

## 获取用户 UID

1. 打开抖音网页版：https://www.douyin.com
2. 搜索并进入目标用户主页
3. 从 URL 中复制 UID

示例 URL：
```
https://www.douyin.com/user/MS4wLjABAAAARcAHmmF9mAG3JEixq_CdP72APhBlGlLVbN-1eBcPqao
```

UID 为：`MS4wLjABAAAARcAHmmF9mAG3JEixq_CdP72APhBlGlLVbN-1eBcPqao`

## 使用示例

### 基础用法（仅封面图）

```
https://your-worker.workers.dev/rss/douyin/user/MS4wLjABAAAARcAHmmF9mAG3JEixq_CdP72APhBlGlLVbN-1eBcPqao
```

### 内嵌视频

```
https://your-worker.workers.dev/rss/douyin/user/MS4wLjABAAAARcAHmmF9mAG3JEixq_CdP72APhBlGlLVbN-1eBcPqao?embed=1
```

## 配置 Cookie（推荐）

由于抖音有严格的反爬机制，强烈建议配置 `DOUYIN_COOKIE` 环境变量以提高成功率。

### 获取 Cookie

1. 在浏览器中登录 https://www.douyin.com
2. 打开开发者工具（F12）
3. 切换到 Application → Cookies
4. 复制所有 Cookie 值

### 设置 Secret

**生产环境：**

```powershell
wrangler secret put DOUYIN_COOKIE
```

**本地开发：**

在 `.dev.vars` 文件中添加：

```
DOUYIN_COOKIE="your_cookie_string_here"
```

## 注意事项

### 反爬限制

⚠️ **重要提示**：抖音有非常严格的反爬虫机制

1. **成功率不保证**：即使配置了 Cookie，也可能因为抖音的反爬策略而失败
2. **频率限制**：请勿频繁请求，建议 RSS 阅读器设置较长的更新间隔（如 30 分钟以上）
3. **Cookie 过期**：Cookie 可能会过期，需要定期更新

### 视频播放限制

由于抖音的 CDN 会验证 Referer，某些 RSS 阅读器可能无法直接播放内嵌视频：

- **推荐方案 1**：使用默认模式（`embed=0`），点击"视频直链"在浏览器中播放
- **推荐方案 2**：点击原文链接，在抖音网页版观看
- **备选方案**：尝试 `embed=1` 模式，部分阅读器可能支持

### 技术限制

本实现基于直接 API 调用，与 RSSHub 的 Puppeteer 方案相比：

- ✅ 优点：轻量级，适合 Cloudflare Worker 环境
- ❌ 缺点：更容易被反爬机制拦截
- ⚠️ 稳定性：可能随时因抖音 API 变化而失效

## 故障排查

### 错误：Invalid UID

确保 UID 以 `MS4wLjABAAAA` 开头。

### 错误：Failed to fetch user videos

可能的原因：
1. 抖音反爬机制拦截
2. Cookie 未配置或已过期
3. 用户不存在或设置了隐私保护

解决方案：
1. 配置有效的 `DOUYIN_COOKIE`
2. 更新 Cookie
3. 降低请求频率
4. 验证用户 UID 是否正确

### 视频无法播放

1. 尝试使用默认模式（不带 `embed` 参数）
2. 点击"视频直链"在浏览器中打开
3. 点击原文链接在抖音网页版观看

## 替代方案

如果此路由频繁失败，建议考虑：

1. 使用官方 RSSHub 实例（支持 Puppeteer）
2. 自建 RSSHub 服务器
3. 使用其他第三方 RSS 服务

## 技术细节

### API 端点

```
https://www.douyin.com/aweme/v1/web/aweme/post/
```

### 请求参数

- `device_platform`: webapp
- `aid`: 6383
- `sec_user_id`: 用户 UID
- `max_cursor`: 分页游标
- `count`: 每页数量

### 数据结构

返回的 JSON 包含：
- `aweme_list`: 视频列表
- `author`: 作者信息
- `video`: 视频信息（封面、播放地址等）
- `desc`: 视频描述
- `create_time`: 发布时间

## 更新日志

- **2026-01-21**: 初始版本发布
  - 支持基础的用户视频列表获取
  - 支持内嵌视频模式
  - 支持 Cookie 配置
