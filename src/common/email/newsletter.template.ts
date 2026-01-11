export const NewsletterEmailTemplate = (data: {
  subject: string;
  message: string;
}) => {
  return `
  <div style="font-family: Arial, sans-serif; background:#f6f9fc; padding:25px;">
    <div style="max-width:600px; margin:auto; background:#fff; border-radius:10px;
                padding:30px; border:1px solid #e5e7eb;">
      
      <div style="text-align:center; margin-bottom:25px;">
        <h1 style="color:#2563eb; margin:0; font-size:28px;">
          ${data.subject}
        </h1>
      </div>

      <div style="font-size:15px; color:#475569; line-height:1.6;">
        ${data.message}
      </div>

      <hr style="margin:30px 0; border:none; border-top:1px solid #e2e8f0;" />

      <div style="text-align:center; padding:20px 0;">
        <p style="font-size:14px; color:#64748b; margin:5px 0;">
          Thank you for being a valued subscriber!
        </p>
      </div>

      <hr style="margin:20px 0; border:none; border-top:1px solid #e2e8f0;" />

      <p style="font-size:12px; text-align:center; color:#94a3b8;">
        This email was sent to you because you subscribed to our newsletter.
      </p>
      
      <p style="font-size:11px; text-align:center; color:#cbd5e1;">
        © ${new Date().getFullYear()} All rights reserved.
      </p>

    </div>
  </div>
  `;
};
