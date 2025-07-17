import type { CollectionConfig } from 'payload'
import { authenticatedOrPublished } from '@/access/authenticatedOrPublished'
import { slugField } from '@/fields/slug'
import { populatePublishedAt } from '@/hooks/populatePublishedAt'
import { revalidateProfile } from './hooks/revalidateProfile'

export const Profiles: CollectionConfig = {
  slug: 'profiles',
  access: {
    create: authenticatedOrPublished,
    delete: authenticatedOrPublished,
    read: authenticatedOrPublished,
    update: authenticatedOrPublished,
  },
  admin: {
    defaultColumns: ['title', 'type', 'city', 'status', 'updatedAt'],
    livePreview: {
      url: ({ data }) => {
        const path = `/profiles/${data?.slug}${data?.slug !== data?.id ? `?draft=true` : ''}`
        return `${process.env.NEXT_PUBLIC_SERVER_URL}${path}`
      },
    },
    preview: (doc) => {
      const path = `/profiles/${doc?.slug}${doc?.slug !== doc?.id ? `?draft=true` : ''}`
      return `${process.env.NEXT_PUBLIC_SERVER_URL}${path}`
    },
    useAsTitle: 'title',
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
      label: 'Business Name',
    },
    {
      name: 'sortName',
      type: 'text',
      label: 'Sort Name',
      admin: {
        description: 'Name used for alphabetical sorting',
      },
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
                {
                  name: 'altText',
                  type: 'text',
                  label: 'Alt Text',
                },
              ],
            },
            {
              name: 'videos',
              type: 'array',
              label: 'Videos',
              fields: [
                {
                  name: 'url',
                  type: 'text',
                  label: 'Video URL',
                  required: true,
                },
                {
                  name: 'title',
                  type: 'text',
                },
                {
                  name: 'description',
                  type: 'textarea',
                },
              ],
            },
          ],
        },
        {
          label: 'Location',
          fields: [
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
                description: 'Cities associated with this profile',
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
                description: 'Regions associated with this profile',
              },
            },
            {
              name: 'citiesServed',
              type: 'array',
              label: 'Cities Served',
              fields: [
                {
                  name: 'city',
                  type: 'text',
                },
              ],
            },
          ],
        },
        {
          label: 'Contact & Hours',
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
                {
                  name: 'meetings',
                  type: 'text',
                  label: 'Meetings Website',
                },
                {
                  name: 'mobile',
                  type: 'text',
                  label: 'Mobile Website',
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
                {
                  name: 'tripadvisor',
                  type: 'text',
                  label: 'TripAdvisor',
                },
              ],
            },
            {
              name: 'hours',
              type: 'array',
              label: 'Business Hours',
              fields: [
                {
                  name: 'day',
                  type: 'select',
                  options: [
                    'Monday',
                    'Tuesday',
                    'Wednesday',
                    'Thursday',
                    'Friday',
                    'Saturday',
                    'Sunday',
                  ],
                },
                {
                  name: 'open',
                  type: 'text',
                  label: 'Opening Time',
                },
                {
                  name: 'close',
                  type: 'text',
                  label: 'Closing Time',
                },
              ],
            },
            {
              name: 'hoursText',
              type: 'textarea',
              label: 'Hours Description',
              admin: {
                description: 'Additional information about hours',
              },
            },
          ],
        },
        {
          label: 'Amenities & Features',
          fields: [
            {
              name: 'amenities',
              type: 'relationship',
              relationTo: 'categories',
              hasMany: true,
              filterOptions: {
                type: { equals: 'amenity' },
              },
              admin: {
                description: 'Available amenities and features',
              },
            },
            {
              name: 'rates',
              type: 'array',
              label: 'Rate Information',
              fields: [
                {
                  name: 'type',
                  type: 'text',
                  label: 'Rate Type',
                },
                {
                  name: 'amount',
                  type: 'text',
                  label: 'Amount',
                },
                {
                  name: 'description',
                  type: 'text',
                },
              ],
            },
            {
              name: 'roomsInfo',
              type: 'group',
              label: 'Accommodation Info',
              fields: [
                {
                  name: 'numOfRooms',
                  type: 'number',
                  label: 'Number of Rooms',
                },
                {
                  name: 'numOfSuites',
                  type: 'number',
                  label: 'Number of Suites',
                },
              ],
            },
            {
              name: 'meetingFacilities',
              type: 'group',
              label: 'Meeting Facilities',
              fields: [
                {
                  name: 'totalSqFt',
                  type: 'number',
                  label: 'Total Square Feet',
                },
                {
                  name: 'numMtgRooms',
                  type: 'number',
                  label: 'Number of Meeting Rooms',
                },
                {
                  name: 'largestRoom',
                  type: 'number',
                  label: 'Largest Room (sq ft)',
                },
                {
                  name: 'ceilingHt',
                  type: 'number',
                  label: 'Ceiling Height (ft)',
                },
              ],
            },
          ],
        },
        {
          label: 'Metadata',
          fields: [
            {
              name: 'type',
              type: 'select',
              label: 'Business Type',
              defaultValue: 'listing',
              options: [
                {
                  label: 'General Listing',
                  value: 'listing',
                },
                {
                  label: 'Accommodation',
                  value: 'accommodation',
                },
                {
                  label: 'Restaurant',
                  value: 'restaurant',
                },
                {
                  label: 'Attraction',
                  value: 'attraction',
                },
                {
                  label: 'Activity',
                  value: 'activity',
                },
                {
                  label: 'Shopping',
                  value: 'shopping',
                },
                {
                  label: 'Service',
                  value: 'service',
                },
              ],
            },
            {
              name: 'categories',
              type: 'relationship',
              relationTo: 'categories',
              hasMany: true,
              admin: {
                description: 'Business categories',
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
    afterChange: [revalidateProfile],
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