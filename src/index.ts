import { Hono } from 'hono';
import { cors } from 'hono/cors';
import ipLocation from './components/ip_location/ip_location';
import qrCode from './components/qr_code/qr_code';
import imgHostTelegra from './components/img_host_telegra/img_host';
import idCard from './components/IdCardService/api';
import shortUrl from './components/short_url/short_url';
import { getAssetFromKV } from '@cloudflare/kv-asset-handler';
import { Layout } from './pages/homepage';
import Resend from './components/message/send_email/resend';
import AJ_IAM from './components/aj_iam';
import getAccessToken from './components/wechat/get_access_token';

type Bindings = {
  LINKS: KVNamespace
  MY_VAR: string
}

const app = new Hono<{ Bindings: Bindings }>();
app.use('*', cors());// allows to cross domain
app.get('/', async (c) => {
  let s: string | null = await c.env.LINKS.get('kjkjk');
  console.log(s);
  console.log(c.env.MY_VAR);

  return c.html(Layout({ body: 'hi' }));
});

app.route('/api/ip_location', ipLocation);
app.route('/api/qr_code', qrCode);
app.route('/api/img_host_telegra', imgHostTelegra);
app.route('/api/chinese_id_card', idCard);
app.route('/api/s', shortUrl);
app.route('/api/email/resend', Resend);
app.route('/user', AJ_IAM);
app.route('/api/wechat/get_access_token', getAccessToken);

app.onError((err, c) => {
  console.error(`${err}`);

  return c.json({ msg: err.toString() });
});

app.notFound(c => c.text('Not found', 404));

export default app;
