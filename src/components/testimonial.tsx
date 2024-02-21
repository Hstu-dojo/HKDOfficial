"use client";

import React from "react";
import { CardBody, CardContainer, CardItem } from "@/components/ui/3d-card";
import Image from "next/image";
import StarRating from "./star-rating";

type TestimonialProps = {
  testimonial: Testimonial;
};

const Testimonial = ({
  testimonial: { name, company, comment, image, rating },
}: TestimonialProps) => {
  return (
    <CardContainer className="inter-var">
      <CardBody className="group/card dark:hover:shadow-2xl relative  h-full w-auto rounded-xl border border-black/[0.1] bg-gray-50 p-6 px-10 py-12 dark:border-white/[0.2] dark:bg-black dark:hover:shadow-emerald-500/[0.1] sm:w-[30rem]  ">
        {(image || name || company) && (
          <CardItem translateZ="50" className="mb-7 flex items-center">
            {image && (
              <Image
                src={image}
                alt={`Testimonial of ${name}`}
                className="mr-5 shrink-0"
                width={55}
                height={55}
              />
            )}
            {name || company ? (
              <CardItem translateZ="80" className="testimonial__info">
                {name && (
                  <span className="mb-1 block text-md font-bold text-foreground">
                    {name}
                  </span>
                )}
                {company && (
                  <span className="block text-[0.875rem] text-slate-400">
                    {company}
                  </span>
                )}
              </CardItem>
            ) : null}
          </CardItem>
        )}

        {comment || rating ? (
          <CardItem translateZ="100">
            {comment && <p className="text-md">{comment}</p>}
            {rating && (
              <div className="mt-4">
                <StarRating value={rating} />
              </div>
            )}
          </CardItem>
        ) : null}
      </CardBody>
    </CardContainer>
  );
};

export default Testimonial;
