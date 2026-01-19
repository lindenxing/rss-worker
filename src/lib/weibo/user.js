import weiboUtils from './utils';
import { parseDate } from '../../utils/parse-date';
import { renderRss2 } from '../../utils/util';

// 获取访客 Cookie
let getVisitorCookie = async () => {
	try {
		const response = await fetch('https://passport.weibo.com/visitor/genvisitor', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/x-www-form-urlencoded',
				'Referer': 'https://weibo.com/',
				'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
			},
			body: 'cb=gen_callback&fp={"os":"1","browser":"Chrome122,0,0,0","fonts":"undefined","screenInfo":"1920*1080*24","plugins":""}',
		});
		const data = await response.json();
		if (data.data && data.data.sub && data.data.subp) {
			return `SUB=${data.data.sub}; SUBP=${data.data.subp}`;
		}
	} catch (e) {
		// 忽略错误，继续尝试不带 Cookie
	}
	return '';
};

let deal = async (ctx) => {
	const { uid } = ctx.req.param();
	let displayVideo = '1';
	let displayArticle = '0';
	let displayComments = '0';

	// 优先使用环境变量中配置的 Cookie，否则尝试获取访客 Cookie
	let cookie = ctx.env?.WEIBO_COOKIES || '';
	if (!cookie) {
		cookie = await getVisitorCookie();
	}
	
	const headers = {
		'Referer': `https://m.weibo.cn/u/${uid}`,
		'MWeibo-Pwa': '1',
		'X-Requested-With': 'XMLHttpRequest',
		'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
		'Accept': 'application/json, text/plain, */*',
		'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
	};
	
	if (cookie) {
		headers['Cookie'] = cookie;
	}

	let containerData;
	try {
		const response = await fetch(`https://m.weibo.cn/api/container/getIndex?type=uid&value=${uid}`, {
			headers,
		});
		
		if (!response.ok) {
			throw new Error(`HTTP ${response.status}: ${response.statusText}`);
		}
		
		containerData = await response.json();
	} catch (error) {
		throw new Error(`Failed to fetch user data from Weibo API: ${error.message}`);
	}

	if (!containerData.data || !containerData.data.userInfo || !containerData.data.tabsInfo || !containerData.data.tabsInfo.tabs) {
		throw new Error('User not found or API response invalid. The user may not exist or requires login to view.');
	}

	const name = containerData.data.userInfo.screen_name;
	const description = containerData.data.userInfo.description;
	const profileImageUrl = containerData.data.userInfo.profile_image_url;
	const weiboTab = containerData.data.tabsInfo.tabs.filter((item) => item.tab_type === 'weibo')[0];
	if (!weiboTab) {
		throw new Error('User has no weibo posts or API response invalid');
	}
	const containerId = weiboTab.containerid;

	let cardsResponse;
	try {
		const response = await fetch(`https://m.weibo.cn/api/container/getIndex?type=uid&value=${uid}&containerid=${containerId}`, {
			headers,
		});
		
		if (!response.ok) {
			throw new Error(`HTTP ${response.status}: ${response.statusText}`);
		}
		
		cardsResponse = await response.json();
	} catch (error) {
		throw new Error(`Failed to fetch user posts from Weibo API: ${error.message}`);
	}

	if (!cardsResponse.data || !cardsResponse.data.cards) {
		throw new Error('Failed to fetch user posts or API response invalid. The user may have no posts or requires login to view.');
	}

	const cards = cardsResponse.data.cards;

	let resultItems = await Promise.all(
		cards
			.filter((item) => item.mblog)
			.map(async (item) => {
				// TODO: unify cache key and let weiboUtils.getShowData() handle the cache? It seems safe to do so.
				//       Need more investigation, pending for now since the current version works fine.
				// TODO: getShowData() on demand? The API seems to return most things we need since 2022/05/21.
				//       Need more investigation, pending for now since the current version works fine.
				// const data = await ctx.cache.tryGet(key, () => weiboUtils.getShowData(uid, item.mblog.bid));
				const data = await weiboUtils.getShowData(uid, item.mblog.bid);

				if (data && data.text) {
					item.mblog.text = data.text;
					item.mblog.created_at = parseDate(data.created_at);
					item.mblog.pics = data.pics;
					if (item.mblog.retweeted_status && data.retweeted_status) {
						item.mblog.retweeted_status.created_at = data.retweeted_status.created_at;
					}
				} else {
					item.mblog.created_at = item.mblog.created_at;
				}

				// 转发的长微博处理
				const retweet = item.mblog.retweeted_status;
				if (retweet && retweet.isLongText) {
					// TODO: unify cache key and ...
					// const retweetData = await ctx.cache.tryGet(`weibo:retweeted:${retweet.user.id}:${retweet.bid}`, () =>
					// 	weiboUtils.getShowData(retweet.user.id, retweet.bid)
					// );
					const retweetData = await weiboUtils.getShowData(retweet.user.id, retweet.bid);
					if (retweetData !== undefined && retweetData.text) {
						item.mblog.retweeted_status.text = retweetData.text;
					}
				}

				const formatExtended = weiboUtils.formatExtended(ctx, item.mblog, uid);
				let description = formatExtended.description;

				// 视频的处理
				if (displayVideo === '1') {
					// 含被转发微博时需要从被转发微博中获取视频
					if (item.mblog.retweeted_status) {
						description = weiboUtils.formatVideo(description, item.mblog.retweeted_status);
					} else {
						description = weiboUtils.formatVideo(description, item.mblog);
					}
				}

				// 评论的处理
				if (displayComments === '1') {
					description = await weiboUtils.formatComments(ctx, description, item.mblog);
				}

				// 文章的处理
				if (displayArticle === '1') {
					// 含被转发微博时需要从被转发微博中获取文章
					if (item.mblog.retweeted_status) {
						description = await weiboUtils.formatArticle(ctx, description, item.mblog.retweeted_status);
					} else {
						description = await weiboUtils.formatArticle(ctx, description, item.mblog);
					}
				}

				return {
					...formatExtended,
					description,
					isPinned: item.profile_type_id?.startsWith('proweibotop'),
				};
			})
	);

	// remove pinned weibo if they are too old (older than all the rest weibo)
	// the character of pinned weibo is `card.profile_type_id.startsWith('proweibotop')`
	// there can be 1 or 2 (WHAT A FANTASTIC BRAIN THE PM HAS?) pinned weibo at the same time
	const pinnedItems = resultItems.filter((item) => item.isPinned);
	const ordinaryItems = resultItems.filter((item) => !item.isPinned);
	if (
		pinnedItems.length > 0 &&
		ordinaryItems.length > 0 &&
		Math.max(...pinnedItems.map((i) => i.pubDate).filter(Boolean)) < Math.min(...ordinaryItems.map((i) => i.pubDate).filter(Boolean))
	) {
		resultItems = ordinaryItems;
	}

	const finalData = weiboUtils.sinaimgTvax({
		title: `${name}的微博`,
		link: `https://weibo.com/${uid}/`,
		description,
		image: profileImageUrl,
		items: resultItems,
	});
	ctx.header('Content-Type', 'application/xml');
	return ctx.body(renderRss2(finalData));
};

let setup = (route) => {
	route.get('/weibo/user/:uid', deal);
};

export default { setup };
