/**
 * Send Email Model
 */
export type SendEmail = {
    /**
     * The name of sender.
     */
    senderName?: string;

    /**
     * The sender's email. The domain must be verified in Resend.
     */
    senderEmail: string;

    /**
     * The reciver's email
     */
    to: string;

    /**
     * The subject of the mail
     */
    subject: string;

    /**
     * The body of the mail
     */
    body: string;
};