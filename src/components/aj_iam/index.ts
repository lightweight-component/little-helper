/**
 * AJ-IAM
 */
import { Hono } from 'hono';
import { randomString } from '../../common/str';
import { HTTPException } from 'hono/http-exception';

type Bindings = {
    AJ_IAM_CLIENT_ID: string
}

const app = new Hono<{ Bindings: Bindings }>();

const CLIENT_ID: string = 'lKi9p9FyicBd6eb'; // 客户端 id
const SERVICE_URL: string = 'http://127.0.0.1:8787/user'; // 本地服务的接口地址
const LOGIN_PAGE: string = 'http://localhost:8888/iam/login';// 登录页面地址

// 跳转到登录页面
app.get('/login', c => {
    let url: string = `${LOGIN_PAGE}?response_type=code&client_id=${CLIENT_ID}&redirect_uri=${encodeURIComponent(SERVICE_URL + "/callback")}&state=${randomString(6)}`;
    const webUrl: string | undefined = c.req.query('web_url');

    if (webUrl)
        url += "&web_url=" + encodeURIComponent(webUrl);

    return c.redirect(url);
});

const CLIENT_SECRET: string = 'zLkv9ngl8mnF5KkKtKEbtCeEC4' // 客户端密钥
const TOKEN_API: string = 'http://127.0.0.1:8888/iam/oidc/token';// 获取 Token 的接口

function basicAuth(): string {
    const credentialsString: string = CLIENT_ID + ":" + CLIENT_SECRET;
    return btoa(credentialsString);
}

// 得到授权码 code 后，获取 token
app.get('/callback', async c => {
    const state: string | undefined = c.req.query('state');
    const code: string | undefined = c.req.query('code');
    const webUrl: string | undefined = c.req.query('web_url');

    if (!code)
        throw new HTTPException(401, { message: 'The param "code" is required.' });

    if (!webUrl)
        throw new HTTPException(401, { message: 'The param "web_url" is required.' });

    let form: string = `grant_type=authorization_code&code=${code}`;

    if (state)
        form += "&state=" + state;

    const response: Response = await fetch(TOKEN_API, {
        method: 'POST',
        headers: {
            'Authorization': 'Basic ' + basicAuth(),
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: form
    });

    if (response.ok) {
        const json: any = await response.json();
        console.log(json);
        return c.redirect(webUrl + '?token=' + json.id_token);
    } else {
        try {
            const json: any = await response.json();
            console.log(json);
            throw new HTTPException(500, { message: json.message });
        } catch (e) {
            throw new Error(e.toString());
        }
    }

});

export default app;