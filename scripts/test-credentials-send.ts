import { sendCredentialsEmail } from "../src/actions/emailSend/sendCredentials";

async function run() {
  console.log("Running test-credentials-send script...");
  const targetEmail = "mr.hasan3032@gmail.com";
  const mockPassword = "TestTemporaryPassword123";
  const mockName = "Hasan Shahriar";

  console.log(`Sending credentials email to: ${targetEmail}`);
  const result = await sendCredentialsEmail(targetEmail, mockPassword, mockName);

  if (result.success) {
    console.log("SUCCESS: Credentials email sent successfully! API response:", result.data);
  } else {
    console.error("FAILURE: Failed to send credentials email:", result.error);
    console.log("Please check if RESEND_API_KEY is configured in your .env file or environment.");
  }
}

run().then(() => process.exit(0)).catch(e => { console.error("Test credentials script failed with error:", e); process.exit(1); });
