import {defineField, defineType} from 'sanity'
import { TagsIcon } from "@sanity/icons";


export default defineType({
  name: 'category',
  title: 'Category',
  type: 'document',
  icon: TagsIcon,
  fields: [
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
    }),
    defineField({
      name: 'description',
      title: 'Description',
      type: 'text',
    }),
  ],
})
