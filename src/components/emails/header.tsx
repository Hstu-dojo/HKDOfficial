import { Img, Section } from "@react-email/components";


export const EmailHeader = () => {
  return (
    <Section className="mt-[32px]">
              <Img
                src={`/logo.png`}
                width="64"
                height="64"
                alt="hkd"
                className="mx-auto my-0"
              />
    </Section>
  );
};

export default EmailHeader;
