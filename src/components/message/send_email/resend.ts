/**
 * Send Email by Resend
 */
import { Hono } from 'hono';
import { SendEmail } from "../send_email/type";

const RESEND_EMAIL_API: string = 'https://api.resend.com/emails';

async function sendEmail(mail: SendEmail, accessToken: string): Promise<void> {
    const json = {
        "from": mail.senderName ? `${mail.senderName} <${mail.senderEmail}>` : mail.senderEmail,
        "to": [mail.to],
        "subject": mail.subject,
        "text": mail.body,
        // "headers": {
        //     "X-Entity-Ref-ID": "123"
        // }
    };

    const response: Response = await fetch(RESEND_EMAIL_API, {
        method: 'POST',
        headers: {
            Authorization: 'Bearer ' + accessToken,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(json),
    });

    // console.log(response);
    if (!response.ok)
        throw new Error(response.statusText);
}

type Bindings = {
    RESEND_ACCESS_TOKEN: string
}

const app = new Hono<{ Bindings: Bindings }>();

app.post('/', async c => {
    const { req } = c;
    const data: any = await req.json();

    await sendEmail({
        senderName: data.senderName,
        senderEmail: data.senderEmail,
        to: data.to,
        subject: data.subject,
        body: data.body
    }, c.env.RESEND_ACCESS_TOKEN);

    return c.json({ ok: true });
});

export default app;