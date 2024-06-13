/**
 * Web analytics
 * https://github.com/yestool/analytics_with_cloudflare
 * another: https://github.com/benvinegar/counterscale https://counterscale.dev/
 */
import { Hono } from 'hono';
import { checkUrl, getUrlData, insertAndReturnId, insert } from './utils';

type Bindings = {
    DB: D1Database
};

const app = new Hono<{ Bindings: Bindings }>();

app.post('/api/visit', async (c) => {
    const retObj = { ret: "ERROR", data: null, message: "Error, Internal Server Error" };

    try {
        let visitorIP = c.req.header('CF-Connecting-IP');
        const body = await c.req.json();
        const hostname: string = body.hostname;
        const url_path: string = body.url;
        const referrer: string = body.referrer;
        const pv = body.pv;
        const uv = body.uv;
        let referrerPath: string = '', referrerDomain: string = '';

        if (referrer && checkUrl(referrer)) {
            const referrerData = getUrlData(referrer);
            referrerDomain = referrerData.hostname;
            referrerPath = referrerData.pathname;
        }

        const website = await c.env.DB.prepare('SELECT id, domain FROM t_website WHERE domain = ?').bind(hostname).first();
        let websiteId: number;

        if (website) {
            await insert(c.env.DB,
                'INSERT INTO t_web_visitor (website_id, url_path, referrer_domain, referrer_path, visitor_ip) VALUES (?, ?, ?, ?, ?)',
                [website.id, url_path, referrerDomain, referrerPath, visitorIP]);
            websiteId = Number(website.id);
        } else {
            websiteId = await insertAndReturnId(c.env.DB, 'INSERT INTO t_website (name, domain) VALUES (?,?)', [hostname.split(".").join("_"), hostname]);
            await insert(c.env.DB,
                'INSERT INTO t_web_visitor (website_id, url_path, referrer_domain, referrer_path, visitor_ip) VALUES (?, ?, ?, ?, ?)',
                [websiteId, url_path, referrerDomain, referrerPath, visitorIP]);
        }

        const resData: { pv?: number, uv?: number } = {};

        if (pv) {
            const total = await c.env.DB.prepare('SELECT COUNT(*) AS total from t_web_visitor where website_id = ? and url_path = ?').bind(websiteId, url_path).first('total');
            resData['pv'] = Number(total);
        }

        if (uv) {
            const total = await c.env.DB.prepare('SELECT COUNT(*) AS total from (select DISTINCT visitor_ip from t_web_visitor where website_id = ? and url_path = ?) t').bind(websiteId, url_path).first('total');
            resData['uv'] = Number(total);
        }

        return c.json({ ret: "OK", data: resData });
    } catch (e) {
        console.error(e);
        return c.json(retObj);
    }
});

export default app;