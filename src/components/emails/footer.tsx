import { Text, Img } from "@react-email/components";

export const EmailFooter = () => {
  return (
    <Text className="text-[12px] leading-[24px] text-[#666666]">
      {/* create a nice footer with logo */}
      <footer className="flex items-center justify-center bg-[#c4c0c0] p-4">
        <Img
          src={`/logo.png`}
          width="28"
          height="28"
          alt="HKD"
          className="my-0 mr-3"
        />
        <p className="text-sm">
          © 2024 HSTU Karate Dojo. All rights reserved.
        </p>
      </footer>
    </Text>
  );
};

export default EmailFooter;
