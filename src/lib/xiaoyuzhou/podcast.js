import { parseDate } from '../../utils/parse-date';
import { renderRss2 } from '../../utils/util';

/**
 * 小宇宙播客路由
 * 支持播客和单集订阅
 * 通过抓取网页数据实现，无需认证
 */

// 从网页中提取 __NEXT_DATA__
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

// 获取单集详情
const getEpisodeDetail = async (buildId, eid) => {
	const url = `https://www.xiaoyuzhoufm.com/_next/data/${buildId}/episode/${eid}.json`;
	const response = await fetch(url, {
		headers: {
			'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
			'Accept': 'application/json',
			'Accept-Language': 'zh-CN,zh;q=0.9',
			'Referer': `https://www.xiaoyuzhoufm.com/episode/${eid}`,
			'Sec-Fetch-Dest': 'empty',
			'Sec-Fetch-Mode': 'cors',
			'Sec-Fetch-Site': 'same-origin',
		},
	});
	
	if (!response.ok) {
		return null;
	}
	
	const data = await response.json();
	return data.pageProps?.episode;
};

// 格式化单集描述
const formatDescription = (episode) => {
	let description = '';
	
	// 添加封面图
	if (episode.image?.picUrl) {
		description += `<img src="${episode.image.picUrl}"><br><br>`;
	}
	
	// 添加描述
	const desc = episode.shownotes || episode.description || '';
	if (desc) {
		description += desc.replace(/\n/g, '<br>');
	}
	
	// 添加音频播放器
	if (episode.enclosure?.url) {
		description += `<br><br><audio controls src="${episode.enclosure.url}"></audio>`;
	}
	
	// 添加时长信息
	if (episode.duration) {
		const hours = Math.floor(episode.duration / 3600);
		const minutes = Math.floor((episode.duration % 3600) / 60);
		const seconds = episode.duration % 60;
		const durationStr = hours > 0 
			? `${hours}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
			: `${minutes}:${String(seconds).padStart(2, '0')}`;
		description += `<br><br>时长: ${durationStr}`;
	}
	
	return description;
};

let deal = async (ctx) => {
	const { id } = ctx.req.param();
	
	let title, link, description, items, podcast;
	
	try {
		// 首先尝试作为播客 ID 获取
		try {
			const podcastUrl = `https://www.xiaoyuzhoufm.com/podcast/${id}`;
			const pageData = await getPageData(podcastUrl);
			
			podcast = pageData.props?.pageProps?.podcast;
			if (!podcast || !podcast.episodes) {
				throw new Error('Not a podcast');
			}
			
			title = podcast.title;
			link = podcastUrl;
			description = podcast.description || `${podcast.title} 的播客`;
			
			// 获取单集详情
			const buildId = pageData.buildId;
			const episodes = await Promise.all(
				podcast.episodes.slice(0, 20).map(async (episode) => {
					// 尝试获取完整的 shownotes
					const detail = await getEpisodeDetail(buildId, episode.eid);
					if (detail) {
						episode.shownotes = detail.shownotes || episode.description;
					}
					
					return {
						title: episode.title,
						link: `https://www.xiaoyuzhoufm.com/episode/${episode.eid}`,
						description: formatDescription(episode),
						pubDate: parseDate(episode.pubDate),
						guid: episode.eid,
						author: podcast.author || podcast.title,
						enclosure: episode.enclosure?.url ? {
							url: episode.enclosure.url,
							type: 'audio/mpeg',
							length: episode.enclosure.length || 0,
						} : undefined,
					};
				})
			);
			
			// 去重：基于eid
			const seenEids = new Set();
			items = episodes.filter(ep => {
				if (!seenEids.has(ep.guid)) {
					seenEids.add(ep.guid);
					return true;
				}
				return false;
			});
		} catch (podcastError) {
			// 如果作为播客 ID 失败，尝试作为单集 ID
			const episodeUrl = `https://www.xiaoyuzhoufm.com/episode/${id}`;
			const pageData = await getPageData(episodeUrl);
			
			const episode = pageData.props?.pageProps?.episode;
			if (!episode) {
				throw new Error('Episode not found');
			}
			
			podcast = episode.podcast;
			
			title = `${episode.title} - ${podcast.title}`;
			link = episodeUrl;
			description = episode.shownotes || episode.description || episode.title;
			
			items = [{
				title: episode.title,
				link: episodeUrl,
				description: formatDescription(episode),
				pubDate: parseDate(episode.pubDate),
				guid: episode.eid,
				author: podcast.author || podcast.title,
				enclosure: episode.enclosure?.url ? {
					url: episode.enclosure.url,
					type: 'audio/mpeg',
					length: episode.enclosure.length || 0,
				} : undefined,
			}];
		}
	} catch (error) {
		// 返回一个包含错误信息的 RSS，而不是抛出异常
		return ctx.body(`<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>小宇宙播客 - 错误</title>
    <link>https://www.xiaoyuzhoufm.com/podcast/${id}</link>
    <description>无法获取播客 ${id} 的数据。错误: ${error.message}</description>
    <language>zh-cn</language>
  </channel>
</rss>`, 200, {
			'Content-Type': 'application/xml; charset=utf-8',
		});
	}
	
	return ctx.body(
		renderRss2({
			title,
			link,
			description,
			language: 'zh-cn',
			category: 'podcast',
			items,
		}),
		200,
		{
			'Content-Type': 'application/xml; charset=utf-8',
		}
	);
};

let setup = (route) => {
	route.get('/xiaoyuzhou/podcast/:id', deal);
};

export default {
	setup,
};
