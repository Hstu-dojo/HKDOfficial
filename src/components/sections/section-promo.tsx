import PromoTriangle from "@/components/promo-triangle";
import { Button } from "@/components/ui/button";
import { ChevronRightIcon } from "@heroicons/react/20/solid";
import MaxWidthWrapper from "../maxWidthWrapper";

const SectionPromo = () => {
  return (
    <MaxWidthWrapper className="relative overflow-hidden pb-28 pt-10 lg:pb-64 lg:pt-24">
      <PromoTriangle />
      <div className="container">
        <div className="lg:ml-auto lg:w-[45%]">
          <h2 className="max-w-md">
            Ready to Embark on Your Karate Journey?
          </h2>
          <p className="mb-10 text-lg">
            Join HSTU Karate Dojo and experience the art of karate in a supportive and dynamic environment. Whether you&apos;re a beginner or an advanced practitioner, our programs are designed to help you achieve your personal best. Train with experienced instructors, participate in competitions, and engage in community activities.
          </p>
          <Button>
            Join Now
            <ChevronRightIcon width={20} height={20} className="-mr-2 ml-4" />
          </Button>
        </div>
      </div>
    </MaxWidthWrapper>
  );
};

export default SectionPromo;
