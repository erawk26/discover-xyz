import type { GroupField } from 'payload'

export const locationField = (overrides?: Partial<GroupField>): GroupField => ({
  name: 'location',
  type: 'group',
  label: 'GPS Coordinates',
  fields: [
    {
      name: 'lat',
      type: 'number',
      label: 'Latitude',
      min: -90,
      max: 90,
    },
    {
      name: 'lng',
      type: 'number', 
      label: 'Longitude',
      min: -180,
      max: 180,
    },
  ],
  ...overrides,
})