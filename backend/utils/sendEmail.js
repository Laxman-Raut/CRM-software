import nodemailer from "nodemailer";

const sendEmail = async (emailOrObj, otpOrSubject, text, html) => {
  let to, subject, bodyText, bodyHtml;

  if (typeof emailOrObj === "object" && emailOrObj !== null) {
    to = emailOrObj.to;
    subject = emailOrObj.subject;
    bodyText = emailOrObj.text;
    bodyHtml = emailOrObj.html;
  } else {
    // Legacy support for sendEmail(email, otp)
    to = emailOrObj;
    const otp = otpOrSubject;
    subject = "CRM Password Reset OTP";
    bodyText = `Your OTP for resetting the CRM password is: ${otp}. This OTP is valid for 5 minutes.`;
    bodyHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
        <h2 style="color: #2563eb; text-align: center;">CRM Password Reset</h2>
        <p>Hello,</p>
        <p>You requested a password reset for your CRM account. Please use the following One-Time Password (OTP) to complete the reset process:</p>
        <div style="font-size: 24px; font-weight: bold; text-align: center; margin: 30px 0; color: #0f172a; letter-spacing: 2px;">
          ${otp}
        </div>
        <p>This OTP is valid for <strong>5 minutes</strong>. If you did not request this, please ignore this email.</p>
        <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
        <p style="font-size: 12px; color: #64748b; text-align: center;">CRM System Admin Team</p>
      </div>
    `;
  }

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  const mailOptions = {
    from: `"CRM Support" <${process.env.EMAIL_USER}>`,
    to,
    subject,
    text: bodyText,
    html: bodyHtml,
  };

  await transporter.sendMail(mailOptions);
};

export default sendEmail;