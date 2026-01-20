# 获取抖音 Cookie 并本地测试

## 方法一：使用自动化工具（推荐）

### 步骤 1：打开工具

在浏览器中打开项目根目录的 `get-douyin-cookie.html` 文件：

```bash
# Windows
start get-douyin-cookie.html

# 或者直接双击文件
```

### 步骤 2：在抖音页面运行

1. 访问 https://www.douyin.com 并登录
2. 按 `F12` 打开开发者工具
3. 切换到 `Console`（控制台）标签
4. 复制 `get-douyin-cookie.html` 中的 JavaScript 代码部分
5. 粘贴到控制台并按回车运行

或者，你可以将整个 HTML 文件的内容保存为书签脚本，在抖音页面点击运行。

### 步骤 3：复制 Cookie

工具会自动获取并显示 Cookie，点击"复制到剪贴板"按钮。

## 方法二：手动获取

### 步骤 1：登录抖音

访问 https://www.douyin.com 并登录你的账号。

### 步骤 2：打开开发者工具

按 `F12` 打开浏览器开发者工具。

### 步骤 3：获取 Cookie

1. 切换到 `Application`（应用）标签页
2. 在左侧找到 `Cookies` → `https://www.douyin.com`
3. 你会看到很多 Cookie 条目

### 步骤 4：复制 Cookie

有两种方式：

**方式 A：逐个复制（不推荐）**
手动复制每个 Cookie 的 name 和 value，格式如：`key1=value1; key2=value2`

**方式 B：使用控制台（推荐）**
在 Console 中运行以下代码：

```javascript
document.cookie
```

复制输出的所有内容。

## 配置到本地环境

### 步骤 1：编辑 .dev.vars 文件

打开项目根目录的 `.dev.vars` 文件，找到：

```plaintext
DOUYIN_COOKIE=""
```

### 步骤 2：粘贴 Cookie

将你复制的 Cookie 粘贴到引号中：

```plaintext
DOUYIN_COOKIE="你的Cookie内容"
```

**注意**：
- 保持引号内的内容不变
- 不要删除引号
- Cookie 内容可能很长，这是正常的

### 步骤 3：保存文件

保存 `.dev.vars` 文件。

## 本地测试

### 步骤 1：启动开发服务器

```powershell
npm run dev
```

你应该看到类似输出：

```
 ⛅️ wrangler 3.x.x
-------------------
Your worker has access to the following bindings:
- Vars:
  - WEIBO_COOKIES: "***"
  - BILIBILI_COOKIES: "***"
  - DOUYIN_COOKIE: "***"
- Routes:
  - http://localhost:8787
-------------------
Ready on http://localhost:8787
```

### 步骤 2：获取测试 UID

找一个抖音用户的 UID，例如：
- 姜胡说：`MS4wLjABAAAARcAHmmF9mAG3JEixq_CdP72APhBlGlLVbN-1eBcPqao`

### 步骤 3：测试路由

在浏览器中访问：

```
http://localhost:8787/rss/douyin/user/MS4wLjABAAAARcAHmmF9mAG3JEixq_CdP72APhBlGlLVbN-1eBcPqao
```

### 步骤 4：查看结果

如果成功，你会看到 RSS XML 格式的输出，包含：
- 用户信息（标题、描述、头像）
- 视频列表（标题、链接、描述、发布时间等）

## 常见问题

### Q1: 提示 "Failed to fetch user videos"

**可能原因**：
1. Cookie 未配置或已过期
2. 抖音反爬机制拦截
3. 用户不存在或设置了隐私保护

**解决方案**：
1. 重新获取 Cookie 并更新 `.dev.vars`
2. 重启开发服务器：`Ctrl+C` 然后 `npm run dev`
3. 尝试其他用户 UID

### Q2: 提示 "Invalid UID"

确保 UID 以 `MS4wLjABAAAA` 开头。

### Q3: 开发服务器启动失败

检查：
1. Node.js 是否已安装：`node --version`
2. 依赖是否已安装：`npm install`
3. 端口 8787 是否被占用

### Q4: Cookie 格式错误

正确的 Cookie 格式应该是：

```
key1=value1; key2=value2; key3=value3
```

不要包含多余的空格或换行。

## 测试命令

你也可以使用 curl 测试：

```powershell
# 测试基础路由
curl "http://localhost:8787/rss/douyin/user/MS4wLjABAAAARcAHmmF9mAG3JEixq_CdP72APhBlGlLVbN-1eBcPqao"

# 测试内嵌视频模式
curl "http://localhost:8787/rss/douyin/user/MS4wLjABAAAARcAHmmF9mAG3JEixq_CdP72APhBlGlLVbN-1eBcPqao?embed=1"
```

## 下一步

本地测试成功后，你可以：

1. 部署到 Cloudflare Workers
2. 配置生产环境的 Secret：`wrangler secret put DOUYIN_COOKIE`
3. 在 RSS 阅读器中订阅

## 安全提示

⚠️ **重要**：
- Cookie 包含敏感信息，请勿分享给他人
- `.dev.vars` 文件已在 `.gitignore` 中，不会被提交到 Git
- 生产环境请使用 `wrangler secret put` 配置，不要写在代码中