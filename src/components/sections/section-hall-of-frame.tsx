"use client";
import React, { useState, useRef } from 'react';
import { ContainerScroll } from "@/components/ui/container-scroll-animation";
import { BackgroundBeams } from "../ui/background-beams";
import TypewriterEffectComponent from "../blogs/shared/TypewriterEffectComponent";

// Cloudinary cloud name for HKD images
const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || "dksn30eyz";
// Cinematic effect for portraits: face detection, subtle vignette, contrast, warmth
const cinematicEffect = "c_fill,w_300,h_300,g_face,q_auto,e_vignette:20,e_contrast:10,e_vibrance:15";
const baseUrl = `https://res.cloudinary.com/${cloudName}/image/upload/${cinematicEffect}`;

export function HallOfFrame() {
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef(new Audio('/assets/hof.mp3'));

  const handleMouseEnter = () => {
    audioRef.current.play();
    setIsPlaying(true);
  };

  const handleMouseLeave = () => {
    audioRef.current.pause();
    //audioRef.current.currentTime = 0; // Reset the audio to the beginning
    setIsPlaying(false);
  };
  return (
    <div 
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className="flex flex-col overflow-hidden">
      <BackgroundBeams />
      <ContainerScroll
        users={users}
        titleComponent={
          <>
            <h1 className="text-4xl font-semibold text-black dark:text-white">
              Bringing you the <br />
              <span className="mt-1 text-4xl font-bold leading-none md:text-[6rem]">
                <TypewriterEffectComponent text={"Hall of Fame"} />
              </span>
            </h1>
          </>
        }
      />
    </div>
  );
}

// HKD Hall of Fame members with Cloudinary images from favourite folder
export const users = [
  {
    name: "Sensei Abdullah",
    designation: "Chief Instructor, HKD",
    image: `${baseUrl}/favourite/IMG_1937_sendde.jpg`,
    badge: "Black Belt",
  },
  {
    name: "Sensei Rahman",
    designation: "Assistant Instructor",
    image: `${baseUrl}/favourite/IMG_20251108_215737_zxprcw.jpg`,
    badge: "Black Belt",
  },
  {
    name: "Karim Ahmed",
    designation: "Senior Member",
    image: `${baseUrl}/favourite/IMG_20251108_221125_hfljw3.jpg`,
    badge: "Brown Belt",
  },
  {
    name: "Fatima Begum",
    designation: "Women's Champion",
    image: `${baseUrl}/favourite/IMG-20250822-WA0053_qiobdp.jpg`,
    badge: "Purple Belt",
  },
  {
    name: "Mohammad Ali",
    designation: "Tournament Winner",
    image: `${baseUrl}/favourite/IMG20241102210222_yg3tws.jpg`,
    badge: "Green Belt",
  },
  {
    name: "Aisha Khan",
    designation: "Rising Star",
    image: `${baseUrl}/favourite/IMG_1937_sendde.jpg`,
    badge: "Blue Belt",
  },
  {
    name: "Rafiq Uddin",
    designation: "Kata Specialist",
    image: `${baseUrl}/favourite/IMG_20251108_215737_zxprcw.jpg`,
    badge: "Orange Belt",
  },
  {
    name: "Nasreen Akter",
    designation: "Dedicated Practitioner",
    image: `${baseUrl}/favourite/IMG_20251108_221125_hfljw3.jpg`,
  },
  {
    name: "Sharif Hossain",
    designation: "Kumite Champion",
    image: `${baseUrl}/favourite/IMG-20250822-WA0053_qiobdp.jpg`,
    badge: "Gold Medal",
  },
  {
    name: "Rubina Islam",
    designation: "Training Excellence",
    image: `${baseUrl}/favourite/IMG20241102210222_yg3tws.jpg`,
    badge: "Yellow Belt",
  },
  {
    name: "Tanvir Hassan",
    designation: "Youth Division",
    image: `${baseUrl}/favourite/IMG_1937_sendde.jpg`,
  },
  {
    name: "Sabrina Jahan",
    designation: "Women's Division",
    image: `${baseUrl}/favourite/IMG_20251108_215737_zxprcw.jpg`,
  },
  {
    name: "Imran Khan",
    designation: "Senior Division",
    image: `${baseUrl}/favourite/IMG_20251108_221125_hfljw3.jpg`,
    badge: "White Belt",
  },
  {
    name: "Nadia Sultana",
    designation: "Consistent Performer",
    image: `${baseUrl}/favourite/IMG-20250822-WA0053_qiobdp.jpg`,
    badge: "Member",
  },
  {
    name: "Arif Mahmud",
    designation: "Tournament Participant",
    image: `${baseUrl}/favourite/IMG20241102210222_yg3tws.jpg`,
  },
  {
    name: "Shirin Akhter",
    designation: "Dedicated Member",
    image: `${baseUrl}/favourite/IMG_1937_sendde.jpg`,
  },
  {
    name: "Jamal Uddin",
    designation: "Training Assistant",
    image: `${baseUrl}/favourite/IMG_20251108_215737_zxprcw.jpg`,
  },
  {
    name: "Maliha Rahman",
    designation: "Rising Champion",
    image: `${baseUrl}/favourite/IMG_20251108_221125_hfljw3.jpg`,
  },
  {
    name: "Farhan Ahmed",
    designation: "Youth Talent",
    image: `${baseUrl}/favourite/IMG-20250822-WA0053_qiobdp.jpg`,
    badge: "Future Star",
  },
  {
    name: "Tamanna Akter",
    designation: "Spirit Award",
    image: `${baseUrl}/favourite/IMG20241102210222_yg3tws.jpg`,
    badge: "HKD Spirit",
  },
];
