# 小宇宙 RSS 订阅使用指南

## 概述

本项目支持订阅小宇宙（xiaoyuzhoufm.com）的播客内容，包括：
- 播客订阅：订阅特定播客的所有单集
- 精选订阅：订阅小宇宙首页的精选内容

## 配置要求

使用小宇宙 RSS 功能需要配置以下环境变量：

### 1. XIAOYUZHOU_ID
即数据包中的 `x-jike-device-id`

### 2. XIAOYUZHOU_TOKEN
即数据包中的 `x-jike-refresh-token`

## 获取认证信息

### 方法一：使用浏览器开发者工具

1. 打开小宇宙网站 https://www.xiaoyuzhoufm.com
2. 登录你的账号
3. 按 F12 打开开发者工具
4. 切换到 Network（网络）标签
5. 刷新页面或浏览播客
6. 在请求列表中找到任意一个 API 请求（通常是 `api.xiaoyuzhoufm.com` 开头的）
7. 查看请求头（Request Headers）：
   - 找到 `x-jike-device-id`，复制其值作为 `XIAOYUZHOU_ID`
   - 找到 `x-jike-refresh-token`，复制其值作为 `XIAOYUZHOU_TOKEN`

### 方法二：使用抓包工具

1. 使用 Fiddler、Charles 等抓包工具
2. 在手机或电脑上打开小宇宙 App 或网页版
3. 登录并浏览内容
4. 在抓包工具中找到 `api.xiaoyuzhoufm.com` 的请求
5. 查看请求头，获取上述两个字段的值

## 配置环境变量

### 本地开发

在项目根目录创建 `.dev.vars` 文件：

```
XIAOYUZHOU_ID=your_device_id_here
XIAOYUZHOU_TOKEN=your_refresh_token_here
```

### Cloudflare Workers 部署

使用 wrangler 命令设置密钥：

```bash
wrangler secret put XIAOYUZHOU_ID
# 输入你的 device id

wrangler secret put XIAOYUZHOU_TOKEN
# 输入你的 refresh token
```

或在 Cloudflare Dashboard 中设置：
1. 进入你的 Worker 设置页面
2. 找到 "Settings" -> "Variables"
3. 添加环境变量：
   - `XIAOYUZHOU_ID`
   - `XIAOYUZHOU_TOKEN`

## 路由说明

### 1. 播客订阅

**路由格式：**
```
/rss/xiaoyuzhou/podcast/:id
```

**参数说明：**
- `id`: 播客 ID 或单集 ID，可以在小宇宙播客的 URL 中找到

**示例：**

订阅播客（所有单集）：
```
https://your-worker.workers.dev/rss/xiaoyuzhou/podcast/6021f949a789fca4eff4492c
```

订阅单个单集：
```
https://your-worker.workers.dev/rss/xiaoyuzhou/podcast/63a9b8e0e0f8e7a4f0e8e7a4
```

**如何获取播客 ID：**
1. 打开小宇宙网站
2. 进入你想订阅的播客页面
3. 查看 URL，格式为：`https://www.xiaoyuzhoufm.com/podcast/6021f949a789fca4eff4492c`
4. 最后一段就是播客 ID：`6021f949a789fca4eff4492c`

### 2. 精选订阅

**路由格式：**
```
/rss/xiaoyuzhou/pickup
```

**示例：**
```
https://your-worker.workers.dev/rss/xiaoyuzhou/pickup
```

此路由会返回小宇宙首页的精选播客单集，包含推荐理由。

## RSS 订阅内容

每个 RSS 条目包含：
- 标题：单集标题
- 链接：单集页面链接
- 描述：包含封面图、播客信息、单集简介、音频播放器、时长等
- 发布时间：单集发布时间
- 作者：播客作者或播客名称
- 音频附件：可直接在 RSS 阅读器中播放

## 注意事项

1. **认证信息有效期**：`x-jike-refresh-token` 可能会过期，如果遇到认证失败，需要重新获取
2. **请求频率**：建议设置合理的 RSS 订阅更新间隔，避免频繁请求
3. **隐私保护**：请妥善保管你的认证信息，不要泄露给他人
4. **API 变动**：小宇宙的 API 可能会变动，如遇到问题请及时反馈

## 故障排查

### 错误：Missing XIAOYUZHOU_ID or XIAOYUZHOU_TOKEN

**原因**：未配置环境变量

**解决方法**：按照上述"配置环境变量"部分进行配置

### 错误：Failed to fetch podcast data

**可能原因**：
1. 认证信息过期或无效
2. 播客 ID 不存在
3. 网络问题

**解决方法**：
1. 重新获取认证信息并更新环境变量
2. 检查播客 ID 是否正确
3. 检查网络连接

## 示例播客

以下是一些热门播客的 ID，可用于测试：

- 知行小酒馆：`6021f949a789fca4eff4492c`
- 半拿铁 | 商业沉浮录：`6021f949a789fca4eff4492d`（示例 ID，请替换为实际 ID）

## 技术实现

- 使用小宇宙官方 API
- 支持音频附件（enclosure）
- 自动解析发布时间
- 包含丰富的元数据（封面、描述、时长等）
- 轻量化实现，适合 Cloudflare Workers 部署

## 更新日志

- 2026-01-21: 初始版本，支持播客订阅和精选订阅
