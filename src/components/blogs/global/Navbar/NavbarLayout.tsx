import Link from "next/link";

import {
  MenuItem,
  SettingsPayload,
} from "../../../../../sanity/lib/sanity_types";
import PageSelection from "./PageSelection";
// import { FloatingNavbar } from "./FloatingNav";
interface NavbarProps {
  data: SettingsPayload;
}
export default function Navbar(props: NavbarProps) {
  const { data } = props;
  const menuItems = data?.menuItems || ([] as MenuItem[]);
  // console.log(data);
  return (
    <div className="sticky justify-between top-0 z-10 flex w-full flex-wrap items-center gap-x-5 bg-white/80 px-4 py-4 backdrop-blur md:px-16 md:py-5 lg:px-32">
      
      <div className=''>
        <Link
          className='text-lg font-extrabold hover:text-black md:text-xl mr-3'
          href='/blog'
        >
          HKD Blog
        </Link>
        <Link
          className='text-lg text-gray-600 md:text-xl'
          href='/'
        >
          Home
        </Link>
      </div>
      <PageSelection menuItems={menuItems} />
      {/* <FloatingNavbar /> */}
    </div>
  );
}
