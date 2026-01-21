# 小宇宙精选路由 - 使用说明

## 当前状态

✅ **已部署智能版本**

路由会自动选择最佳方式：
1. **优先**：如果配置了有效的认证信息，使用 API 获取真正的每日精选
2. **降级**：如果没有认证或认证失败，自动使用网页抓取方式（热门播客）

## 如何获取真正的每日精选

### 第一步：获取认证信息

#### 方法 A：使用浏览器（推荐）

1. **打开小宇宙网站**
   - 访问：https://www.xiaoyuzhoufm.com
   - 登录你的账号

2. **打开开发者工具**
   - 按 `F12` 键
   - 或右键点击页面 → 选择"检查"

3. **切换到 Network 标签**
   - 点击顶部的 "Network"（网络）标签
   - 勾选 "Preserve log"（保留日志）

4. **触发 API 请求**
   - 刷新页面（F5）
   - 或点击"发现"标签
   - 或浏览任意播客

5. **查找 API 请求**
   - 在请求列表中，找到 `api.xiaoyuzhoufm.com` 开头的请求
   - 例如：`pickup/list`、`podcast/get` 等

6. **复制认证信息**
   - 点击该请求
   - 切换到 "Headers"（标头）标签
   - 向下滚动到 "Request Headers"（请求标头）
   - 找到并复制：
     ```
     x-jike-device-id: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
     x-jike-refresh-token: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx.ey...
     ```

#### 方法 B：使用测试脚本

运行测试脚本，它会提示你输入认证信息并验证：

```powershell
.\test-xiaoyuzhou-auth.ps1
```

### 第二步：配置认证信息

#### 本地开发环境

编辑或创建 `.dev.vars` 文件：

```bash
XIAOYUZHOU_ID=你的x-jike-device-id
XIAOYUZHOU_TOKEN=你的x-jike-refresh-token
```

**注意**：
- 不要加引号
- 确保没有多余的空格
- 这个文件已在 `.gitignore` 中，不会被提交

#### 生产环境（Cloudflare Workers）

使用 wrangler 命令设置密钥：

```bash
# 设置 Device ID
wrangler secret put XIAOYUZHOU_ID
# 粘贴你的 device id，按回车

# 设置 Refresh Token  
wrangler secret put XIAOYUZHOU_TOKEN
# 粘贴你的 refresh token，按回车
```

### 第三步：验证和部署

#### 1. 测试认证信息

```powershell
.\test-xiaoyuzhou-auth.ps1
```

如果看到 ✅ 认证成功，说明配置正确。

#### 2. 本地测试

```bash
npm run dev
```

然后访问：http://127.0.0.1:8787/rss/xiaoyuzhou/pickup

检查 RSS 标题：
- ✅ 如果显示 "小宇宙每日精选"，说明 API 工作正常
- ⚠️ 如果显示 "小宇宙精选（热门播客）"，说明使用了备用方案

#### 3. 部署到生产环境

```bash
npm run build
npm run deploy
```

## 两种方式的区别

### 方式一：API 调用（真正的精选）

**特点：**
- ✅ 获取小宇宙 App 中的真正每日精选
- ✅ 通常 3-5 个精选单集
- ✅ 包含官方推荐理由
- ✅ 数据更新及时
- ❌ 需要认证信息
- ❌ Token 可能过期

**RSS Feed 标题：** "小宇宙每日精选"

**示例内容：**
```
📌 推荐理由：这期节目深入探讨了...
```

### 方式二：网页抓取（备用方案）

**特点：**
- ✅ 无需认证
- ✅ 稳定可靠
- ✅ 自动降级
- ❌ 只能获取硬编码的热门播客
- ❌ 不是真正的每日精选
- ❌ 没有推荐理由

**RSS Feed 标题：** "小宇宙精选（热门播客）"

**包含的播客：**
- 知行小酒馆
- 随机波动
- 声东击西
- 忽左忽右
- 故事FM

## 常见问题

### Q: 为什么我配置了认证信息，还是显示"备用方案"？

**可能原因：**
1. Token 已过期 → 重新获取
2. 复制时包含了空格或换行 → 检查 `.dev.vars` 文件
3. 生产环境的 Secret 没有更新 → 运行 `wrangler secret put`

**解决方法：**
```bash
# 测试认证信息
.\test-xiaoyuzhou-auth.ps1

# 如果失败，重新获取并配置
```

### Q: Token 会过期吗？多久过期？

**答：** 会过期，通常可以使用几周到几个月。如果遇到 401 错误，需要重新获取。

### Q: 如何知道当前使用的是哪种方式？

**答：** 查看 RSS Feed 的标题和描述：
- "小宇宙每日精选" → API 方式
- "小宇宙精选（热门播客）" → 备用方案

### Q: 备用方案可以自定义播客列表吗？

**答：** 可以！编辑 `src/lib/xiaoyuzhou/pickup-api.js` 文件，修改 `hotPodcasts` 数组中的播客 ID。

### Q: 安全吗？会泄露我的账号信息吗？

**答：** 
- ✅ 认证信息存储在 Cloudflare Secrets 中，加密保存
- ✅ 不会在日志中显示
- ✅ 只用于获取公开的播客数据
- ⚠️ 不要分享你的 Token 给他人
- ⚠️ 不要提交 `.dev.vars` 到公开仓库

## 下一步

1. **获取认证信息**（参考上面的步骤）
2. **配置到 Cloudflare**
   ```bash
   wrangler secret put XIAOYUZHOU_ID
   wrangler secret put XIAOYUZHOU_TOKEN
   ```
3. **重新部署**
   ```bash
   npm run deploy
   ```
4. **享受真正的每日精选！** 🎉

## 相关文档

- [获取认证信息详细教程](./GET_XIAOYUZHOU_TOKEN.md)
- [小宇宙使用指南](./XIAOYUZHOU_GUIDE.md)
- [测试脚本](../test-xiaoyuzhou-auth.ps1)
