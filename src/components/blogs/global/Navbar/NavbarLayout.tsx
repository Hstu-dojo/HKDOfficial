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
    <div className="sticky justify-between top-0 z-10 flex w-full flex-wrap items-center gap-x-5 border-b border-border bg-background/95 px-4 py-4 backdrop-blur md:px-8 md:py-5 lg:px-10">

      <div className=''>
        <Link
          className='font-serif text-xl font-normal hover:text-primary md:text-2xl mr-4'
          href='/blog'
        >
          Kaizen Blog
        </Link>
        <Link
          className='text-lg text-muted-foreground md:text-xl'
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
