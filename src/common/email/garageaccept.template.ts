export const GarageAcceptEmailTemplate = (data: {
  name?: string;
  garageName?: string;
}) => {
  const username = data.name || 'Garage Owner';

  return `
  <div style="font-family: Arial, sans-serif; background:#f6f9fc; padding:25px;">
    <div style="max-width:600px; margin:auto; background:#fff; border-radius:10px;
                padding:30px; border:1px solid #e5e7eb;">
      
      <h2 style="color:#16a34a; text-align:center; margin-bottom:20px;">
        Garage Account Approved 🎉
      </h2>

      <p style="font-size:15px; color:#475569;">
        Hi <strong>${username}</strong>,
      </p>

      <p style="font-size:15px; color:#475569;">
        Great news! Your garage <strong>${data.garageName || ''}</strong> has been approved.
      </p>

      <p style="font-size:15px; color:#475569;">
        You now have full access to your dashboard. Your <strong>2-month free trial</strong> starts today.
      </p>

      <div style="margin:25px 0; padding:18px; background:#f0fdf4; 
                  border-radius:8px; border-left:5px solid #16a34a;">
        <strong>Trial Period:</strong><br />
        2 Months Free Access<br />
        Full Garage Owner Features Enabled
      </div>

      <p style="font-size:14px; color:#475569; text-align:center;">
        Thank you for joining our platform!
      </p>

      <hr style="margin:25px 0; border:none; border-top:1px solid #e2e8f0;" />

      <p style="font-size:12px; text-align:center; color:#94a3b8;">
        This is an automated email. Please do not reply.
      </p>
    </div>
  </div>
  `;
};
