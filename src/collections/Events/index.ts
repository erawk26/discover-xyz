import type { CollectionConfig } from 'payload'
import { authenticatedOrPublished } from '@/access/authenticatedOrPublished'
import { slugField } from '@/fields/slug'
import { populatePublishedAt } from '@/hooks/populatePublishedAt'
import { revalidateEvent } from './hooks/revalidateEvent'

export const Events: CollectionConfig = {
  slug: 'events',
  access: {
    create: authenticatedOrPublished,
    delete: authenticatedOrPublished,
    read: authenticatedOrPublished,
    update: authenticatedOrPublished,
  },
  admin: {
    defaultColumns: ['title', 'startDate', 'endDate', 'status', 'updatedAt'],
    livePreview: {
      url: ({ data }) => {
        const path = `/events/${data?.slug}${data?.slug !== data?.id ? `?draft=true` : ''}`
        return `${process.env.NEXT_PUBLIC_SERVER_URL}${path}`
      },
    },
    preview: (doc) => {
      const path = `/events/${doc?.slug}${doc?.slug !== doc?.id ? `?draft=true` : ''}`
      return `${process.env.NEXT_PUBLIC_SERVER_URL}${path}`
    },
    useAsTitle: 'title',
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
    },
    {
      name: 'externalId',
      type: 'number',
      label: 'External ID',
      admin: {
        description: 'ID from the federator API',
        position: 'sidebar',
      },
    },
    {
      name: 'trackingId',
      type: 'text',
      label: 'Tracking ID',
      admin: {
        position: 'sidebar',
      },
    },
    {
      type: 'tabs',
      tabs: [
        {
          label: 'Content',
          fields: [
            {
              name: 'description',
              type: 'richText',
              label: 'Description',
            },
            {
              name: 'eventDates',
              type: 'array',
              label: 'Event Dates',
              fields: [
                {
                  name: 'name',
                  type: 'text',
                  label: 'Date Range Name',
                },
                {
                  name: 'startDate',
                  type: 'date',
                  label: 'Start Date',
                  required: true,
                },
                {
                  name: 'endDate',
                  type: 'date',
                  label: 'End Date',
                },
                {
                  name: 'startTime',
                  type: 'text',
                  label: 'Start Time',
                },
                {
                  name: 'endTime',
                  type: 'text',
                  label: 'End Time',
                },
                {
                  name: 'allDay',
                  type: 'checkbox',
                  label: 'All Day Event',
                  defaultValue: false,
                },
                {
                  name: 'timesText',
                  type: 'text',
                  label: 'Times Description',
                },
              ],
            },
            {
              name: 'photos',
              type: 'array',
              label: 'Photos',
              fields: [
                {
                  name: 'photo',
                  type: 'upload',
                  relationTo: 'media',
                  required: true,
                },
                {
                  name: 'caption',
                  type: 'text',
                },
              ],
            },
          ],
        },
        {
          label: 'Location',
          fields: [
            {
              name: 'venueName',
              type: 'text',
              label: 'Venue Name',
            },
            {
              name: 'address',
              type: 'group',
              fields: [
                {
                  name: 'line1',
                  type: 'text',
                  label: 'Address Line 1',
                },
                {
                  name: 'line2',
                  type: 'text',
                  label: 'Address Line 2',
                },
                {
                  name: 'city',
                  type: 'text',
                  label: 'City',
                  required: true,
                },
                {
                  name: 'state',
                  type: 'text',
                  label: 'State',
                  defaultValue: 'SD',
                },
                {
                  name: 'postcode',
                  type: 'text',
                  label: 'ZIP Code',
                },
              ],
            },
            {
              name: 'location',
              type: 'point',
              label: 'GPS Coordinates',
            },
            {
              name: 'cities',
              type: 'relationship',
              relationTo: 'categories',
              hasMany: true,
              filterOptions: {
                type: { equals: 'city' },
              },
              admin: {
                description: 'Cities associated with this event',
              },
            },
            {
              name: 'regions',
              type: 'relationship',
              relationTo: 'categories',
              hasMany: true,
              filterOptions: {
                type: { equals: 'region' },
              },
              admin: {
                description: 'Regions associated with this event',
              },
            },
          ],
        },
        {
          label: 'Contact',
          fields: [
            {
              name: 'emailAddresses',
              type: 'group',
              fields: [
                {
                  name: 'business',
                  type: 'email',
                  label: 'Business Email',
                },
                {
                  name: 'booking',
                  type: 'email',
                  label: 'Booking Email',
                },
              ],
            },
            {
              name: 'phoneNumbers',
              type: 'group',
              fields: [
                {
                  name: 'local',
                  type: 'text',
                  label: 'Local Phone',
                },
                {
                  name: 'alt',
                  type: 'text',
                  label: 'Alternate Phone',
                },
                {
                  name: 'fax',
                  type: 'text',
                  label: 'Fax',
                },
                {
                  name: 'freeUS',
                  type: 'text',
                  label: 'Toll Free (US)',
                },
                {
                  name: 'freeWorld',
                  type: 'text',
                  label: 'Toll Free (International)',
                },
              ],
            },
            {
              name: 'websites',
              type: 'group',
              fields: [
                {
                  name: 'business',
                  type: 'text',
                  label: 'Business Website',
                },
                {
                  name: 'booking',
                  type: 'text',
                  label: 'Booking Website',
                },
              ],
            },
            {
              name: 'socials',
              type: 'group',
              fields: [
                {
                  name: 'facebook',
                  type: 'text',
                  label: 'Facebook',
                },
                {
                  name: 'twitter',
                  type: 'text',
                  label: 'Twitter',
                },
                {
                  name: 'instagram',
                  type: 'text',
                  label: 'Instagram',
                },
                {
                  name: 'youtube',
                  type: 'text',
                  label: 'YouTube',
                },
                {
                  name: 'pinterest',
                  type: 'text',
                  label: 'Pinterest',
                },
              ],
            },
          ],
        },
        {
          label: 'Metadata',
          fields: [
            {
              name: 'categories',
              type: 'relationship',
              relationTo: 'categories',
              hasMany: true,
              admin: {
                description: 'Event categories',
              },
            },
            {
              name: 'listingData',
              type: 'json',
              label: 'Original Listing Data',
              admin: {
                description: 'Raw data from the federator API',
                readOnly: true,
              },
            },
            {
              name: 'syncedAt',
              type: 'date',
              label: 'Last Synced',
              admin: {
                description: 'Last time this was synced from the API',
                readOnly: true,
              },
            },
            {
              name: 'syncSource',
              type: 'text',
              label: 'Sync Source',
              admin: {
                readOnly: true,
              },
            },
          ],
        },
      ],
    },
    ...slugField(),
    {
      name: 'publishedAt',
      type: 'date',
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'status',
      type: 'select',
      defaultValue: 'draft',
      options: [
        {
          label: 'Draft',
          value: 'draft',
        },
        {
          label: 'Published',
          value: 'published',
        },
        {
          label: 'Archived',
          value: 'archived',
        },
      ],
      admin: {
        position: 'sidebar',
      },
    },
  ],
  hooks: {
    afterChange: [revalidateEvent],
    beforeChange: [populatePublishedAt],
  },
  versions: {
    drafts: {
      autosave: {
        interval: 100,
      },
    },
    maxPerDoc: 50,
  },
}