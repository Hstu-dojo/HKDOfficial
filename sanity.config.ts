/**
 * This configuration is used to for the Sanity Studio that’s mounted on the `\src\app\studio\[[...index]]\page.tsx` route
 */

import { visionTool } from "@sanity/vision";
import { defineConfig } from "sanity";
import { structureTool } from "sanity/structure";
import { presentationTool } from "sanity/presentation";
import { deskTool } from "sanity/desk";
import { unsplashImageAsset } from "sanity-plugin-asset-source-unsplash";

// Go to https://www.sanity.io/docs/api-versioning to learn how API versioning works
import { apiVersion, dataset, projectId } from "./sanity/env";
import { locate } from "./sanity/presentation/locate";
import { schema } from "./sanity/schema";
import { pageStructure, singletonPlugin } from "./sanity/plugins/settings";
import page from "./sanity/schemas/documents/page";
import project from "./sanity/schemas/documents/project";
import category from "./sanity/schemas/documents/category";
import author from "./sanity/schemas/documents/author";
import duration from "./sanity/schemas/objects/duration";
import milestone from "./sanity/schemas/objects/milestone";
import timeline from "./sanity/schemas/objects/timeline";
import home from "./sanity/schemas/singletons/home";
import settings from "./sanity/schemas/singletons/settings";
export default defineConfig({
  basePath: "/studio",
  projectId,
  title: "HKD: Blog Studio",
  dataset,
  // Add and edit the content schema in the './sanity/schema' folder
  schema: {
    // If you want more content types, you can add them to this array
    types: [
      // Singletons
      home,
      settings,
      // Documents
      duration,
      author,
      category,
      project,
      page,
      // Objects
      milestone,
      timeline as any,
    ],
  },
  plugins: [
    // structureTool(),
    // Vision is a tool that lets you query your content with GROQ in the studio
    // https://www.sanity.io/docs/the-vision-plugin
    deskTool({
      structure: pageStructure([home, settings]),
    }),
    visionTool({ defaultApiVersion: apiVersion }),
    presentationTool({
      locate,
      previewUrl: {
        draftMode: {
          enable: "/api/draft",
        },
      },
    }),
    // Configures the global "new document" button, and document actions, to suit the Settings document singleton
    singletonPlugin([home.name, settings.name]),
    // Add an image asset source for Unsplash
    unsplashImageAsset(),
  ],
});
