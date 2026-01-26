import { parseDate } from '../../utils/parse-date';
import { renderRss2 } from '../../utils/util';

/**
 * 抖音用户视频路由
 * 注意：抖音有严格的反爬机制，此实现可能随时失效
 * 建议配合 Cookie 使用以提高成功率
 */

// 生成随机的设备指纹参数
const generateDeviceId = () => {
	return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
};

// 构建请求头
const buildHeaders = (cookie = '') => {
	const headers = {
		'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
		'Referer': 'https://www.douyin.com/',
		'Accept': 'application/json, text/plain, */*',
		'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
		'Accept-Encoding': 'gzip, deflate, br',
		'Origin': 'https://www.douyin.com',
		'Connection': 'keep-alive',
		'Sec-Fetch-Dest': 'empty',
		'Sec-Fetch-Mode': 'cors',
		'Sec-Fetch-Site': 'same-origin',
	};
	
	if (cookie) {
		headers['Cookie'] = cookie;
	}
	
	return headers;
};

// 从网页中提取初始数据（备用方案）
const extractDataFromPage = async (uid) => {
	const pageUrl = `https://www.douyin.com/user/${uid}`;
	
	try {
		const response = await fetch(pageUrl, {
			headers: buildHeaders(),
		});
		
		if (!response.ok) {
			throw new Error(`HTTP ${response.status}: ${response.statusText}`);
		}
		
		const html = await response.text();
		
		// 尝试从页面中提取 RENDER_DATA
		const renderDataMatch = html.match(/<script id="RENDER_DATA" type="application\/json">(.*?)<\/script>/);
		if (renderDataMatch) {
			try {
				const renderData = JSON.parse(decodeURIComponent(renderDataMatch[1]));
				return renderData;
			} catch (e) {
				// 解析失败，继续尝试其他方法
			}
		}
		
		// 尝试提取 SSR 数据
		const ssrMatch = html.match(/window\._ROUTER_DATA\s*=\s*({.*?})<\/script>/);
		if (ssrMatch) {
			try {
				const ssrData = JSON.parse(ssrMatch[1]);
				return ssrData;
			} catch (e) {
				// 解析失败
			}
		}
		
		return null;
	} catch (error) {
		throw new Error(`Failed to fetch page data: ${error.message}`);
	}
};

// 尝试直接调用 API（可能需要签名）
const fetchUserVideos = async (uid, cookie = '') => {
	// 抖音的 API 端点（可能需要更新）
	const apiUrl = `https://www.douyin.com/aweme/v1/web/aweme/post/?device_platform=webapp&aid=6383&channel=channel_pc_web&sec_user_id=${uid}&max_cursor=0&locate_query=false&show_live_replay_strategy=1&need_time_list=1&time_list_query=0&whale_cut_token=&cut_version=1&count=18&publish_video_strategy_type=2`;
	
	try {
		const response = await fetch(apiUrl, {
			headers: buildHeaders(cookie),
		});
		
		if (!response.ok) {
			// API 调用失败，尝试从网页提取
			return null;
		}
		
		const data = await response.json();
		
		if (data.status_code === 0 && data.aweme_list) {
			return data;
		}
		
		return null;
	} catch (error) {
		return null;
	}
};

