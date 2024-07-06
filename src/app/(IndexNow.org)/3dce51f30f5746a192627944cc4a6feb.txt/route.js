export async function GET() {
  const textContent = "3dce51f30f5746a192627944cc4a6feb";

  return new Response(textContent, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
    },
  });
}
