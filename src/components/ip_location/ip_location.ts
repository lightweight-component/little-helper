import { Hono } from 'hono';

/**
 * Shows IP info.
 */
const EMOJI_FLAG_UNICODE_STARTING_POSITION: number = 127397;

function getFlag(countryCode: string): string {
    const regex = /^[A-Z]{2}$/.test(countryCode);
    if (!countryCode || !regex) return '';

    return String.fromCodePoint(
        ...countryCode.split('').map((char: string) => EMOJI_FLAG_UNICODE_STARTING_POSITION + char.charCodeAt(0))
    );
}

const api = new Hono();

api.get('/', (c) => {
    const ip = c.req.header('x-real-ip');

    return c.json({ 'ip': ip })
});

api.get('/geo', (c) => {
    const ip = c.req.header('x-real-ip');
    // const { pathname } = new URL(c.req.url);
    const request: any = c.req.raw;

    const geo = {
        city: request.cf.city,
        country: request.cf.country,
        flag: getFlag(request.cf.country),
        countryRegion: request.cf.region,
        region: request.cf.colo,
        latitude: request.cf.latitude,
        longitude: request.cf.longitude,
        asOrganization: request.cf.asOrganization
    };

    return c.json({ ip, ...geo });
});

export default api;