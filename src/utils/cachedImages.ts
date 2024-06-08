import cloudinary from "./cloudinary";

let cachedResults: any;

export default async function getResults() {
  if (!cachedResults) {
    const fetchedResults = await cloudinary.v2.search
      .expression(`folder:${process.env.CLOUDINARY_FOLDER}/*`)
      .sort_by("public_id", "desc")
      .max_results(400)
      .execute();

    cachedResults = fetchedResults;
  }

  // const cloudinaryFolder =  cloudinary.v2.api.create_folder
  return cachedResults;
}
