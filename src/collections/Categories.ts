import type { CollectionConfig } from 'payload'

import { taxonomyAccess, taxonomyReadAccess } from '../access/taxonomyAccess'
import { slugField } from '@/fields/slug'

export const Categories: CollectionConfig = {
  slug: 'categories',
  access: {
    create: taxonomyAccess,
    delete: taxonomyAccess,
    read: taxonomyReadAccess,
    update: taxonomyAccess,
  },
  admin: {
    useAsTitle: 'title',
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
    },
    ...slugField(),
  ],
}
