import { Hono } from 'hono';
import IdCardService from './IdCardService';

/**
 * Chinese Mainland ID card check & detect
 */
const api: Hono = new Hono();

api.get('/:cardNo', c => {
    const cardNo: string = c.req.param('cardNo');

    return c.json({ isVaild: IdCardService.check(cardNo) });
});

api.get('/info/:cardNo', c => {
    const cardNo: string = c.req.param('cardNo');
    const i: IdCardService = new IdCardService(cardNo);
    i.extractor();
    const { province, city, region, year, month, day, gender, birthday } = i;

    return c.json({ province, city, region, year, month, day, gender, birthday });
});

export default api;