import { Hono } from 'hono';

/**
 * 获取微信 AccessToken
 */

type Bindings = {
    APP_ID: string
    APP_SECRET: string
}

const app = new Hono<{ Bindings: Bindings }>();

// 微信小程序的 AppID 和 AppSecret
const appId: string = 'wx9b32cc6efd1f45b8';

// 用于获取 access token 的API URL
const TOKEN_API: string = `https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=${appId}&secret=${appSecret}`;

type TOKEN_JSON = {
    access_token: string
    expires_in: number
    // 当API调用成功时，部分接口不会返回 errcode 和 errmsg，只有调用失败时才会返回
    errcode?: string
    errmsg?: string
}

// 异步函数获取 access token
async function getAccessToken(): Promise<void> {
    try {
        // 发送请求获取 access token
        const response: Response = await fetch(TOKEN_API, { method: 'GET' });
        const result: TOKEN_JSON = await response.json();

        // 检查是否有错误码
        if (result.errcode) {
            console.error('获取access token失败：', result.errmsg);
        } else {
            console.log('access token:', result.access_token);
            console.log('过期时间：', new Date(Date.now() + (result.expires_in - 100) * 1000).toISOString());
        }
    } catch (error) {
        console.error('请求access token时发生错误：', error);
    }
}
let i = 0;


app.get('/', async c => {
    let s = setInterval(function () {
        console.log('bb');

    }, 100);
    i++;
    return c.json({
        token: s
    });
});
export default app;