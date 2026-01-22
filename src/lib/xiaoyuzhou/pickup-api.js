import { parseDate } from '../../utils/parse-date';
import { renderRss2 } from '../../utils/util';

/**
 * 小宇宙精选路由（真正的每日精选版本）
 * 使用官方 API 获取小宇宙 App 中的每日精选内容
 * 需要认证信息：XIAOYUZHOU_ID 和 XIAOYUZHOU_TOKEN
 * 
 * 工作流程（参考 RSSHub）：
 * 1. 使用 refresh_token 调用 /app_auth_tokens.refresh 获取 access_token
 * 2. 使用 access_token 调用 /v1/editor-pick/list 获取精选数据
 */

// 刷新 token 获取 access token
const refreshAccessToken = async (deviceId, refreshToken) => {
	const response = await fetch('https://api.xiaoyuzhoufm.com/app_auth_tokens.refresh', {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			'User-Agent': 'okhttp/4.7.2',
			'applicationid': 'app.podcast.cosmos',
			'app-version': '1.6.0',
			'x-jike-device-id': deviceId,
			'x-jike-refresh-token': refreshToken,
		},
	});
	
	if (!response.ok) {
		throw new Error(`Failed to refresh token: HTTP ${response.status}`);
	}
	
	const data = await response.json();
	return {
		accessToken: data['x-jike-access-token'],
		refreshToken: data['x-jike-refresh-token'],
	};
};

// 获取精选列表（官方 API）
const getPickupListFromAPI = async (deviceId, accessToken) => {
	const response = await fetch('https://api.xiaoyuzhoufm.com/v1/editor-pick/list', {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			'User-Agent': 'okhttp/4.7.2',
			'applicationid': 'app.podcast.cosmos',
			'app-version': '1.6.0',
			'x-jike-device-id': deviceId,
			'x-jike-access-token': accessToken,
		},
		body: JSON.stringify({
			limit: 20,
		}),
	});
	
	if (!response.ok) {
		throw new Error(`HTTP ${response.status}: ${response.statusText}`);
	}
	
	const data = await response.json();
	return data;
};

// 格式化单集描述
const formatDescription = (item) => {
	let description = '';
	
	// 添加封面图
	if (item.episode?.image?.picUrl) {
		description += `<img src="${item.episode.image.picUrl}"><br><br>`;
	} else if (item.podcast?.image?.picUrl) {
		description += `<img src="${item.podcast.image.picUrl}"><br><br>`;
	}
	
	// 添加播客信息
	if (item.podcast?.title) {
		description += `<strong>播客：</strong>${item.podcast.title}<br>`;
	}
	
	// 添加推荐理由（精选的核心内容）
	// comment 是一个对象，需要访问 text 字段
	if (item.comment && item.comment.text) {
		description += `<br><strong>📌 推荐理由：</strong><br>${item.comment.text.replace(/\n/g, '<br>')}<br>`;
	}
	
	// 添加单集描述
	const desc = item.episode?.description || '';
	if (desc) {
		description += `<br><strong>单集简介：</strong><br>${desc.replace(/\n/g, '<br>')}`;
	}
	
	// 添加音频播放器
	if (item.episode?.enclosure?.url) {
		description += `<br><br><audio controls src="${item.episode.enclosure.url}"></audio>`;
	}
	
	// 添加时长信息
	if (item.episode?.duration) {
		const duration = item.episode.duration;
		const hours = Math.floor(duration / 3600);
		const minutes = Math.floor((duration % 3600) / 60);
		const seconds = duration % 60;
		const durationStr = hours > 0 
			? `${hours}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
			: `${minutes}:${String(seconds).padStart(2, '0')}`;
		description += `<br><br>⏱️ 时长: ${durationStr}`;
	}
	
	return description;
};

let deal = async (ctx) => {
	try {
		const deviceId = ctx.env?.XIAOYUZHOU_ID;
		const refreshToken = ctx.env?.XIAOYUZHOU_TOKEN;
		
		// 检查认证信息
		if (!deviceId || !refreshToken) {
			throw new Error('Missing XIAOYUZHOU_ID or XIAOYUZHOU_TOKEN environment variables. Please configure authentication.');
		}
		
		// 第一步：刷新 token 获取 access token
		const tokens = await refreshAccessToken(deviceId, refreshToken);
		
		// 第二步：使用 access token 获取精选数据
		const data = await getPickupListFromAPI(deviceId, tokens.accessToken);
		
		if (!data.data || data.data.length === 0) {
			throw new Error('No pickup data returned from API');
		}
		
		// API 返回的数据是按日期分组的，需要展平
		// data.data 是一个数组，每个元素包含 date 和 picks
		const allPicks = [];
		for (const dayData of data.data) {
			if (dayData.picks && Array.isArray(dayData.picks)) {
				allPicks.push(...dayData.picks);
			}
		}
		
		if (allPicks.length === 0) {
			throw new Error('No pickup data returned from API');
		}
		
		// 转换为 RSS 格式
		const allItems = allPicks.map(pick => {
			const episode = pick.episode;
			const podcast = episode.podcast;
			
			return {
				title: `${episode.title} - ${podcast.title}`,
				link: `https://www.xiaoyuzhoufm.com/episode/${episode.eid}`,
				description: formatDescription({
					episode,
					podcast,
					comment: pick.comment
				}),
				pubDate: parseDate(episode.pubDate),
				guid: episode.eid,
				author: podcast.author || podcast.title,
				enclosure: episode.enclosure?.url ? {
					url: episode.enclosure.url,
					type: 'audio/mpeg',
					length: episode.enclosure.length || 0,
				} : undefined,
			};
		});
		
		// 去重：基于eid
		const seenEids = new Set();
		const items = allItems.filter(item => {
			if (!seenEids.has(item.guid)) {
				seenEids.add(item.guid);
				return true;
			}
			return false;
		});
		
		return ctx.body(
			renderRss2({
				title: '小宇宙每日精选',
				link: 'https://www.xiaoyuzhoufm.com',
				description: `小宇宙官方精选播客单集（共 ${items.length} 个）`,
				language: 'zh-cn',
				category: 'podcast',
				items,
			}),
			200,
			{
				'Content-Type': 'application/xml; charset=utf-8',
			}
		);
	} catch (error) {
		// 返回一个包含错误信息的 RSS，而不是抛出异常
		return ctx.body(`<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>小宇宙每日精选 - 错误</title>
    <link>https://www.xiaoyuzhoufm.com</link>
    <description>无法获取小宇宙精选数据。错误: ${error.message}</description>
    <language>zh-cn</language>
  </channel>
</rss>`, 200, {
			'Content-Type': 'application/xml; charset=utf-8',
		});
	}
};

let setup = (route) => {
	route.get('/xiaoyuzhou/pickup', deal);
};

export default {
	setup,
};
