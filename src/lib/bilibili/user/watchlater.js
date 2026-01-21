import { renderRss2 } from '../../../utils/util';

let deal = async (ctx) => {
	const { uid } = ctx.req.param();
	
	// 优先从请求头获取 Cookie，如果没有则从环境变量获取
	let cookie = ctx.req.header('Cookie') || '';
	
	// 如果请求头没有 Cookie，尝试从环境变量或 Secrets 中查找
	if (!cookie) {
		// 优先从 Secrets 中查找（格式：BILIBILI_COOKIE_1466714313）
		const secretKey = `BILIBILI_COOKIE_${uid}`;
		cookie = ctx.env?.[secretKey] || '';
		
		// 如果 Secrets 中没有，尝试从环境变量 BILIBILI_COOKIES 中查找
		if (!cookie) {
			const bilibiliCookies = ctx.env?.BILIBILI_COOKIES || '';
			if (bilibiliCookies) {
				// 格式: UID=COOKIE_STRING|UID=COOKIE_STRING
				const cookieMap = {};
				bilibiliCookies.split('|').forEach(item => {
					const firstEqualIndex = item.indexOf('=');
					if (firstEqualIndex > 0) {
						const cookieUid = item.substring(0, firstEqualIndex);
						const cookieStr = item.substring(firstEqualIndex + 1);
						if (cookieUid && cookieStr) {
							cookieMap[cookieUid] = cookieStr;
						}
					}
				});
				cookie = cookieMap[uid] || '';
			}
		}
	}
	
	if (!cookie) {
		return ctx.body(`<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>Bilibili 稍后阅读 - 错误</title>
    <link>https://www.bilibili.com</link>
    <description>稍后阅读功能需要登录 Cookie。请使用 Cloudflare Secrets 配置：wrangler secret put BILIBILI_COOKIES (格式：UID=COOKIE_STRING) 或本地开发时在 .dev.vars 中配置。详见 SECURITY.md</description>
    <language>zh-cn</language>
  </channel>
</rss>`, 200, {
			'Content-Type': 'application/xml; charset=utf-8',
		});
	}

	try {
		const response = await fetch('https://api.bilibili.com/x/v2/history/toview', {
			headers: {
				'Cookie': cookie,
				'Referer': `https://space.bilibili.com/${uid}/`,
				'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
			},
		});

		const data = await response.json();

		if (data.code !== 0) {
			return ctx.body(`<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>Bilibili 稍后阅读 - 错误</title>
    <link>https://www.bilibili.com</link>
    <description>API 错误: ${data.message || '未知错误'}</description>
    <language>zh-cn</language>
  </channel>
</rss>`, 200, {
				'Content-Type': 'application/xml; charset=utf-8',
			});
		}

		const list = data.data.list || [];
		let items = [];

		for (let item of list) {
			let description = item.desc || '';
			if (item.pic) {
				description = `<img src="${item.pic}"/><br/>${description}`;
			}
			description += `<br/><a href="https://www.bilibili.com/list/watchlater?bvid=${item.bvid}">在稍后再看列表中查看</a>`;

			let pubDate = new Date().toUTCString();
			if (item.add_at) {
				pubDate = new Date(item.add_at * 1000).toUTCString();
			}

			let link = `https://www.bilibili.com/video/${item.bvid}`;
			if (item.pubdate && item.pubdate > 1609459200) {
				// 2021-01-01 之后使用 bvid
				link = `https://www.bilibili.com/video/${item.bvid}`;
			} else {
				link = `https://www.bilibili.com/video/av${item.aid}`;
			}

			items.push({
				title: item.title,
				link: link,
				description: description,
				pubDate: pubDate,
				guid: link,
				author: item.owner?.name || '',
				category: 'video',
			});
		}

		let rssData = {
			title: `Bilibili 稍后阅读`,
			link: 'https://www.bilibili.com/watchlater#/list',
			description: `Bilibili 稍后阅读列表`,
			language: 'zh-cn',
			items: items,
		};

		return ctx.body(rss, 200, {
			'Content-Type': 'application/xml; charset=utf-8',
		});
	} catch (e) {
		console.error('Error fetching watchlater:', e);
		return ctx.body(`<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>Bilibili 稍后阅读 - 错误</title>
    <link>https://www.bilibili.com</link>
    <description>获取稍后阅读列表失败: ${e.message}</description>
    <language>zh-cn</language>
  </channel>
</rss>`, 200, {
			'Content-Type': 'application/xml; charset=utf-8',
		}nnel>
</rss>`);
	}
};

let setup = (route) => {
	route.get('/bilibili/user/watchlater/:uid', deal);
};

export default { setup };