import nodemailer from 'nodemailer';

export const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD, 
  },
});

export const sendOTP = async (to: string, otp: string) => {
  // During local development if no credentials are provided, just log it.
  if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
    console.log(`\n\n===  OTP FOR ${to}: ${otp} ===\n\n`);
    return { success: true, message: 'OTP logged to console (No Gmail configured)' };
  }

  const mailOptions = {
    from: `"VIIT" <${process.env.GMAIL_USER}>`,
    to,
    subject: 'Your VIIT Verification OTP', 
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 20px; border: 1px solid #eaeaea; border-radius: 8px;">
        <h2 style="color: #333; text-align: center;">Welcome to VIIT</h2>
        <p style="color: #555; font-size: 16px;">Your verification code is:</p>
        <div style="text-align: center; margin: 20px 0;">
          <span style="font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #000; background: #f5f5f5; padding: 10px 20px; border-radius: 4px;">
            ${otp}
          </span>
        </div>
        <p style="color: #888; font-size: 14px; text-align: center;">This code will expire in 5 minutes.</p>
        <hr style="border: none; border-top: 1px solid #eaeaea; margin: 20px 0;" />
        <p style="color: #aaa; font-size: 12px; text-align: center;">If you didn't request this, please ignore this email.</p>
      </div>
    `,
  };

  await transporter.sendMail(mailOptions);
  return { success: true };
};
