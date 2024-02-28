import { ProjectsIcon, ImageIcon } from "@sanity/icons";
import { defineArrayMember, defineField, defineType } from "sanity";

export default defineType({
  name: "project",
  title: "Posts",
  type: "document",
  icon: ProjectsIcon,
  // Uncomment below to have edits publish automatically as you type
  // liveEdit: true,
  fields: [
    defineField({
      name: "title",
      description: "This field is the title of your project.",
      title: "Title",
      type: "string",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "slug",
      title: "Slug",
      type: "slug",
      options: {
        source: "title",
        maxLength: 96,
        isUnique: (
          value: any,
          context: { defaultIsUnique: (arg0: any, arg1: any) => any },
        ) => context.defaultIsUnique(value, context),
      },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "overview",
      description:
        "Used both for the <meta> description tag for SEO, and project subheader.",
      title: "Overview",
      type: "array",
      //@ts-ignore
      of: [
        // Paragraphs
        defineArrayMember({
          lists: [],
          marks: {
            annotations: [],
            decorators: [
              {
                title: "Italic",
                value: "em",
              },
              {
                title: "Strong",
                value: "strong",
              },
            ],
          },
          styles: [],
          type: "block",
        }),
      ],
      validation: (rule) => rule.max(155).required(),
    }),
    defineField({
      name: "author",
      title: "Author",
      description:
        "Select the name of Author who worked on the project. If the author is not listed, you can add them by clicking the 'Create' button.",
      options: {
      //@ts-ignore
        hotspot: true,
      },
      type: "reference",
      //@ts-ignore
      to: { type: "author" },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "coverImage",
      title: "Cover Image",
      description:
        "This image will be used as the cover image for the project. If you choose to add it to the show case projects, this is the image displayed in the list within the homepage.",
      type: "image",
      options: {
      //@ts-ignore
        hotspot: true,
      },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "duration",
      title: "Duration",
      type: "duration",
    }),
    defineField({
      name: "client",
      title: "Client",
      type: "string",
    }),
    defineField({
      name: "site",
      title: "Site",
      type: "url",
    }),
    defineField({
      name: "tags",
      title: "Tags",
      type: "array",
      //@ts-ignore
      of: [{ type: "string" }],
      options: {
        layout: "tags",
      },
    }),
    defineField({
      name: "categories",
      title: "Categories",
      type: "array",
      //@ts-ignore
      of: [{ type: "reference", to: { type: "category" } }],
    }),
    defineField({
      name: "description",
      title: "Project Description",
      type: "array",
      //@ts-ignore
      of: [
        defineArrayMember({
          type: "block",
          marks: {
            annotations: [
              {
                name: "link",
                type: "object",
                title: "Link",
                fields: [
                  {
                    name: "href",
                    type: "url",
                    title: "Url",
                  },
                ],
              },
            ],
          },
          styles: [],
        }),
        // Custom blocks
        defineArrayMember({
          name: "timeline",
          type: "timeline",
        }),
        defineField({
          type: "image",
          icon: ImageIcon,
          name: "image",
          title: "Image",
          options: {
      //@ts-ignore
            hotspot: true,
          },
          preview: {
            select: {
              imageUrl: "asset.url",
              title: "caption",
            },
          },
          fields: [
            defineField({
              title: "Caption",
              name: "caption",
              type: "string",
            }),
            defineField({
              name: "alt",
              type: "string",
              title: "Alt text",
              description:
                "Alternative text for screenreaders. Falls back on caption if not set",
            }),
          ],
        }),
      ],
    }),
  ],
});
