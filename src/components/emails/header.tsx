import { Img, Column, Row } from "@react-email/components";
import { Tailwind } from "@react-email/tailwind";

export const EmailHeader = () => {
  return (
    <Tailwind>
    <Row className="mt-[32px]">
      <Column className="text-center">
              <Img
                src={`https://i.ibb.co/JKRHSNw/logo.png`}
                width="64"
                height="64"
                alt="hkd"
                className="mx-auto my-0"
              />
        </Column>
    </Row>
    </Tailwind>
  );
};

export default EmailHeader;
