import { renderRss2 } from '../../../utils/util';
import { GetDynSpace } from '../grpc_helper';

let getPubDate = (ptimeLabelText) => {
	let pubDate = new Date().toUTCString();
	try {
		if (ptimeLabelText.indexOf('小时前') !== -1) {
			let hour = ptimeLabelText.split('小时前')[0];
			pubDate = new Date(new Date().getTime() - hour * 60 * 60 * 1000).toUTCString();
		} else if (ptimeLabelText.indexOf('分钟前') !== -1) {
			let minute = ptimeLabelText.split('分钟前')[0];
			pubDate = new Date(new Date().getTime() - minute * 60 * 1000).toUTCString();
		} else if (ptimeLabelText.indexOf('刚刚') !== -1) {
			pubDate = new Date().toUTCString();
		} else if (ptimeLabelText.indexOf('昨天') !== -1) {
			let hour = ptimeLabelText.split('昨天')[1].split(':')[0];
			let minute = ptimeLabelText.split('昨天')[1].split(':')[1];
			let yesterday = new Date(new Date().getTime() - 24 * 60 * 60 * 1000);
			pubDate = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate(), hour, minute).toUTCString();
		} else if (ptimeLabelText.indexOf('天前') !== -1) {
			let day = ptimeLabelText.split('天前')[0];
			pubDate = new Date(new Date().getTime() - day * 24 * 60 * 60 * 1000).toUTCString();
		} else if (ptimeLabelText.indexOf('年') !== -1) {
			let year = ptimeLabelText.split('年')[0];
			let month = ptimeLabelText.split('年')[1].split('月')[0];
			let day = ptimeLabelText.split('年')[1].split('月')[1].split('日')[0];
			pubDate = new Date(year, month - 1, day).toUTCString();
		} else {
			let year = new Date().getFullYear();
			let month = ptimeLabelText.split('月')[0];
			let day = ptimeLabelText.split('月')[1].split('日')[0];
			pubDate = new Date(year, month - 1, day).toUTCString();
		}
	} catch (e) {}
	return pubDate;
};

let deal = async (ctx) => {
	const { uid } = ctx.req.param();
	let dynSpaceResJson = await GetDynSpace(uid);
	let dynSpaceRes = JSON.parse(dynSpaceResJson);
	let items = [];
	let globalUsername = '';
	if (dynSpaceRes.list.length !== 0) {
		globalUsername = dynSpaceRes.list[0].extend.origName;
	} else {
		globalUsername = uid;
	}
	for (let card of dynSpaceRes.list) {
		if (card.cardType !== 'av') {
			continue;
		}
		// 直接从卡片中提取视频信息
		let title = '';
		for (let desc of card.extend.origDesc) {
			title += desc.text;
		}
		
		// 从 modules 中获取 bvid
		let bvid = '';
		for (let _module of card.modules) {
			if (_module.moduleType === 'module_dynamic' && _module.moduleDynamic?.dynArchive) {
				bvid = _module.moduleDynamic.dynArchive.bvid || '';
				break;
			}
		}
		
		// 直接链接到视频页面，而不是动态页面
		let link = bvid ? `https://www.bilibili.com/video/${bvid}` : `https://t.bilibili.com/${card.extend.dynIdStr}`;
		
		let description = title + '<br/>';
		if (card.extend.origImgUrl) {
			description += `<img src="${card.extend.origImgUrl}"/>`;
		}
		
		let pubDate = new Date().toUTCString();
		let author = '';
		for (let _module of card.modules) {
			if (_module.moduleType === 'module_author') {
				let ptimeLabelText = _module.moduleAuthor?.ptimeLabelText;
				pubDate = getPubDate(ptimeLabelText);
				author = _module.moduleAuthor?.author?.name;
			} else if (_module.moduleType === 'module_desc') {
				description += `<br/>${_module.moduleDesc?.text}`;
			}
		}
		
		let item = {
			title: title,
			link: link,
			description: description,
			pubDate: pubDate,
			guid: link,
			author: author,
			category: 'av',
		};
		items.push(item);
	}

	let data = {
		title: `${globalUsername} 的 bilibili 视频`,
		link: `https://space.bilibili.com/${uid}/video`,
		description: `${globalUsername} 的 bilibili 视频`,
		language: 'zh-cn',
		// category: 'bilibili',
		items: items,
	};
	let rss = renderRss2(data);
	ctx.header('Content-Type', 'application/xml');
	return ctx.body(`${rss}`);
};

let setup = (route) => {
	route.get('/bilibili/user/video/:uid', deal);
};

export default { setup };
