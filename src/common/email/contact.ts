export const ContactEmailTemplate = {
  contactAdmin: (payload: any) => `
  <div style="font-family: Arial, sans-serif; padding: 20px; background: #f6f9fc;">
    <div style="max-width: 600px; margin: auto; background: white; border-radius: 8px; padding: 25px; 
      border: 1px solid #e5e7eb;">

      <h2 style="color: #0f172a; text-align: center;">📩 New Contact Form Submission</h2>
      <p style="color: #475569;">A new contact message has been submitted.</p>

      <table style="width: 100%; margin-top: 15px;">
        <tr>
          <td style="font-weight: bold;">Name:</td>
          <td>${payload.FirstName} ${payload.LastName}</td>
        </tr>
        <tr>
          <td style="font-weight: bold;">Email:</td>
          <td>${payload.email}</td>
        </tr>
        <tr>
          <td style="font-weight: bold;">Subject:</td>
          <td>${payload.subject}</td>
        </tr>
      </table>

      <div style="margin-top: 20px; padding: 15px; background: #f1f5f9; border-left: 4px solid #2563eb;">
        <strong>Message:</strong>
        <p>${payload.message}</p>
      </div>

      <p style="margin-top: 25px; font-size: 12px; color: #64748b; text-align: center;">
        This is an automated email. Please do not reply.
      </p>

    </div>
  </div>
  `,

  contactUser: (payload: any) => `
  <div style="font-family: Arial, sans-serif; padding: 20px; background: #f9fafb;">
    <div style="max-width: 600px; margin: auto; background: white; border-radius: 8px; padding: 25px; 
      border: 1px solid #e5e7eb;">

      <h2 style="color: #2563eb;">👋 Hello ${payload.FirstName},</h2>

      <p style="color: #475569;">Thank you for contacting us! We have received your message and our support team will respond shortly.</p>

      <h3 style="margin-top: 20px; color: #0f172a;">📬 Your Submitted Details</h3>

      <table style="width: 100%; margin-top: 15px;">
        <tr>
          <td style="font-weight: bold;">Name:</td>
          <td>${payload.FirstName} ${payload.LastName}</td>
        </tr>
        <tr>
          <td style="font-weight: bold;">Email:</td>
          <td>${payload.email}</td>
        </tr>
        <tr>
          <td style="font-weight: bold;">Subject:</td>
          <td>${payload.subject}</td>
        </tr>
      </table>

      <div style="margin-top: 20px; padding: 15px; background: #f8fafc; border-left: 4px solid #16a34a;">
        <strong>Message:</strong>
        <p>${payload.message}</p>
      </div>

      <p style="font-size: 13px; margin-top: 25px; color: #94a3b8; text-align: center;">
        We appreciate your patience.
      </p>
    </div>
  </div>
  `,
};
