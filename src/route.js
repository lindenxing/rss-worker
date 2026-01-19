import { Hono } from 'hono';
import bilibili_user_video from './lib/bilibili/user/video';
import bilibili_user_watchlater from './lib/bilibili/user/watchlater';
import telegram_channel from './lib/telegram/channel';
import weibo_user from './lib/weibo/user';
import xiaohongshu_user from './lib/xiaohongshu/user';

const route = new Hono();

let plugins = [bilibili_user_video, bilibili_user_watchlater, telegram_channel, weibo_user, xiaohongshu_user];

for (let plugin of plugins) {
	plugin.setup(route);
}

export default route;
