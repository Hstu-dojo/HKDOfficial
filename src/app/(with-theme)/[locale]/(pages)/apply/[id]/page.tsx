
import Header from "@/components/layout/header";

import Footer from "@/components/layout/footer";

import AuroraBd from "@/components/sections/aurora";
import MaxWidthWrapper from "@/components/maxWidthWrapper";
import { EnrollForm } from "@/components/enroll-form";



export default function InputForm() {
  
  return (
    <>
      <Header />
      <main className="relative">
        <AuroraBd />
        <MaxWidthWrapper>
          <EnrollForm />
          
        </MaxWidthWrapper>
      </main>
      <Footer />
    </>
  );
}
