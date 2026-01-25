"use client";
import React, { useState, useRef } from 'react';
import { ContainerScroll } from "@/components/ui/container-scroll-animation";
import { BackgroundBeams } from "../ui/background-beams";
import TypewriterEffectComponent from "../blogs/shared/TypewriterEffectComponent";

// Cloudinary cloud name for HKD images
const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || "dksn30eyz";
const baseUrl = `https://res.cloudinary.com/${cloudName}/image/upload`;

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

// HKD Hall of Fame members with Cloudinary images
export const users = [
  {
    name: "Sensei Abdullah",
    designation: "Chief Instructor, HKD",
    image: `${baseUrl}/c_fill,w_300,h_300,g_face,q_auto/grading2/DSC00091_mxqhm6.jpg`,
    badge: "Black Belt",
  },
  {
    name: "Sensei Rahman",
    designation: "Assistant Instructor",
    image: `${baseUrl}/c_fill,w_300,h_300,g_face,q_auto/grading2/DSC00085_kxqvfl.jpg`,
    badge: "Black Belt",
  },
  {
    name: "Karim Ahmed",
    designation: "Senior Member",
    image: `${baseUrl}/c_fill,w_300,h_300,g_face,q_auto/grading2/DSC00068_lfbpgr.jpg`,
    badge: "Brown Belt",
  },
  {
    name: "Fatima Begum",
    designation: "Women's Champion",
    image: `${baseUrl}/c_fill,w_300,h_300,g_face,q_auto/grading2/DSC00061_gvhwmz.jpg`,
    badge: "Purple Belt",
  },
  {
    name: "Mohammad Ali",
    designation: "Tournament Winner",
    image: `${baseUrl}/c_fill,w_300,h_300,g_face,q_auto/grading2/DSC00054_zopjfi.jpg`,
    badge: "Green Belt",
  },
  {
    name: "Aisha Khan",
    designation: "Rising Star",
    image: `${baseUrl}/c_fill,w_300,h_300,g_face,q_auto/grading2/DSC00047_uwtkja.jpg`,
    badge: "Blue Belt",
  },
  {
    name: "Rafiq Uddin",
    designation: "Kata Specialist",
    image: `${baseUrl}/c_fill,w_300,h_300,g_face,q_auto/grading2/DSC00040_jmxfzl.jpg`,
    badge: "Orange Belt",
  },
  {
    name: "Nasreen Akter",
    designation: "Dedicated Practitioner",
    image: `${baseUrl}/c_fill,w_300,h_300,g_face,q_auto/grading2/DSC00033_xvprqm.jpg`,
  },
  {
    name: "Sharif Hossain",
    designation: "Kumite Champion",
    image: `${baseUrl}/c_fill,w_300,h_300,g_face,q_auto/grading2/DSC00026_hvwmzk.jpg`,
    badge: "Gold Medal",
  },
  {
    name: "Rubina Islam",
    designation: "Training Excellence",
    image: `${baseUrl}/c_fill,w_300,h_300,g_face,q_auto/grading2/DSC00019_yfxqjm.jpg`,
    badge: "Yellow Belt",
  },
  {
    name: "Tanvir Hassan",
    designation: "Youth Division",
    image: `${baseUrl}/c_fill,w_300,h_300,g_face,q_auto/grading2/DSC00012_nmzxfj.jpg`,
  },
  {
    name: "Sabrina Jahan",
    designation: "Women's Division",
    image: `${baseUrl}/c_fill,w_300,h_300,g_face,q_auto/grading2/DSC00005_plwmxf.jpg`,
  },
  {
    name: "Imran Khan",
    designation: "Senior Division",
    image: `${baseUrl}/c_fill,w_300,h_300,g_face,q_auto/grading2/DSC00098_wmfxzj.jpg`,
    badge: "White Belt",
  },
  {
    name: "Nadia Sultana",
    designation: "Consistent Performer",
    image: `${baseUrl}/c_fill,w_300,h_300,g_face,q_auto/grading2/DSC00079_xfmwxz.jpg`,
    badge: "Member",
  },
  {
    name: "Arif Mahmud",
    designation: "Tournament Participant",
    image: `${baseUrl}/c_fill,w_300,h_300,g_face,q_auto/grading2/DSC00072_jmfwxz.jpg`,
  },
  {
    name: "Shirin Akhter",
    designation: "Dedicated Member",
    image: `${baseUrl}/c_fill,w_300,h_300,g_face,q_auto/grading2/DSC00065_wmfxkz.jpg`,
  },
  {
    name: "Jamal Uddin",
    designation: "Training Assistant",
    image: `${baseUrl}/c_fill,w_300,h_300,g_face,q_auto/grading2/DSC00058_xfpwmz.jpg`,
  },
  {
    name: "Maliha Rahman",
    designation: "Rising Champion",
    image: `${baseUrl}/c_fill,w_300,h_300,g_face,q_auto/grading2/DSC00051_hmfwzk.jpg`,
  },
  {
    name: "Farhan Ahmed",
    designation: "Youth Talent",
    image: `${baseUrl}/c_fill,w_300,h_300,g_face,q_auto/grading2/DSC00044_jmxfwk.jpg`,
    badge: "Future Star",
  },
  {
    name: "Tamanna Akter",
    designation: "Spirit Award",
    image: `${baseUrl}/c_fill,w_300,h_300,g_face,q_auto/grading2/DSC00037_wmfxzk.jpg`,
    badge: "HKD Spirit",
  },
];
