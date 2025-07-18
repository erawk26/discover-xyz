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
    {
      name: 'type',
      type: 'select',
      required: true,
      defaultValue: 'category',
      options: [
        {
          label: 'Group (Parent Category)',
          value: 'group',
        },
        {
          label: 'Category',
          value: 'category',
        },
      ],
    },
    {
      name: 'parent',
      type: 'relationship',
      relationTo: 'categories',
      filterOptions: {
        type: { equals: 'group' }, // Only allow groups as parents
      },
      admin: {
        description: 'Select the parent group for this category',
      },
    },
    {
      name: 'externalId',
      type: 'text',
      admin: {
        description: 'FedSync category ID for sync purposes',
      },
      index: true,
    },
    ...slugField(),
  ],
}
