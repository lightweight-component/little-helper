import { Hono } from 'hono';

/**
 * Telegra 图床反代
 * Or you can proxy telegra via Nginx: https://nova.moe/build-image-hosting-on-telegraph/
 * 如果访客太多会导致服务器 IP 被 Telegraph rate limit
 * 文件最大大小为 8M 左右，受到 Telegraph 的限制
 * 
 * 开启图片审查 请前往https://moderatecontent.com/ 注册并获得一个免费的用于审查图像内容的 API key
 */
const api: Hono = new Hono();
const HTML: string = `<html>
<head>
        <title>上传图片</title>
        <style>
                html, body, table{width:100%;height:100%;margin: 0;padding: 0;}
                fieldset{width:300px;border-radius: 6px;padding:1%}
        </style>
</head>
<body>
        <table>
                <tr><td valign="middel" align="center">
                        <fieldset>
                                <legend>上传图片</legend>
                                <form action="https://my-app.sp42.workers.dev/api/img_host_telegra" method="POST"  enctype="multipart/form-data">
                                        <input type="file" placeholder="Input your URL" name="file" />
                                        <button>Submit</button>
                                </form>
                                The result: <a class="result"></a>
                        </fieldset>
                </td></tr>
        </table>
</body>
</html>`;

const T_URL: string = 'https://telegra.ph/upload';
const T_FILE_URL: string = 'https://telegra.ph/file';

async function uploadImg(c: any) {
        let { req } = c;
        let form = await req.formData();
        let file = form.get('file');
        console.log(file.name, file.type, file.size);

        let formData: FormData = new FormData();
        formData.append('file', file);

        let uploadResponse: Response = await fetch(T_URL, { method: 'POST', body: formData });
        let uploadResult: any = await uploadResponse.json();

        let url: string = req.url + '/img' + uploadResult[0].src.replace(/file\//, '');
        console.log(url);
        return c.redirect(url, 301);
        // return new Response('Uploaded: https://telegra.ph' + uploadResult[0].src);
}

async function showImg(c: any, imgUrl: string): Promise<any> {
        let imageResponse: Response = await fetch(T_FILE_URL + "/" + imgUrl);

        if (!imageResponse.ok)
                throw new Error(`Image fetch failed with status: ${imageResponse.status}`);

        let imageBlob: Blob = await imageResponse.blob();

        c.header('Content-Type', imageResponse.headers.get('Content-Type'));

        return c.body(imageBlob);
}

api.get('/', c => c.html(HTML));
api.post('/', uploadImg);
api.get('/img/*', c => {
        let { req } = c;
        let arr: string[] = new URL(req.url).pathname.split('/');

        if (!arr || arr.length < 5)
                throw new Error('The image filename is required.');

        return showImg(c, arr[4]);
});

export default api;