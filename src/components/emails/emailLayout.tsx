import {
  Body,
  Head,
  Html,
  Preview,
  Container
} from "@react-email/components";
import { Tailwind } from "@react-email/tailwind";
import * as React from "react";
import EmailFooter from "./footer";
import EmailHeader from "./header";

export const EmailLayout = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const previewText = `Preview`;

  return (
    <Html suppressHydrationWarning>
      <Head />
      <Preview>{previewText}</Preview>
      <Tailwind>
        <Body className="mx-auto mt-auto bg-white px-2 font-sans">
          <div className="h-28 w-full bg-[#0097B2]" />
          <Container className="shadow shadow-xl relative bottom-16 mx-auto mt-[40px] max-w-[465px] rounded border border-solid border-[#eaeaea] bg-white px-[20px] ">
            <EmailHeader />
           {children}
            <EmailFooter />
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
};

export default EmailLayout;
