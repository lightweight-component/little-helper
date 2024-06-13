// 反代目标网站.
const UPSTREAM: string = 'www.ajaxjs.com';
// 反代目标网站的移动版.
const UPSTREAM_MOBILE: string = 'www.dalao.pro';
// 访问区域黑名单（按需设置）.
const BLOCKED_REGION: string[] = ['TK'];
// IP地址黑名单（按需设置）.
const BLOCKED_IP_ADDRESS: string[] = ['0.0.0.0', '127.0.0.1'];
// 路径替换.
const REPLACE_DICT: { [key: string]: string } = {
    '$upstream': '$custom_domain',
    '//archiveofourown.org': ''
};

addEventListener('fetch', event => event.respondWith(fetchAndApply(event.request)));

async function fetchAndApply(request: Request): Promise<Response> {
    const region: string = request.headers.get('cf-ipcountry')?.toUpperCase() ?? '';
    const ipAddress: string = request.headers.get('cf-connecting-ip') ?? '';
    const userAgent: string = request.headers.get('user-agent') ?? '';

    let response: Response;
    let url: URL = new URL(request.url);
    let urlHost: string = url.host;

    if (url.protocol === 'http:') {
        url.protocol = 'https:';
        response = Response.redirect(url.href);

        return response;
    }

    let upstreamDomain: string = deviceStatus(userAgent) ? UPSTREAM : UPSTREAM_MOBILE;
    url.host = upstreamDomain;

    if (BLOCKED_REGION.includes(region))
        response = new Response('Access denied: WorkersProxy is not available in your region yet.', { status: 403 });
    else if (BLOCKED_IP_ADDRESS.includes(ipAddress))
        response = new Response('Access denied: Your IP address is blocked by WorkersProxy.', { status: 403 });
    else {
        let newRequestHeaders: Headers = new Headers(request.headers);
        newRequestHeaders.set('Host', upstreamDomain);
        newRequestHeaders.set('Referer', url.href);

        let originalResponse: Response = await fetch(url.href, { method: request.method, headers: newRequestHeaders });
        let originalResponseClone: Response = originalResponse.clone();
        let originalText: string;
        let responseHeaders: Headers = originalResponse.headers;
        let newResponseHeaders: Headers = new Headers(responseHeaders);

        newResponseHeaders.set('cache-control', 'public, max-age=14400');
        newResponseHeaders.set('access-control-allow-origin', '*');
        newResponseHeaders.set('access-control-allow-credentials', 'true');
        newResponseHeaders.delete('content-security-policy');
        newResponseHeaders.delete('content-security-policy-report-only');
        newResponseHeaders.delete('clear-site-data');

        const contentType: string | null = responseHeaders.get('content-type');

        if (contentType && contentType.includes('text/html') && contentType.includes('UTF-8'))
            originalText = replaceResponseText(await originalResponseClone.text(), upstreamDomain, urlHost);
        else
            originalText = await originalResponseClone.text();

        response = new Response(originalText, { status: originalResponse.status, headers: newResponseHeaders });
    }

    return response;
}

function replaceResponseText(text: string, upstreamDomain: string, hostName: string): string {
    let i: string, j: string;

    for (i in REPLACE_DICT) {
        j = REPLACE_DICT[i];

        if (i === '$upstream')
            i = upstreamDomain;
        else if (i === '$custom_domain')
            i = hostName;

        if (j === '$upstream')
            j = upstreamDomain;
        else if (j === '$custom_domain')
            j = hostName;

        text = text.replace(new RegExp(i, 'g'), j);
    }

    return text;
}

function deviceStatus(userAgentInfo: string): boolean {
    const agents: string[] = ["Android", "iPhone", "SymbianOS", "Windows Phone", "iPad", "iPod"];
    let flag: boolean = true;

    for (let v: number = 0; v < agents.length; v++) {
        if (userAgentInfo.indexOf(agents[v]) > -1) {
            flag = false;
            break;
        }
    }

    return flag;
}