// 格式化视频数据
const formatVideoItem = (video, embed = false) => {
	const title = video.desc || video.preview_title || '无标题';
	const videoId = video.aweme_id;
	const link = `https://www.douyin.com/video/${videoId}`;
	
	// 获取封面图
	let coverUrl = '';
	if (video.video?.cover?.url_list?.length > 0) {
		coverUrl = video.video.cover.url_list[0];
	} else if (video.video?.origin_cover?.url_list?.length > 0) {
		coverUrl = video.video.origin_cover.url_list[0];
	}
	
	// 获取视频链接
	let videoUrl = '';
	if (video.video?.play_addr?.url_list?.length > 0) {
		videoUrl = video.video.play_addr.url_list[0];
	} else if (video.video?.bit_rate?.length > 0) {
		videoUrl = video.video.bit_rate[0].play_addr?.url_list?.[0] || '';
	}
	
	// 构建描述
	let description = '';
	const desc = (video.desc || '').replace(/\n/g, '<br>');
	
	if (embed && videoUrl) {
		// 内嵌视频模式
		description = `
			<video controls poster="${coverUrl}" style="max-width: 100%;">
				<source src="${videoUrl}" type="video/mp4">
				您的浏览器不支持视频播放。
			</video>
			<br>
			${desc}
		`;
	} else {
		// 封面图 + 链接模式
		description = coverUrl ? `<img src="${coverUrl}" style="max-width: 100%;"><br>` : '';
		description += desc;
		if (videoUrl) {
			description += `<br><br><a href="${videoUrl}" target="_blank">📹 视频直链</a>`;
		}
	}
	
	// 获取标签并去重
	const tags = video.text_extra
		?.filter(tag => tag.hashtag_name)
		.map(tag => tag.hashtag_name) || [];
	const uniqueTags = [...new Set(tags)]; // 去重标签
	
	return {
		title: title.split('\n')[0] || title, // 使用第一行作为标题
		link,
		guid: videoId,
		description,
		pubDate: parseDate(video.create_time * 1000),
		category: uniqueTags,
		author: video.author?.nickname || '',
	};
};

const deal = async (ctx) => {
	const { uid } = ctx.req.param();
	const routeParams = ctx.req.query() || {};
	
	// 验证 UID 格式
	if (!uid.startsWith('MS4wLjABAAAA')) {
		throw new Error('Invalid UID. UID should start with MS4wLjABAAAA');
	}
	
	// 解析参数
	const embed = routeParams.embed === '1' || routeParams.embed === 'true';
	const cookie = ctx.env?.DOUYIN_COOKIE || '';
	
	// 尝试获取数据
	let videoData = await fetchUserVideos(uid, cookie);
	
	// 如果 API 失败，尝试从网页提取（备用方案）
	if (!videoData) {
		const pageData = await extractDataFromPage(uid);
		if (pageData) {
			// 尝试从页面数据中提取视频列表
			// 注意：这部分需要根据实际的页面结构调整
			videoData = pageData;
		}
	}
	
	if (!videoData || !videoData.aweme_list || videoData.aweme_list.length === 0) {
		// 返回一个包含错误信息的 RSS，而不是抛出异常
		return ctx.body(`<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>抖音用户视频 - 错误</title>
    <link>https://www.douyin.com/user/${uid}</link>
    <description>无法获取用户 ${uid} 的视频数据。这可能是由于反爬虫机制导致的。请稍后重试或提供有效的 DOUYIN_COOKIE。</description>
    <language>zh-cn</language>
  </channel>
</rss>`, 200, {
			'Content-Type': 'application/xml; charset=utf-8',
		});
	}
	
	// 获取用户信息
	const userInfo = videoData.aweme_list[0]?.author || {};
	const userName = userInfo.nickname || 'Unknown User';
	const userAvatar = userInfo.avatar_thumb?.url_list?.[0] || '';
	const userDesc = userInfo.signature || '';
	
	// 格式化视频列表
	const allItems = videoData.aweme_list.map(video => formatVideoItem(video, embed));
	
	// 去重：基于videoId（guid）
	const seenIds = new Set();
	const items = allItems.filter(item => {
		if (!seenIds.has(item.guid)) {
			seenIds.add(item.guid);
			return true;
		}
		return false;
	});
	
	return ctx.body(
		renderRss2({
			title: `${userName} - 抖音`,
			description: userDesc,
			image: userAvatar,
			link: `https://www.douyin.com/user/${uid}`,
			items,
		}),
		200,
		{
			'Content-Type': 'application/xml; charset=utf-8',
		}
	);
};

export default {
	setup: (route) => {
		route.get('/douyin/user/:uid', deal);
	},
};
