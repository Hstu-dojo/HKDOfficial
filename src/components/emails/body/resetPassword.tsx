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
import { Tailwind } from "@react-email/tailwind";
import * as React from "react";
import EmailLayout from "../emailLayout";

interface VercelInviteUserEmailProps {
  username?: string;
  userImage?: string;
  invitedByUsername?: string;
  invitedByEmail?: string;
  teamName?: string;
  teamImage?: string;
  inviteLink?: string;
  inviteFromIp?: string;
  inviteFromLocation?: string;
}

const baseUrl = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : "";

export const CreateAccountMailEdit = ({
  username,
  userImage,
  invitedByUsername,
  invitedByEmail,
  teamName,
  teamImage,
  inviteLink,
  inviteFromIp,
  inviteFromLocation,
}: VercelInviteUserEmailProps) => {
  return (
    <Tailwind>
      {" "}
      <Section className="max-w-[465px] rounded bg-white px-[20px] ">
        <Heading className="mx-0 my-[30px] p-0 text-center text-[24px] font-normal text-black">
          Join <strong>{teamName}</strong> on <strong>Vercel</strong>
        </Heading>
        <Text className="text-[14px] leading-[24px] text-black">
          Hello {username},
        </Text>
        <Text className="text-[14px] leading-[24px] text-black">
          <strong>{invitedByUsername}</strong> (
          <Link
            href={`mailto:${invitedByEmail}`}
            className="text-blue-600 no-underline"
          >
            {invitedByEmail}
          </Link>
          ) has invited you to the <strong>{teamName}</strong> team on{" "}
          <strong>Vercel</strong>.
        </Text>
        <Section>
          <Row>
            <Column align="right">
              <Img
                className="rounded-full"
                src={userImage}
                width="64"
                height="64"
              />
            </Column>
            <Column align="center">
              <Img
                src={`${baseUrl}/static/vercel-arrow.png`}
                width="12"
                height="9"
                alt="invited you to"
              />
            </Column>
            <Column align="left">
              <Img
                className="rounded-full"
                src={teamImage}
                width="64"
                height="64"
              />
            </Column>
          </Row>
        </Section>
        <Section className="mb-[32px] mt-[32px] text-center">
          <Button
            className="rounded bg-[#000000] px-5 py-3 text-center text-[12px] font-semibold text-white no-underline"
            href={inviteLink}
          >
            Join the team
          </Button>
        </Section>
        <Text className="text-[14px] leading-[24px] text-black">
          or copy and paste this URL into your browser:{" "}
          <Link href={inviteLink} className="text-blue-600 no-underline">
            {inviteLink}
          </Link>
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
