import { Hono } from 'hono';
import { imageSync } from 'qr-image';

/**
 * A QR code generator
 * https://developers.cloudflare.com/workers/tutorials/build-a-qr-code-generator/
 * Based on QR-Image https://github.com/alexeyten/qr-image
 */
const app: Hono = new Hono();

app.get('/', (c) => {
    const { req } = c;

    let option: any = {};
    let type = req.query('type'), size = req.query('size');

    if (type)
        option.type = type;

    if (size)
        option.size = parseInt(size);

    let qrImg = imageSync(req.query('v') || "https://qq.com", option);

    c.header('Content-Type', 'image/png');

    return c.body(qrImg);
});

export default app;