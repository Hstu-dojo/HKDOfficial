"use server";
import cloudinary from "@/utils/cloudinary";
import { revalidatePath } from "next/cache";

export async function AddImageToFav(
  public_id: string,
  isFavourite: boolean,
  path?: string,
) {
  isFavourite
    ? await cloudinary.v2.uploader.remove_tag("favorite", [public_id])
    : await cloudinary.v2.uploader.add_tag("favorite", [public_id]);
  await new Promise((resolve) => setTimeout(resolve, 1000));
  revalidatePath(path as string);
}

export async function AddMultipleImagesToFav(public_id: string[]) {
  await cloudinary.v2.uploader.add_tag("favorite", public_id);
  revalidatePath("/admin/gallery");
}
