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
    image: `${baseUrl}/c_fill,w_300,h_300,g_face,q_auto/grading2/agvcuaaft5ztob4nmwxr.jpg`,
    badge: "Black Belt",
  },
  {
    name: "Sensei Rahman",
    designation: "Assistant Instructor",
    image: `${baseUrl}/c_fill,w_300,h_300,g_face,q_auto/grading2/ap6my94brr1rwrgpmwgr.jpg`,
    badge: "Black Belt",
  },
  {
    name: "Karim Ahmed",
    designation: "Senior Member",
    image: `${baseUrl}/c_fill,w_300,h_300,g_face,q_auto/grading2/auxq34xmb8hga8zu0ald.jpg`,
    badge: "Brown Belt",
  },
  {
    name: "Fatima Begum",
    designation: "Women's Champion",
    image: `${baseUrl}/c_fill,w_300,h_300,g_face,q_auto/grading2/bwmsrj8zfsudzppwyjul.jpg`,
    badge: "Purple Belt",
  },
  {
    name: "Mohammad Ali",
    designation: "Tournament Winner",
    image: `${baseUrl}/c_fill,w_300,h_300,g_face,q_auto/grading2/cfbkuwsrmdq11yrp234o.jpg`,
    badge: "Green Belt",
  },
  {
    name: "Aisha Khan",
    designation: "Rising Star",
    image: `${baseUrl}/c_fill,w_300,h_300,g_face,q_auto/grading2/egrgtxni5tnbkjuhchfi.jpg`,
    badge: "Blue Belt",
  },
  {
    name: "Rafiq Uddin",
    designation: "Kata Specialist",
    image: `${baseUrl}/c_fill,w_300,h_300,g_face,q_auto/grading2/emfesmumm7lhwhzjqvss.jpg`,
    badge: "Orange Belt",
  },
  {
    name: "Nasreen Akter",
    designation: "Dedicated Practitioner",
    image: `${baseUrl}/c_fill,w_300,h_300,g_face,q_auto/grading2/enhusdstm6vbct2nf1ui.jpg`,
  },
  {
    name: "Sharif Hossain",
    designation: "Kumite Champion",
    image: `${baseUrl}/c_fill,w_300,h_300,g_face,q_auto/grading2/f6hohamgvwlkm02bx4ud.jpg`,
    badge: "Gold Medal",
  },
  {
    name: "Rubina Islam",
    designation: "Training Excellence",
    image: `${baseUrl}/c_fill,w_300,h_300,g_face,q_auto/grading2/f6xn63bun5v5i6adjv0w.jpg`,
    badge: "Yellow Belt",
  },
  {
    name: "Tanvir Hassan",
    designation: "Youth Division",
    image: `${baseUrl}/c_fill,w_300,h_300,g_face,q_auto/grading2/fklenqcvdkgnvh31iybc.jpg`,
  },
  {
    name: "Sabrina Jahan",
    designation: "Women's Division",
    image: `${baseUrl}/c_fill,w_300,h_300,g_face,q_auto/grading2/gkks4zjo44ukeaucl4is.jpg`,
  },
  {
    name: "Imran Khan",
    designation: "Senior Division",
    image: `${baseUrl}/c_fill,w_300,h_300,g_face,q_auto/grading2/hb4h197fytyo5wbytjet.jpg`,
    badge: "White Belt",
  },
  {
    name: "Nadia Sultana",
    designation: "Consistent Performer",
    image: `${baseUrl}/c_fill,w_300,h_300,g_face,q_auto/grading2/hsjpyxz9wc2js7ssr4kn.jpg`,
    badge: "Member",
  },
  {
    name: "Arif Mahmud",
    designation: "Tournament Participant",
    image: `${baseUrl}/c_fill,w_300,h_300,g_face,q_auto/grading2/iqmosohzq68gnyeuzooy.jpg`,
  },
  {
    name: "Shirin Akhter",
    designation: "Dedicated Member",
    image: `${baseUrl}/c_fill,w_300,h_300,g_face,q_auto/grading2/iuenpihfqkuzchihjxg9.jpg`,
  },
  {
    name: "Jamal Uddin",
    designation: "Training Assistant",
    image: `${baseUrl}/c_fill,w_300,h_300,g_face,q_auto/grading2/jvrhlrhyfxcts3ommgtg.jpg`,
  },
  {
    name: "Maliha Rahman",
    designation: "Rising Champion",
    image: `${baseUrl}/c_fill,w_300,h_300,g_face,q_auto/grading2/kfyujcmy5sf6psxpmdb9.jpg`,
  },
  {
    name: "Farhan Ahmed",
    designation: "Youth Talent",
    image: `${baseUrl}/c_fill,w_300,h_300,g_face,q_auto/grading2/kpvvo9bfmfh3u7avavim.jpg`,
    badge: "Future Star",
  },
  {
    name: "Tamanna Akter",
    designation: "Spirit Award",
    image: `${baseUrl}/c_fill,w_300,h_300,g_face,q_auto/grading2/l56zevqjpp15uxwvcwht.jpg`,
    badge: "HKD Spirit",
  },
];
