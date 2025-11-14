export const OtpEmailTemplate = (data: {
  name?: string;
  otp: number | string;
  purpose: string; 
}) => {
  const username = data.name || 'User';

  return `
  <div style="font-family: Arial, sans-serif; background:#f6f9fc; padding:25px;">
    <div style="max-width:600px; margin:auto; background:#fff; border-radius:10px;
                padding:30px; border:1px solid #e5e7eb;">
      
      <h2 style="color:#2563eb; text-align:center; margin-bottom:20px;">
        ${data.purpose}
      </h2>

      <p style="font-size:15px; color:#475569;">
        Hi <strong>${username}</strong>,
      </p>

      <p style="font-size:15px; color:#475569;">
        Use the OTP below to continue:
      </p>

      <div style="text-align:center; margin:30px 0;">
        <span style="
          display:inline-block; 
          padding:12px 25px; 
          background:#2563eb; 
          color:#fff; 
          font-size:28px; 
          letter-spacing:5px; 
          border-radius:8px;
        ">
          ${data.otp}
        </span>
      </div>

      <p style="font-size:14px; color:#475569; text-align:center;">
        This OTP is valid for <strong>10 minutes</strong>.
      </p>

      <hr style="margin:25px 0; border:none; border-top:1px solid #e2e8f0;" />

      <p style="font-size:12px; text-align:center; color:#94a3b8;">
        This is an automated email. Please do not reply.
      </p>

    </div>
  </div>
  `;
};
