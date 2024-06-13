import { randomString, md5 } from '../../common/str';
import { BaseConfig, loadConfig } from '../../common/config';
import { Hono } from 'hono';
import html from './input_form';

/**
 * Short URL
 */
type Bindings = {
    SHORT_URL_KV: KVNamespace
};

type Config = BaseConfig & {
    /**
     * 默认短链 key 的长度，遇到重复时会自动延长
     */
    DEFAULT_LEN: number;

    /**
     * 短链超时，单位毫秒，支持整数乘法，0表示不设置超时
     */
    SHORTEN_TIMEOUT: number | ((s: string) => number);

    /**
     * 为 true 开启演示，否则无密码且非白名单请求不受理，是则允许访客试用，超时后失效
     */
    DEMO_MODE: boolean;

    /**
     * 密码，密码正确情况无视白名单和超时设置，且支持自定义短链接
     */
    PASSWORD: string;

    /**
     * 为true自动删除超时的演示短链接记录，否则仅是标记过期，以便在后台查询历史记录
     */
    REMOVE_COMPLETELY: boolean;

    /**
     * 白名单中的域名无视超时，json数组格式，写顶级域名就可以，自动通过顶级域名和所有二级域名
     */
    WHITE_LIST: ((s: string) => string[]) | string[];
}

const app: Hono<{ Bindings: Bindings }> = new Hono<{ Bindings: Bindings }>();
const SHORT_URL_PERFIX: string = 'SHORT_URL';
const CHECK_URL: RegExp = /^http(s)?:\/\/(.*@)?([\w-]+\.)*[\w-]+([_\-.,~!*:#()\w\/?%&=]*)?$/;
const CONFIG: Config = {
    isLoaded: false,
    DEFAULT_LEN: 6,
    SHORTEN_TIMEOUT: (s: string) => s ? s.split("*").reduce((a, b) => a * parseInt(b), 1) : 0,
    DEMO_MODE: true,
    PASSWORD: 'yahoo',
    REMOVE_COMPLETELY: true,
    WHITE_LIST: (s: string) => s ? JSON.parse(s) : [""]
};

/**
 * 检查域名是否在白名单中，参数只包含域名部分
 * 
 * @param url 
 * @returns 
 */
function checkWhite(url: string): boolean {
    let host: string = new URL(url).host;

    return (<string[]>CONFIG.WHITE_LIST).some((h: string) => host == h || host.endsWith('.' + h));
}

async function checkHash(url: string, hash: string): Promise<boolean> {
    if (!hash)
        return false;

    return (await md5(url + CONFIG.PASSWORD)) == hash;
}

/**
 * 保存短链

 * @param {string} url 需要保存的原始 URL。
 * @param {string} key 用户指定的短链 key，如果为空则自动生成。
 * @param {boolean} admin 表示是否是管理员操作。管理员有权限覆盖已存在的链接。
 * @param {number} len 生成的随机字符串长度。如果未指定，则使用默认长度。
 * @returns {Promise<string>} 成功保存后返回短链的 key。
 */
async function saveUrl(env: any, url: string, key: string, admin: boolean, len: number | null): Promise<string> {
    loadConfig(SHORT_URL_PERFIX, CONFIG, env);

    const kv: KVNamespace = env.SHORT_URL_KV;
    console.log('>>>>>>>>>>' + url)
    len = len || CONFIG.DEFAULT_LEN;// 如果未指定长度，则使用默认长度
    let override: boolean = admin && !!key;// 判断是否需要覆盖旧链接,密码正确且指定了 key 的情况直接覆盖旧值

    if (!override) // 如果不是管理员或没有提供key，则生成新的随机 key
        key = randomString(len); // 密码不正确情况无视指定 key

    let isExists: string | null = await loadUrl(env, key); // 检查当前key是否已存在
    console.log("key exists " + key + " " + isExists);

    if (override || !isExists) {  // 如果可以覆盖或key不存在，则保存新链接
        let mode: number = 3;

        if (admin)// 如果是管理员，则设置模式为0
            mode = 0;

        let value: string = `${mode};${Date.now()};${url}`; // 组合链接信息，准备保存

        if (CONFIG.REMOVE_COMPLETELY && mode != 0 && !checkWhite(url)) { // 检查是否需要设置链接过期时间
            let ttl: number = Math.max(60, (CONFIG.SHORTEN_TIMEOUT as number) / 1000); // 计算过期时间，利用expirationTtl实现过期记录自动删除，低于60秒会报错
            console.log("key auto remove: " + key + ", " + ttl + "s");

            // 保存链接并返回key
            return await kv.put(key, value, { expirationTtl: ttl }), key;
        } else
            return await kv.put(key, value), key;
    } else
        return await saveUrl(env, url, key, admin, len + 1); // 如果 key 已存在，尝试增加长度后重新生成 key 并保存
}

/**
 * 加载短链
 
 * @param {string} key - 短链的键值。
 * @returns {Promise<string|null>} 如果找到有效的短链地址，则返回该地址；如果未找到或短链已超时，则返回 null。
 */
async function loadUrl(env: any, key: string): Promise<string | null> {
    loadConfig(SHORT_URL_PERFIX, CONFIG, env);

    const kv: KVNamespace = env.SHORT_URL_KV;
    let value = await kv.get(key); // 通过键值获取短链对应的长链地址
    console.log(" ::" + CONFIG.WHITE_LIST);

    if (!value)  // 如果没有找到对应的长链地址，则返回 null
        return null;

    let list: string[] = value.split(';'), url: string; // 分割长链地址字符串为数组，根据分号分割


    // 如果数组只有一个元素，直接使用该元素作为url；否则，解析模式、创建时间和实际url
    if (list.length == 1)
        url = list[0]; // 老数据暂且正常跳转
    else {
        url = list[2];
        const mode: number = parseInt(list[0]);
        const createTime: number = parseInt(list[1]);

        // 检查短链是否超时，若超时且不在白名单内，则返回 null
        if (mode != 0 && (CONFIG.SHORTEN_TIMEOUT as number) > 0 && Date.now() - createTime > (CONFIG.SHORTEN_TIMEOUT as number)) {
            if (checkWhite(url))
                console.log('white list');
            else {
                console.log("shorten timeout"); // 超时和找不到做同样的处理
                return null;
            }
        }
    }

    return url;
}

app.get('/', c => c.html(html));
app.get('/:key', async c => {
    let key: string = c.req.param('key');
    let url = await loadUrl(c.env, key); // 加载短链对应的完整 URL

    if (!url) // 如果找不到短链或者短链已超时，返回404页面
        return c.notFound();

    return c.redirect(url, 302);  // 重定向到加载的完整 URL
});
app.post('/', async c => {
    let req: any = await c.req.json();
    let url: string = req['url'];
    let admin: boolean = await checkHash(url, req["hash"]); // 检查哈希值

    console.log("url: " + url); // 打印请求的URL和是否为管理员

    if (!CHECK_URL.test(url) || (!admin && !CONFIG.DEMO_MODE && !checkWhite(url))) // 非演示模式下，非白名单地址当成地址不合法处理
        throw new Error('This is a Illegal URL.');

    let randomKey: string = await saveUrl(c.env, url, req["key"], admin, null);// 保存 URL 并返回随机键

    return c.json({ key: randomKey });
});

export default app;