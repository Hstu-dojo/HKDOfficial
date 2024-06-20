"use server";
import cloudinary from "@/utils/cloudinary";
import { revalidatePath } from "next/cache";

export async function AddImageToFav(public_id: string) {
  await cloudinary.v2.uploader.add_tag("favorite", [public_id]);
  revalidatePath("/admin/gallery");
}
export async function RmvFromFav(public_id: string | any) {
  await cloudinary.v2.uploader.remove_tag("favorite", [public_id]);
  revalidatePath("/admin/gallery");
}
export async function AddMultipleImagesToFav(public_id: string[]) {
  await cloudinary.v2.uploader.add_tag("favorite", public_id);
  revalidatePath("/admin/gallery");
}
