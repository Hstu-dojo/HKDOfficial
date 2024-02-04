import { Text, Img, Section, Column, Row } from "@react-email/components";
import { Tailwind } from "@react-email/tailwind";
export const EmailFooter = () => {
  return (
    <Tailwind>
      <Row className="flex flex-row items-center justify-center bg-[#C7AEE9] p-4">
        <Column className=" ">
          <Img
            src={`https://i.ibb.co/JKRHSNw/logo.png`}
            width="28"
            height="28"
            alt="HKD"
            className="my-0 mr-3 rounded-full bg-[#CCCCCC]"
          />
        </Column>
        <Column>
          <Text className="text-[12px] leading-[24px] text-[#000000]">
            <p className="text-sm">
              © 2024 HSTU Karate Dojo. All rights reserved.
            </p>
          </Text>
        </Column>
      </Row>
    </Tailwind>
  );
};

export default EmailFooter;
