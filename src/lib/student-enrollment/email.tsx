import "server-only";
import { renderAsync } from "@react-email/render";
import { Heading, Text, Section, Link } from "@react-email/components";
import EmailLayout from "@/components/emails/emailLayout";
import { createBillingTransport } from "@/lib/billing/smtp";
import { trackEmail } from "@/lib/email/history";
export async function sendEnrollmentCredentials({
  email,
  password,
  name,
  partnerId,
  loginUrl,
}: {
  email: string;
  password: string;
  name: string;
  partnerId: string;
  loginUrl: string;
}) {
  const { transport, from } = createBillingTransport();
  try {
    const html = await renderAsync(
      <EmailLayout preview="Your academy account is ready">
        <Heading>Welcome to Kaizen</Heading>
        <Text>Hello {name},</Text>
        <Text>
          Your branch administrator has registered your training account.
        </Text>
        <Section
          style={{
            backgroundColor: "#edf8f8",
            padding: "20px",
            borderRadius: "12px",
          }}
        >
          <Text>Email: {email}</Text>
          <Text>Temporary password: {password}</Text>
        </Section>
        <Text>Change your password after your first sign-in.</Text>
        <Link
          href={loginUrl}
          style={{
            backgroundColor: "#6835c3",
            color: "white",
            padding: "12px 20px",
            borderRadius: "8px",
          }}
        >
          Open your account
        </Link>
      </EmailLayout>,
    );
    return await trackEmail(
      {
        category: "credentials",
        provider: "smtp",
        to: email,
        subject: "Your Kaizen account and enrollment",
        partnerId,
      },
      () =>
        transport.sendMail({
          from,
          to: email,
          subject: "Your Kaizen account and enrollment",
          html,
          text: `Hello ${name},\nYour training account is ready.\nEmail: ${email}\nTemporary password: ${password}\nSign in: ${loginUrl}\nChange your password after signing in.`,
        }),
    );
  } finally {
    transport.close();
  }
}
