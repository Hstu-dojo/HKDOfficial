"use server";

import { Resend } from "resend";

/**
 * Sends a welcome email containing account login credentials to a newly created member.
 * Reads RESEND_API_KEY from environment variables.
 */
export async function sendCredentialsEmail(
  email: string,
  password: string,
  name: string
): Promise<{ success: boolean; data?: any; error?: string }> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn("[Email] RESEND_API_KEY is not defined in environment variables. Skipping email dispatch.");
    return { success: false, error: "RESEND_API_KEY is missing from environment" };
  }

  const resend = new Resend(apiKey);
  try {
    const fromAddress = process.env.EMAIL_FROM_ADDRESS || "onboarding@resend.dev";
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://www.hstuma.com";

    console.log(`[Email] Dispatching credentials welcome email to: ${email}`);
    
    const { data, error } = await resend.emails.send({
      from: fromAddress,
      to: email,
      subject: "Welcome to HKD Dojo - Your Account Credentials",
      html: `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff; color: #2d3748;">
          <div style="text-align: center; margin-bottom: 24px;">
            <h1 style="color: #1a365d; margin: 0; font-size: 24px; font-weight: 700; letter-spacing: -0.5px;">Welcome to HKD Dojo</h1>
            <p style="color: #718096; margin: 4px 0 0 0; font-size: 14px;">Your martial arts journey begins here</p>
          </div>
          
          <p style="font-size: 16px; line-height: 1.6; margin: 0 0 16px 0;">Hello <strong>${name}</strong>,</p>
          
          <p style="font-size: 15px; line-height: 1.6; margin: 0 0 20px 0;">An account has been created for you by your training venue administrator. You can now sign in to your dashboard to view your schedule, track your belt rank progress, and manage payments.</p>
          
          <div style="background: linear-gradient(135deg, #f7fafc 0%, #edf2f7 100%); padding: 20px; border-radius: 8px; border: 1px solid #e2e8f0; margin: 24px 0;">
            <h3 style="margin: 0 0 12px 0; color: #2b6cb0; font-size: 15px; text-transform: uppercase; letter-spacing: 0.5px;">Your Login Credentials</h3>
            <table style="width: 100%; border-collapse: collapse; font-size: 15px;">
              <tr>
                <td style="padding: 6px 0; color: #718096; width: 100px;"><strong>Email:</strong></td>
                <td style="padding: 6px 0; color: #2d3748; font-family: monospace;">${email}</td>
              </tr>
              <tr>
                <td style="padding: 6px 0; color: #718096;"><strong>Password:</strong></td>
                <td style="padding: 6px 0; color: #2d3748; font-family: monospace; font-weight: bold;">${password}</td>
              </tr>
            </table>
          </div>
          
          <div style="text-align: center; margin: 32px 0;">
            <a href="${appUrl}/login" style="background: linear-gradient(135deg, #3182ce 0%, #2b6cb0 100%); color: #ffffff; padding: 12px 28px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 15px; display: inline-block; box-shadow: 0 4px 6px rgba(49, 130, 206, 0.2); transition: all 0.2s;">Access Your Dashboard</a>
          </div>
          
          <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 32px 0 20px 0;" />
          
          <p style="font-size: 13px; color: #718096; line-height: 1.5; margin: 0;">
            <strong>Security Tip:</strong> For security reasons, we strongly recommend that you update your password after logging in for the first time. You can do this from your profile page inside the dashboard.
          </p>
        </div>
      `,
    });

    if (error) {
      console.error("[Email] Resend API error:", error);
      return { success: false, error: error.message };
    }

    console.log(`[Email] Welcome credentials email sent successfully to ${email}. ID: ${data?.id}`);
    return { success: true, data };
  } catch (error: any) {
    console.error("[Email] Exception caught during credentials email dispatch:", error);
    return { success: false, error: error.message || String(error) };
  }
}
