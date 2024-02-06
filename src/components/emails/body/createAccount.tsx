import {
  Body,
  Button,
  Container,
  Column,
  Head,
  Heading,
  Hr,
  Html,
  Img,
  Link,
  Preview,
  Row,
  Section,
  Text,
} from "@react-email/components";
import { CodeInline } from "@react-email/code-inline";
import * as React from "react";
import EmailLayout from "../emailLayout";

interface VercelInviteUserEmailProps {
  userEmail?: string;
  secretCode?: string;
}

export const CreateAccountMailEdit = ({
  userEmail,
  secretCode,
}: VercelInviteUserEmailProps) => {
  return (
    <Section style={upperSection}>
      <Heading style={h1}>Verify your email address</Heading>
      <Text style={mainText}>
        Thanks for starting the new HKD account creation process. We want to
        make sure it is really you. Please enter the following verification code
        when prompted. If you don&apos;t want to create an account, you can
        ignore this message.
      </Text>
      <Section style={verificationSection}>
        <Text style={verifyText}>Verification code</Text>

        <CodeInline style={codeText}>{secretCode}</CodeInline>
        <Text style={validityText}>(This code is valid for 1 day.)</Text>
      </Section>
    </Section>
  );
};

const h1 = {
  color: "#333",
  fontFamily:
    "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif",
  fontSize: "20px",
  fontWeight: "bold",
  marginBottom: "15px",
};

const text = {
  color: "#333",
  fontFamily:
    "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif",
  fontSize: "14px",
  margin: "24px 0",
};

const upperSection = { padding: "25px 35px" };

const verifyText = {
  ...text,
  margin: 0,
  fontWeight: "bold",
  textAlign: "center" as const,
};

const codeText = {
  ...text,
  fontWeight: "bold",
  fontSize: "36px",
  margin: "10px 0",
  textAlign: "center" as const,
};

const validityText = {
  ...text,
  margin: "0px",
  textAlign: "center" as const,
};

const verificationSection = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

const mainText = { ...text, marginBottom: "14px" };

export const CreateAccountMail = ({ token }: any) => (
  <EmailLayout>
    <CreateAccountMailEdit secretCode={token} />
  </EmailLayout>
);
