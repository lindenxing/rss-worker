import { renderRss2 } from '../../utils/util';
import { substr } from 'runes2';

let deal = async (ctx) => {
	const { username } = ctx.req.param();
	let res;
	try {
		res = await fetch(`https://t.me/s/${username}`);
	} catch (error) {
		return ctx.body(`<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>Telegram 频道 - 错误</title>
    <link>https://t.me/s/${username}</link>
    <description>无法获取 Telegram 频道 ${username} 的数据。错误: ${error.message}</description>
    <language>zh-cn</language>
  </channel>
</rss>`, 200, {
			'Content-Type': 'application/xml; charset=utf-8',
		});
	}
	
	let title = '';
	let link = `https://t.me/s/${username}`;
	let description = '';
	let language = 'zh-cn';
	let tgme_widget_message_texts = [];
	let tgme_widget_message_dates = [];
	let src_links = [];
	let last_tag = '';
	let new_res = new HTMLRewriter()
		.on('head > title', {
			text(text) {
				title += text.text;
			},
		})
		.on('head > meta[property="og:description"]', {
			element(element) {
				description += element.getAttribute('content');
			},
		})
		.on('.tgme_widget_message_bubble', {
			element(element) {
				tgme_widget_message_texts.push('');
			},
		})
		.on('.tgme_widget_message_bubble > .tgme_widget_message_text', {
			text(text) {
				// 将文本中的 URL 转换为 HTML 链接
				let content = text.text;
				// 匹配 http:// 或 https:// 开头的 URL
				content = content.replace(/(https?:\/\/[^\s<]+)/g, '<a href="$1">$1</a>');
				tgme_widget_message_texts[tgme_widget_message_texts.length - 1] += content;
			},
		})
		.on('.tgme_widget_message_bubble .tgme_widget_message_photo_wrap', {
			element(element) {
				let style = element.getAttribute('style');
				let url = style.match(/background-image:url\('(.+)'\)/)[1];
				tgme_widget_message_texts[tgme_widget_message_texts.length - 1] += '<img src="' + url + '" />';
				tgme_widget_message_texts[tgme_widget_message_texts.length - 1] += '<br>';
			},
		})
		.on('.tgme_widget_message_bubble > .tgme_widget_message_text > b', {
			element(element) {
				// add <b> tag
				tgme_widget_message_texts[tgme_widget_message_texts.length - 1] += '<b>';
			},
			text(text) {
				if (text.lastInTextNode) {
					tgme_widget_message_texts[tgme_widget_message_texts.length - 1] += '</b>';
				}
			},
		})
		.on('.tgme_widget_message_bubble > .tgme_widget_message_text > a', {
			element(element) {
				const href = element.getAttribute('href');
				if (href) {
					tgme_widget_message_texts[tgme_widget_message_texts.length - 1] += `<a href="${href}">`;
				}
			},
			text(text) {
				if (text.lastInTextNode) {
					tgme_widget_message_texts[tgme_widget_message_texts.length - 1] += '</a>';
				}
			},
		})
		.on('.tgme_widget_message_bubble > .tgme_widget_message_text > br', {
			element(element) {
				// add <br> tag
				tgme_widget_message_texts[tgme_widget_message_texts.length - 1] += '<br>';
			},
		})
		.on('.tgme_widget_message_date > time', {
			element(element) {
				tgme_widget_message_dates.push(element.getAttribute('datetime'));
			},
		})
		.on('.tgme_widget_message_wrap > .tgme_widget_message', {
			element(element) {
				let data_post = element.getAttribute('data-post');
				src_links.push(`https://t.me/${username}/${data_post}`);
			},
		})
		.transform(res);
	await new_res.text();
	let items = [];
	src_links = src_links.reverse();
	tgme_widget_message_dates = tgme_widget_message_dates.reverse();
	for (let i = 0; i < tgme_widget_message_texts.length; i++) {
		if (tgme_widget_message_texts[i] === '') {
			continue;
		}
		let title = tgme_widget_message_texts[i].replace(/<br>/g, ' ');
		title = title.replace(/<b>|<\/b>|<img.*>/g, '');
		if (title.length > 100) {
			title = substr(title, 0, 100) + '...';
		} else if (title.trim().length === 0) {
			title = '无标题';
		}
		let item = {
			title: title,
			link: src_links.pop(),
			description: tgme_widget_message_texts[i],
			pubDate: tgme_widget_message_dates.pop(),
		};
		items.push(item);
	}
	items = items.reverse();
	
	// 去重：基于link字段
	let seenLinks = new Set();
	let uniqueItems = [];
	for (let item of items) {
		if (item.link && !seenLinks.has(item.link)) {
			seenLinks.add(item.link);
			uniqueItems.push(item);
		}
	}
	
	let data = {
		title: title,
		link: link,
		description: description,
		language: language,
		items: uniqueItems,
	};
	return ctx.body(renderRss2(data), 200, {
		'Content-Type': 'application/xml; charset=utf-8',
	});
};

let setup = (route) => {
	route.get('/telegram/channel/:username', deal);
};

export default { setup };
