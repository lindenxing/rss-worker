# Security Configuration Guide

## Overview

This project uses Cloudflare Workers and requires sensitive credentials (cookies) to access third-party APIs. This guide explains how to securely configure these credentials.

## ⚠️ Security Best Practices

**NEVER commit sensitive credentials to version control!**

- ✅ Use Cloudflare Secrets for production
- ✅ Use `.dev.vars` for local development (gitignored)
- ❌ Never put credentials in `wrangler.toml` under `[vars]`
- ❌ Never commit `.dev.vars` to Git

## Production Setup

### 1. Set Weibo Cookies

```powershell
wrangler secret put WEIBO_COOKIES
```

When prompted, paste your Weibo cookies string. Get it from:
1. Login to weibo.com in your browser
2. Open DevTools (F12) → Application → Cookies
3. Copy the cookie string

### 2. Set Bilibili Cookies

**Option A: Single combined secret (recommended)**

```powershell
wrangler secret put BILIBILI_COOKIES
```

Format: `UID=COOKIE_STRING|UID=COOKIE_STRING`

Example: `1466714313=your_cookie_here|9876543210=another_cookie_here`

**Option B: Individual secrets per UID**

```powershell
wrangler secret put BILIBILI_COOKIE_1466714313
wrangler secret put BILIBILI_COOKIE_9876543210
```

### 3. Set Douyin Cookies (Optional)

```powershell
wrangler secret put DOUYIN_COOKIE
```

When prompted, paste your Douyin cookies string. Get it from:
1. Login to douyin.com in your browser
2. Open DevTools (F12) → Application → Cookies
3. Copy the cookie string

**Note**: Douyin has strict anti-crawling measures. While the route may work without cookies, providing a valid cookie significantly improves success rate.

### 4. Verify Secrets

```powershell
wrangler secret list
```

## Local Development Setup

### 1. Create `.dev.vars` file

```powershell
Copy-Item .dev.vars.example .dev.vars
```

### 2. Edit `.dev.vars` with your credentials

```plaintext
WEIBO_COOKIES="your_actual_weibo_cookies_here"
BILIBILI_COOKIES="1466714313=your_actual_bilibili_cookie_here"
DOUYIN_COOKIE="your_actual_douyin_cookie_here"
```

### 3. Run locally

```powershell
npm run dev
# or
wrangler dev
```

The `.dev.vars` file is automatically loaded by Wrangler for local development.

## How Credentials Are Used

### Weibo

The worker uses `WEIBO_COOKIES` to bypass anti-crawler measures when fetching Weibo user feeds.

Code location: [src/lib/weibo/user.js](src/lib/weibo/user.js)

### Bilibili

The worker uses `BILIBILI_COOKIES` to access the watchlater (稍后阅读) feature, which requires authentication.

Code location: [src/lib/bilibili/user/watchlater.js](src/lib/bilibili/user/watchlater.js)

### Douyin

The worker uses `DOUYIN_COOKIE` to bypass anti-crawler measures when fetching Douyin user videos. Due to Douyin's strict anti-crawling policies, this cookie is highly recommended for stable operation.

Code location: [src/lib/douyin/user.js](src/lib/douyin/user.js)

## Updating Secrets

To update a secret in production:

```powershell
wrangler secret put SECRET_NAME
```

To delete a secret:

```powershell
wrangler secret delete SECRET_NAME
```

## Troubleshooting

### "Cookie not found" errors

1. Verify secrets are set: `wrangler secret list`
2. Check `.dev.vars` exists for local development
3. Ensure cookie format is correct (no extra quotes or spaces)

### Cookies expired

Cookies may expire after some time. You'll need to:
1. Login again to the service
2. Get fresh cookies
3. Update the secret

## Security Checklist

- [ ] `.dev.vars` is in `.gitignore`
- [ ] No credentials in `wrangler.toml`
- [ ] Production secrets set via `wrangler secret put`
- [ ] `.dev.vars.example` has no real credentials
- [ ] Team members know not to commit credentials

## Additional Resources

- [Cloudflare Workers Secrets Documentation](https://developers.cloudflare.com/workers/configuration/secrets/)
- [Wrangler CLI Documentation](https://developers.cloudflare.com/workers/wrangler/)
