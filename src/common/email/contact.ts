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

  adminReply: (payload: {
    firstName: string;
    lastName: string;
    content: string;
  }) => `
  <div style="font-family: Arial, sans-serif; padding: 20px; background: #f8fafc;">
    <div style="max-width: 600px; margin: auto; background: white; border-radius: 8px; padding: 25px; 
      border: 1px solid #e2e8f0;">

      <h2 style="color: #1e40af; text-align: center;">Support Team Reply</h2>
      <p style="color: #475569;">Hi <strong>${payload.firstName} ${payload.lastName}</strong>,</p>

      <p style="color: #475569;">We've reviewed your inquiry and here is our response:</p>

      <div style="margin: 20px 0; padding: 18px; background: #f0f9ff; border-left: 5px solid #0ea5e9; 
        border-radius: 4px; font-size: 15px;">
        <p style="margin: 0; color: #1e293b;">${payload.content.replace(/\n/g, '<br>')}</p>
      </div>

      <p style="color: #64748b; font-size: 14px;">
        You can view the full conversation anytime by clicking the link in your confirmation email.
      </p>

      <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 25px 0;">

      <p style="font-size: 12px; color: #94a3b8; text-align: center;">
        © 2025 Your Company. All rights reserved.
      </p>
    </div>
  </div>
  `,
};
