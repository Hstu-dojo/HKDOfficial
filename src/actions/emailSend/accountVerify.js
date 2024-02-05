// @ts-nocheck
import { render } from "@react-email/render";
import nodemailer from "nodemailer";
import { CreateAccountMail } from "@/components/emails/body/createAccount";

const transporter = nodemailer.createTransport({
  host: "smtp.resend.com",
  port: 465,
  secure: true,
  auth: {
    user: "resend",
    pass: "re_7zGogRKU_8sCXU6B3wTyC3WaJwZ2FFcxu",
  },
});

// create a try - catch block

export default async function accountVerify(email, token) {
  const emailHtml = render(<CreateAccountMail token={token} />);
  const options = {
    from: "noreply@karate.paradox-bd.com",
    to: email,
    subject: "HKD: Account Verification",
    html: emailHtml,
  };

  try {
    const result = await transporter.sendMail(options);
    console.log(result);
    return result;
  } catch (error) {
    console.log(error);
    return error;
  }
}
