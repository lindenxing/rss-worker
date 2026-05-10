import { renderRss2 } from '../../../utils/util';
import { GetDynSpace } from '../grpc_helper';

// 确保日期总是有效的
const ensureValidDate = (date) => {
	if (isNaN(date.getTime())) {
		return new Date();
	}
	return date;
};

let getPubDate = (ptimeLabelText) => {
	let pubDate = new Date().toUTCString();
	try {
		if (!ptimeLabelText) return pubDate;
		if (ptimeLabelText.indexOf('小时前') !== -1) {
			let today = new Date();
			pubDate = ensureValidDate(new Date(today.getFullYear(), today.getMonth(), today.getDate())).toUTCString();
		} else if (ptimeLabelText.indexOf('分钟前') !== -1) {
			let today = new Date();
			pubDate = ensureValidDate(new Date(today.getFullYear(), today.getMonth(), today.getDate())).toUTCString();
		} else if (ptimeLabelText.indexOf('刚刚') !== -1) {
			let today = new Date();
			pubDate = ensureValidDate(new Date(today.getFullYear(), today.getMonth(), today.getDate())).toUTCString();
		} else if (ptimeLabelText.indexOf('昨天') !== -1) {
			let yesterday = new Date(new Date().getTime() - 24 * 60 * 60 * 1000);
			pubDate = ensureValidDate(new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate())).toUTCString();
		} else if (ptimeLabelText.indexOf('天前') !== -1) {
			let day = ptimeLabelText.split('天前')[0];
			let targetDate = new Date(new Date().getTime() - day * 24 * 60 * 60 * 1000);
			pubDate = ensureValidDate(new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate())).toUTCString();
		} else if (ptimeLabelText.indexOf('年') !== -1) {
			let year = ptimeLabelText.split('年')[0];
			let month = ptimeLabelText.split('年')[1].split('月')[0];
			let day = ptimeLabelText.split('年')[1].split('月')[1].split('日')[0];
			pubDate = ensureValidDate(new Date(year, month - 1, day)).toUTCString();
		} else {
			let year = new Date().getFullYear();
			let month = ptimeLabelText.split('月')[0];
			let day = ptimeLabelText.split('月')[1].split('日')[0];
			pubDate = ensureValidDate(new Date(year, month - 1, day)).toUTCString();
		}
	} catch (e) {
		pubDate = new Date().toUTCString();
	}
	return pubDate;
};

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
		// Cookie 不存在时，直接使用 gRPC 获取用户视频作为替代
		console.log(`[watchlater] No cookie found, using gRPC fallback for uid: ${uid}`);
		return await handleGrpcFallback(ctx, uid);
	}

	try {
		// 使用 gRPC 方式获取稍后再看列表，避免 HTTP API 被 Bilibili 封禁
		// 先通过 gRPC 获取用户动态，再从中筛选稍后再看
		// 由于 gRPC 不支持稍后再看列表，改用 wbi 签名方式调用 HTTP API
		const response = await fetch('https://api.bilibili.com/x/v2/history/toview', {
			headers: {
				'Cookie': cookie,
				'Referer': `https://www.bilibili.com/`,
				'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
				'Accept': 'application/json, text/plain, */*',
				'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
				'Origin': 'https://www.bilibili.com',
			},
		});

	// 如果 HTTP API 被封禁，尝试使用 gRPC 方式获取用户视频作为替代
	if (!contentType.includes('application/json') || response.status === 412) {
		console.log(`[watchlater] HTTP API blocked (status: ${response.status}), falling back to gRPC`);
		return await handleGrpcFallback(ctx, uid);
	}

		const data = await response.json();

		if (data.code !== 0) {
			const errorMsg = (data.message || '未知错误')
				.replace(/&/g, '&amp;')
				.replace(/</g, '&lt;')
				.replace(/>/g, '&gt;')
				.replace(/"/g, '&quot;')
				.replace(/'/g, '&apos;');
			// 如果 HTTP API 返回 banned 错误，尝试 gRPC 替代方案
			if (data.message === 'request was banned') {
				console.log(`[watchlater] HTTP API banned, falling back to gRPC`);
				return await handleGrpcFallback(ctx, uid);
			}
			return ctx.body(`<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>Bilibili 稍后阅读 - 错误</title>
    <link>https://www.bilibili.com</link>
    <description>API 错误: ${errorMsg}</description>
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

		// 去重：基于guid字段，保留第一次出现的条目
		let seenGuids = new Set();
		let uniqueItems = [];
		for (let item of items) {
			if (!seenGuids.has(item.guid)) {
				seenGuids.add(item.guid);
				uniqueItems.push(item);
			}
		}

		let rssData = {
			title: `Bilibili 稍后阅读`,
			link: 'https://www.bilibili.com/watchlater#/list',
			description: `Bilibili 稍后阅读列表`,
			language: 'zh-cn',
			items: uniqueItems,
		};

		let rss = renderRss2(rssData);
		return ctx.body(rss, 200, {
			'Content-Type': 'application/xml; charset=utf-8',
		});
	} catch (e) {
		console.error('Error fetching watchlater:', e);
		// 尝试 gRPC 替代方案
		try {
			return await handleGrpcFallback(ctx, uid);
		} catch (grpcError) {
			const errorMsg = (grpcError.message || '未知错误')
				.replace(/&/g, '&amp;')
				.replace(/</g, '&lt;')
				.replace(/>/g, '&gt;')
				.replace(/"/g, '&quot;')
				.replace(/'/g, '&apos;');
			return ctx.body(`<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>Bilibili 稍后阅读 - 错误</title>
    <link>https://www.bilibili.com</link>
    <description>获取稍后阅读列表失败: ${errorMsg}</description>
    <language>zh-cn</language>
  </channel>
</rss>`, 200, {
				'Content-Type': 'application/xml; charset=utf-8',
			});
		}
	}
};

// gRPC 替代方案：获取用户视频动态作为稍后阅读的替代
let handleGrpcFallback = async (ctx, uid) => {
	let dynSpaceResJson;
	try {
		dynSpaceResJson = await GetDynSpace(uid);
	} catch (e) {
		throw new Error('gRPC 请求也失败: ' + e.message);
	}
	
	// 调试：输出原始 gRPC 响应类型和内容
	const rawType = typeof dynSpaceResJson;
	const rawLength = typeof dynSpaceResJson === 'string' ? dynSpaceResJson.length : 'N/A';
	const rawPreview = typeof dynSpaceResJson === 'string' ? dynSpaceResJson.substring(0, 500) : JSON.stringify(dynSpaceResJson).substring(0, 500);
	
	// 如果 gRPC 返回空数据，直接返回调试信息
	if (rawLength <= 2) {
		// 尝试直接调用 video.js 的逻辑
		let rssData = {
			title: `Bilibili 稍后阅读 - gRPC 空`,
			link: `https://space.bilibili.com/${uid}/video`,
			description: `gRPC 返回空数据 (长度: ${rawLength})。UID ${uid} 可能不是 UP 主，没有视频动态。稍后阅读功能需要 Bilibili HTTP API 配合 Cookie 使用，但该 API 从 Cloudflare Workers 调用会被 Bilibili 封禁 (412/request was banned)。建议：1) 在本地网络环境运行此服务 2) 使用 /bilibili/user/video/:uid 路由代替`,
			language: 'zh-cn',
			items: [],
		};
		let rss = renderRss2(rssData);
		return ctx.body(rss, 200, {
			'Content-Type': 'application/xml; charset=utf-8',
		});
	}
	
	let dynSpaceRes;
	try {
		dynSpaceRes = typeof dynSpaceResJson === 'string' ? JSON.parse(dynSpaceResJson) : dynSpaceResJson;
	} catch (parseErr) {
		let rssData = {
			title: `Bilibili 稍后阅读 - 解析错误`,
			link: `https://space.bilibili.com/${uid}/video`,
			description: `gRPC 响应 JSON 解析失败。类型: ${rawType}, 长度: ${rawLength}, 内容: ${rawPreview}`,
			language: 'zh-cn',
			items: [],
		};
		let rss = renderRss2(rssData);
		return ctx.body(rss, 200, {
			'Content-Type': 'application/xml; charset=utf-8',
		});
	}
	
	const list = dynSpaceRes.list || [];
	
	// 如果没有视频数据，返回调试信息
	if (!list || list.length === 0) {
		let rssData = {
			title: `Bilibili 稍后阅读 - 调试`,
			link: `https://space.bilibili.com/${uid}/video`,
			description: `gRPC 返回数据为空。原始长度: ${rawLength}, 原始前500字符: ${rawPreview}`,
			language: 'zh-cn',
			items: [],
		};
		let rss = renderRss2(rssData);
		return ctx.body(rss, 200, {
			'Content-Type': 'application/xml; charset=utf-8',
		});
	}
	
	let items = [];
	for (let card of list) {
		// 不限制 cardType，尝试从所有类型中提取视频信息
		let title = '';
		let bvid = '';
		let author = '';
		let pubDate = new Date().toUTCString();
		let description = '';
		let coverUrl = '';
		
		// 从 modules 中获取信息
		if (card.modules && Array.isArray(card.modules)) {
			for (let _module of card.modules) {
				if (_module.moduleType === 'module_dynamic' && _module.moduleDynamic) {
					// 尝试 dynArchive
					if (_module.moduleDynamic.dynArchive) {
						bvid = _module.moduleDynamic.dynArchive.bvid || '';
						title = _module.moduleDynamic.dynArchive.title || title;
						coverUrl = _module.moduleDynamic.dynArchive.cover || '';
						description = _module.moduleDynamic.dynArchive.desc || '';
					}
				}
				if (_module.moduleType === 'module_author') {
					author = _module.moduleAuthor?.author?.name || '';
					let ptimeLabelText = _module.moduleAuthor?.ptimeLabelText;
					if (ptimeLabelText) {
						pubDate = getPubDate(ptimeLabelText);
					}
				}
			}
		}
		
		// 从 extend 中补充标题
		if (!title && card.extend?.origDesc && Array.isArray(card.extend.origDesc)) {
			for (let desc of card.extend.origDesc) {
				title += desc.text || '';
			}
		}
		
		// 如果没有 bvid，跳过
		if (!bvid) continue;
		
		let link = `https://www.bilibili.com/video/${bvid}`;
		let fullDescription = title;
		if (coverUrl) {
			fullDescription += `<br/><img src="${coverUrl}"/>`;
		}
		if (description) {
			fullDescription += `<br/>${description}`;
		}
		
		items.push({
			title: title || '未知标题',
			link: link,
			description: fullDescription,
			pubDate: pubDate,
			guid: link,
			author: author,
			category: 'video',
		});
	}
	
	// 去重
	let seenGuids = new Set();
	let uniqueItems = [];
	for (let item of items) {
		if (!seenGuids.has(item.guid)) {
			seenGuids.add(item.guid);
			uniqueItems.push(item);
		}
	}
	
	let rssData = {
		title: `Bilibili 用户视频 (稍后阅读不可用，显示用户最新视频)`,
		link: `https://space.bilibili.com/${uid}/video`,
		description: `Bilibili 稍后阅读 API 被封禁，暂时显示用户最新视频`,
		language: 'zh-cn',
		items: uniqueItems,
	};
	
	let rss = renderRss2(rssData);
	return ctx.body(rss, 200, {
		'Content-Type': 'application/xml; charset=utf-8',
	});
};

let setup = (route) => {
	route.get('/bilibili/user/watchlater/:uid', deal);
};

export default { setup };