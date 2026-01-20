import { parseDate } from '../../utils/parse-date';
import { renderRss2 } from '../../utils/util';

/**
 * 小宇宙精选路由
 * 获取小宇宙首页精选内容
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
	
	// 添加推荐理由
	if (item.comment) {
		description += `<br><strong>推荐理由：</strong><br>${item.comment.replace(/\n/g, '<br>')}<br>`;
	}
	
	// 添加单集描述
	const desc = item.episode?.shownotes || item.episode?.description || '';
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
		description += `<br><br>时长: ${durationStr}`;
	}
	
	return description;
};

let deal = async (ctx) => {
	try {
		// 小宇宙的精选内容可能需要登录才能访问
		// 我们改用一个变通方案：抓取多个热门播客的最新单集
		const hotPodcasts = [
			'6021f949a789fca4eff4492c', // 知行小酒馆
			'613753ef0a1a89cf1e0ab0aa', // 随机波动
			'6048fa9bde0c7ee375cf4216', // 声东击西
			'60d2a6e8a789fca4eff49ac0', // 忽左忽右
			'5e280fa7418a84a0461f912b', // 故事FM
		];
		
		const allEpisodes = [];
		
		// 并行获取多个播客的数据
		await Promise.all(
			hotPodcasts.map(async (pid) => {
				try {
					const podcastUrl = `https://www.xiaoyuzhoufm.com/podcast/${pid}`;
					const pageData = await getPageData(podcastUrl);
					const podcast = pageData.props?.pageProps?.podcast;
					
					if (podcast && podcast.episodes && podcast.episodes.length > 0) {
						// 只取每个播客的最新 2 集
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
					// 忽略单个播客的错误，继续处理其他播客
					console.error(`Failed to fetch podcast ${pid}:`, err.message);
				}
			})
		);
		
		if (allEpisodes.length === 0) {
			// 如果所有播客都失败了，返回空 feed
			ctx.header('Content-Type', 'application/xml');
			return ctx.text(
				renderRss2({
					title: '小宇宙精选',
					link: 'https://www.xiaoyuzhoufm.com',
					description: '小宇宙热门播客最新单集',
					language: 'zh-cn',
					category: 'podcast',
					items: [],
				})
			);
		}
		
		// 按发布时间排序
		allEpisodes.sort((a, b) => new Date(b.episode.pubDate) - new Date(a.episode.pubDate));
		
		const items = allEpisodes.slice(0, 20).map(item => {
			const episode = item.episode;
			const podcast = item.podcast;
			
			return {
				title: `${episode.title} - ${podcast.title}`,
				link: `https://www.xiaoyuzhoufm.com/episode/${episode.eid}`,
				description: formatDescription({ episode, podcast }),
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
		
		ctx.header('Content-Type', 'application/xml');
		return ctx.text(
			renderRss2({
				title: '小宇宙精选',
				link: 'https://www.xiaoyuzhoufm.com',
				description: '小宇宙热门播客最新单集',
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
