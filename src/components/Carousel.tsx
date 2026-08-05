import Image from "next/image";
import { useRouter } from "next/router";
//@ts-ignore
import useKeypress from "react-use-keypress";
import type { ImageProps } from "../utils/types";
import { useLastViewedPhoto } from "../utils/useLastViewedPhoto";
import SharedModal from "./SharedModal";

export default function Carousel({
  index,
  currentPhoto,
  images,
}: {
  index: number;
  currentPhoto: ImageProps;
  images?: ImageProps[];
}) {
  const router = useRouter();
  const [, setLastViewedPhoto] = useLastViewedPhoto();

  function closeModal() {
    setLastViewedPhoto(currentPhoto?.id as any);
    router.push("/moments", undefined, { shallow: true });
  }

  function changePhotoId(newVal: number) {
    if (newVal === index) return;
    router.push(`/p/${newVal}`, undefined, { shallow: true });
  }

  useKeypress("Escape", () => {
    closeModal();
  });

  return (
    <div className="fixed inset-0 flex items-center justify-center">
      <button
        className="absolute inset-0 z-30 cursor-default bg-black backdrop-blur-2xl"
        onClick={closeModal}
      >
        <Image
          src={currentPhoto?.blurDataUrl as any}
          className="pointer-events-none h-full w-full"
          alt="blurred background"
          fill
          priority={true}
        />
      </button>
      <SharedModal
        index={index}
        images={images}
        changePhotoId={changePhotoId}
        currentPhoto={currentPhoto}
        closeModal={closeModal}
        navigation={!!images}
      />
    </div>
  );
}
