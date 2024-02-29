"use client";
import { CreateAccountMail } from "@/components/emails/body/createAccount";
import { useState, useEffect } from 'react'
export default function Email() {
  const [isClient, setIsClient] = useState(false)
  
  useEffect(() => {
    setIsClient(true)
  }, [])
  return (
    <>
      {isClient ? <CreateAccountMail token={"123-456-789"} /> : 'Rendering..'}
    </>
  );
}
