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
import { Tailwind } from "@react-email/tailwind";
import * as React from "react";
import EmailLayout from "../emailLayout";

interface VercelInviteUserEmailProps {
  userEmail?: string;
  secretCode?: string;
}

export const CreateAccountMailEdit = ({
  userEmail,
  secretCode
}: VercelInviteUserEmailProps) => {
  return (
    <Tailwind>
      {" "}
      <Section className="max-w-[465px] rounded bg-white px-[20px] ">
        <Heading className="mx-0 my-[30px] p-0 text-center text-[24px] font-normal text-black">
          Verification for <strong>HKD</strong>
        </Heading>
        <Text className="text-[14px] leading-[24px] text-black">Hello,</Text>
        <Text className="text-[14px] leading-[24px] text-black">
          Welcome to <strong>HSTU Karate Dojo.</strong> We appreciate your big
          steps towards your new interest. Thanks for choosing this platform.
        </Text>
        <Section className="mb-[32px] mt-[32px] text-center">
          <CodeInline className="text-center text-lg">
            {/* {secretCode} */}
            123-465-789
          </CodeInline>
        </Section>
        <Text className="text-[14px] leading-[24px] text-black">
          copy and paste this CODE into your browser to verify your email.
        </Text>
        <Text className="text-[14px] leading-[24px] text-black">
          This email was intended for account associated to <i>email: {userEmail}</i> .
          If you did not request this, please ignore this email.
        </Text>
      </Section>
    </Tailwind>
  );
};

export const CreateAccountMail = () => (
  <EmailLayout>
    <CreateAccountMailEdit />
  </EmailLayout>
);
