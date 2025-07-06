import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

const path =
  process.env.NODE_ENV !== "production"
    ? "http://localhost:3000"
    : process.env.NEXT_PUBLIC_APP_URL;

const emailTemplate = (
  title: string,
  content: string,
  buttonText?: string,
  buttonLink?: string,
  isWelcome?: boolean
) => {
  return `
    <div style="font-family: 'Segoe UI', system-ui, -apple-system, sans-serif; max-width: 600px; margin: 0 auto; background: linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%); border-radius: 16px; overflow: hidden; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);">
      
      <!-- Header with Brand -->
      <div style="background: linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(147, 51, 234, 0.05) 50%, rgba(16, 185, 129, 0.03) 100%); padding: 40px 32px; text-align: center; border-bottom: 1px solid rgba(71, 85, 105, 0.3);">
        <div style="display: inline-flex; align-items: center; gap: 12px; margin-bottom: 20px;">
          <div style="width: 40px; height: 40px; background: linear-gradient(135deg, #3b82f6, #1d4ed8); border-radius: 8px; display: flex; align-items: center; justify-content: center;">
            <span style="color: white; font-weight: bold; font-size: 18px;">A</span>
          </div>
          <span style="color: #f8fafc; font-size: 24px; font-weight: 600; letter-spacing: -0.025em;">AuthService</span>
        </div>
        <h1 style="color: #f8fafc; font-size: 28px; font-weight: 600; margin: 0; line-height: 1.2;">${title}</h1>
      </div>

      <!-- Content -->
      <div style="padding: 40px 32px; background: rgba(30, 41, 59, 0.3);">
        <div style="text-align: center;">
          <p style="color: #cbd5e1; font-size: 16px; line-height: 1.6; margin: 0 0 32px 0;">${content}</p>
          
          ${
            buttonText && buttonLink
              ? `
            <div style="margin: 32px 0;">
              <a href="${buttonLink}" style="display: inline-block; background: linear-gradient(135deg, ${isWelcome ? "#10b981, #059669" : "#1d4ed8, #1e40af"}); color: white; text-decoration: none; padding: 16px 32px; border-radius: 8px; font-size: 16px; font-weight: 600; text-align: center; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.3); transition: all 0.3s ease;">
                ${buttonText}
              </a>
            </div>`
              : ""
          }
        </div>

        ${
          isWelcome
            ? `
        <!-- Welcome Features -->
        <div style="margin-top: 40px; padding-top: 32px; border-top: 1px solid rgba(71, 85, 105, 0.3);">
          <h3 style="color: #f1f5f9; font-size: 18px; font-weight: 600; margin: 0 0 20px 0; text-align: center;">What's next?</h3>
          <div style="display: grid; gap: 16px;">
            <div style="display: flex; align-items: center; gap: 12px; padding: 16px; background: rgba(51, 65, 85, 0.3); border-radius: 8px; border: 1px solid rgba(71, 85, 105, 0.3);">
              <div style="width: 32px; height: 32px; background: linear-gradient(135deg, #3b82f6, #1d4ed8); border-radius: 6px; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
                <span style="color: white; font-size: 16px;">⚙️</span>
              </div>
              <div>
                <p style="color: #f1f5f9; font-weight: 600; margin: 0; font-size: 14px;">Complete your profile</p>
                <p style="color: #94a3b8; margin: 0; font-size: 13px;">Add your personal information</p>
              </div>
            </div>
            <div style="display: flex; align-items: center; gap: 12px; padding: 16px; background: rgba(51, 65, 85, 0.3); border-radius: 8px; border: 1px solid rgba(71, 85, 105, 0.3);">
              <div style="width: 32px; height: 32px; background: linear-gradient(135deg, #10b981, #059669); border-radius: 6px; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
                <span style="color: white; font-size: 16px;">🛡️</span>
              </div>
              <div>
                <p style="color: #f1f5f9; font-weight: 600; margin: 0; font-size: 14px;">Enable two-factor authentication</p>
                <p style="color: #94a3b8; margin: 0; font-size: 13px;">Add an extra layer of security</p>
              </div>
            </div>
          </div>
        </div>
        `
            : ""
        }
      </div>

      <!-- Footer -->
      <div style="padding: 32px; background: rgba(15, 23, 42, 0.8); text-align: center; border-top: 1px solid rgba(71, 85, 105, 0.3);">
        <p style="font-size: 13px; color: #64748b; margin: 0 0 8px 0;">
          If you didn't request this email, please ignore it.
        </p>
        <p style="font-size: 13px; color: #64748b; margin: 0;">
          Best regards,<br>
          <span style="color: #94a3b8; font-weight: 600;">The AuthService Team</span>
        </p>
        
        <!-- Decorative elements -->
        <div style="margin-top: 24px; display: flex; justify-content: center; gap: 8px;">
          <div style="width: 6px; height: 6px; background: linear-gradient(135deg, #3b82f6, #1d4ed8); border-radius: 50%; opacity: 0.6;"></div>
          <div style="width: 6px; height: 6px; background: linear-gradient(135deg, #10b981, #059669); border-radius: 50%; opacity: 0.6;"></div>
          <div style="width: 6px; height: 6px; background: linear-gradient(135deg, #3b82f6, #1d4ed8); border-radius: 50%; opacity: 0.6;"></div>
        </div>
      </div>
    </div>
  `;
};

export async function sendVerificationEmail(email: string, token: string) {
  const confirmLink = `${path}/new-verification?token=${token}`;

  await resend.emails.send({
    from: "AuthService <noreply@mocktalk.dev>",
    to: email,
    subject: "Confirm Your Email Address",
    html: emailTemplate(
      "Confirm Your Email",
      "Welcome to AuthService! Please confirm your email address to complete your account setup and start using our platform.",
      "Verify Email Address",
      confirmLink
    ),
  });
}

export async function sendResetPasswordEmail(email: string, token: string) {
  const resetLink = `${path}/new-password?token=${token}`;

  await resend.emails.send({
    from: "AuthService <noreply@mocktalk.dev>",
    to: email,
    subject: "Reset Your Password",
    html: emailTemplate(
      "Reset Your Password",
      "We received a request to reset your password. Click the button below to create a new password. This link will expire in 1 hour for security reasons.",
      "Reset Password",
      resetLink
    ),
  });
}

export async function sendTwoFactorTokenEmail(email: string, token: string) {
  await resend.emails.send({
    from: "AuthService <noreply@mocktalk.dev>",
    to: email,
    subject: "Your Two-Factor Authentication Code",
    html: emailTemplate(
      "Two-Factor Authentication",
      `Your two-factor authentication code is: <br><br><span style='font-family: Monaco, Consolas, monospace; font-size: 32px; font-weight: bold; color: #3b82f6; background: rgba(59, 130, 246, 0.1); padding: 16px 24px; border-radius: 8px; border: 2px solid rgba(59, 130, 246, 0.3); display: inline-block; letter-spacing: 4px;'>${token}</span><br><br>This code will expire in 5 minutes.`
    ),
  });
}

export async function sendWelcomeEmail(email: string, name: string) {
  await resend.emails.send({
    from: "AuthService <welcome@mocktalk.dev>",
    to: email,
    subject: "Welcome to AuthService! 🎉",
    html: emailTemplate(
      `Welcome, ${name}!`,
      `Thank you for verifying your email! Your account is now fully activated and ready to use. We're excited to have you as part of the AuthService community.`,
      "Get Started",
      `${path}/dashboard`,
      true // isWelcome flag
    ),
  });
}
