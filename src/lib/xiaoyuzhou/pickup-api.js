import { parseDate } from '../../utils/parse-date';
import { renderRss2 } from '../../utils/util';

/**
 * 小宇宙精选路由（真正的每日精选版本）
 * 使用官方 API 获取小宇宙 App 中的每日精选内容
 * 需要认证信息：XIAOYUZHOU_ID 和 XIAOYUZHOU_TOKEN
 */

// 获取精选列表（官方 API）
const getPickupListFromAPI = async (deviceId, token) => {
	const response = await fetch('https://api.xiaoyuzhoufm.com/v1/pickup/list', {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
			'x-jike-device-id': deviceId,
			'x-jike-refresh-token': token,
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

// 从网页中提取 __NEXT_DATA__（备用方案）
const getPageData = async (url) => {
	const response = await fetch(url, {
		headers: {
			'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
			'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
			'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
			'Accept-Encoding': 'gzip, deflate, br',
			'Referer': 'https://www.xiaoyuzhoufm.com/',
			'DNT': '1',
			'Connection': 'keep-alive',
			'Upgrade-Insecure-Requests': '1',
			'Sec-Fetch-Dest': 'document',
			'Sec-Fetch-Mode': 'navigate',
			'Sec-Fetch-Site': 'same-origin',
			'Cache-Control': 'max-age=0',
		},
	});
	
	if (!response.ok) {
		throw new Error(`HTTP ${response.status}: ${response.statusText}`);
	}
	
	const html = await response.text();
	
	// 提取 __NEXT_DATA__ 中的 JSON 数据
	const match = html.match(/<script id="__NEXT_DATA__" type="application\/json">(.*?)<\/script>/);
	if (!match) {
		throw new Error('Failed to find __NEXT_DATA__ in page');
	}
	
	return JSON.parse(match[1]);
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
	if (item.comment) {
		description += `<br><strong>📌 推荐理由：</strong><br>${item.comment.replace(/\n/g, '<br>')}<br>`;
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

// 使用备用方案（网页抓取）
const getFallbackData = async () => {
	const hotPodcasts = [
		'6021f949a789fca4eff4492c', // 知行小酒馆
		'613753ef0a1a89cf1e0ab0aa', // 随机波动
		'6048fa9bde0c7ee375cf4216', // 声东击西
		'60d2a6e8a789fca4eff49ac0', // 忽左忽右
		'5e280fa7418a84a0461f912b', // 故事FM
	];
	
	const allEpisodes = [];
	
	await Promise.all(
		hotPodcasts.map(async (pid) => {
			try {
				const podcastUrl = `https://www.xiaoyuzhoufm.com/podcast/${pid}`;
				const pageData = await getPageData(podcastUrl);
				const podcast = pageData.props?.pageProps?.podcast;
				
				if (podcast && podcast.episodes && podcast.episodes.length > 0) {
					const latestEpisodes = podcast.episodes.slice(0, 2).map(episode => ({
						episode,
						podcast: {
							title: podcast.title,
							author: podcast.author,
							pid: podcast.pid,
						},
					}));
					allEpisodes.push(...latestEpisodes);
				}
			} catch (err) {
				console.error(`Failed to fetch podcast ${pid}:`, err.message);
			}
		})
	);
	
	allEpisodes.sort((a, b) => new Date(b.episode.pubDate) - new Date(a.episode.pubDate));
	return allEpisodes.slice(0, 20);
};

let deal = async (ctx) => {
	try {
		const deviceId = ctx.env?.XIAOYUZHOU_ID;
		const token = ctx.env?.XIAOYUZHOU_TOKEN;
		
		let items = [];
		let title = '小宇宙精选';
		let description = '小宇宙每日精选播客单集';
		
		// 尝试使用 API 获取真正的精选
		if (deviceId && token) {
			try {
				const data = await getPickupListFromAPI(deviceId, token);
				
				if (data.data && data.data.length > 0) {
					// 成功获取到精选数据
					items = data.data.map(item => ({
						title: `${item.episode.title} - ${item.podcast.title}`,
						link: `https://www.xiaoyuzhoufm.com/episode/${item.episode.eid}`,
						description: formatDescription(item),
						pubDate: parseDate(item.episode.pubDate),
						guid: item.episode.eid,
						author: item.podcast.author || item.podcast.title,
						enclosure: item.episode.enclosure?.url ? {
							url: item.episode.enclosure.url,
							type: 'audio/mpeg',
							length: item.episode.enclosure.length || 0,
						} : undefined,
					}));
					
					title = '小宇宙每日精选';
					description = `小宇宙官方精选播客单集（共 ${items.length} 个）`;
				}
			} catch (apiError) {
				console.error('API call failed, falling back to web scraping:', apiError.message);
				// API 失败，使用备用方案
			}
		}
		
		// 如果 API 失败或没有配置认证信息，使用备用方案
		if (items.length === 0) {
			const fallbackData = await getFallbackData();
			
			items = fallbackData.map(item => ({
				title: `${item.episode.title} - ${item.podcast.title}`,
				link: `https://www.xiaoyuzhoufm.com/episode/${item.episode.eid}`,
				description: formatDescription(item),
				pubDate: parseDate(item.episode.pubDate),
				guid: item.episode.eid,
				author: item.podcast.author || item.podcast.title,
				enclosure: item.episode.enclosure?.url ? {
					url: item.episode.enclosure.url,
					type: 'audio/mpeg',
					length: item.episode.enclosure.length || 0,
				} : undefined,
			}));
			
			title = '小宇宙精选（热门播客）';
			description = '小宇宙热门播客最新单集（备用方案）';
		}
		
		ctx.header('Content-Type', 'application/xml');
		return ctx.text(
			renderRss2({
				title,
				link: 'https://www.xiaoyuzhoufm.com',
				description,
				language: 'zh-cn',
				category: 'podcast',
				items,
			})
		);
	} catch (error) {
		throw new Error(`Failed to fetch pickup data: ${error.message}`);
	}
};

let setup = (route) => {
	route.get('/xiaoyuzhou/pickup', deal);
};

export default {
	setup,
};
