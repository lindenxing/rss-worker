import { Hono } from 'hono';
import { basicAuth } from 'hono/basic-auth';
import { cors } from 'hono/cors';
import indexHtml from './html/index.html';
import notFoundHtml from './html/404.html';
import errorHtml from './html/err.html';
import robotsTxt from './robots.txt';

import route from './route';

const app = new Hono();

app.route('/rss', route);
app.get('/', (ctx) => {
	return ctx.html(indexHtml);
});
app.get('robots.txt', (ctx) => {
	return ctx.text(robotsTxt);
});
app.get('/debug', (ctx) => {
	return ctx.json(ctx.req.raw?.cf);
});
app.notFound((ctx) => {
	return ctx.html(notFoundHtml);
});
app.onError((err, c) => {
	// 检查请求路径是否是 RSS 路由
	const path = c.req.path;
	if (path.startsWith('/rss/')) {
		// 对于 RSS 请求，返回 XML 格式的错误
		const errorMessage = err.message || 'Unknown error';
		return c.body(`<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>RSS Error</title>
    <link>${c.req.url}</link>
    <description>Error: ${errorMessage}</description>
    <language>zh-cn</language>
  </channel>
</rss>`, 200, {
			'Content-Type': 'application/xml; charset=utf-8',
		});
	}
	
	// 对于其他请求，返回 HTML 格式的错误
	let stack_str = err.stack;
	let stack_arr = stack_str.split('\n').join('<br>');
	let result = errorHtml.replace('{ERROR_MESSAGE}', `${err}`);
	result = result.replace('{ERROR_STACK}', `${stack_arr}`);
	return c.html(result, 500);
});
// app.use(
// 	'/*',
// 	basicAuth({
// 		username: 'user',
// 		password: 'password',
// 	})
// );
app.use('/*', cors());

export default app;
