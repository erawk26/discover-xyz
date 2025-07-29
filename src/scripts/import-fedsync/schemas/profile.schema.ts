/**
 * Profile Schema Definitions
 * 
 * Zod schemas for validating profile/business listing data from FedSync
 */

import { z } from 'zod'

// Hours Schema
export const HoursSchema = z.object({
  dayOfWeek: z.string(),
  openAt: z.string(),
  closeAt: z.string(),
  allDay: z.boolean(),
})

// Rate Schema
export const RateSchema = z.object({
  name: z.string(),
  value: z.string(),
})

// Common schemas shared with events
const EmailAddressesSchema = z.object({
  business: z.string(),
  booking: z.string(),
})

const PhoneNumbersSchema = z.object({
  local: z.string(),
  alt: z.string(),
  fax: z.string(),
  free_us: z.string(),
  free_world: z.string(),
})

const WebsitesSchema = z.object({
  business: z.string(),
  booking: z.string(),
  meetings: z.string(),
  mobile: z.string(),
})

const SocialsSchema = z.object({
  facebook: z.string(),
  twitter: z.string(),
  instagram: z.string(),
  youtube: z.string(),
  pinterest: z.string(),
  tripadvisor: z.string(),
  tiktok: z.string(),
})

const AddressSchema = z.object({
  line_1: z.string(),
  line_2: z.string(),
  city: z.string(),
  state: z.string(),
  postcode: z.string(),
})

// Meeting Facilities Schema
const MeetingFacilitiesSchema = z.object({
  total_sq_ft: z.union([z.number(), z.null()]),
  num_mtg_rooms: z.union([z.number(), z.null()]),
  largest_room: z.union([z.number(), z.null()]),
  ceiling_ht: z.union([z.number(), z.null()]),
})

// FedSync Profile Schema
export const ProfileSchema = z.object({
  type: z.enum(['profile', 'accommodation', 'restaurant', 'attraction', 'activity', 'shopping', 'service']),
  name: z.string(),
  address: AddressSchema,
  email_addresses: EmailAddressesSchema,
  phone_numbers: PhoneNumbersSchema,
  websites: WebsitesSchema,
  socials: SocialsSchema,
  // Optional fields
  schema: z.string().optional(),
  id: z.number().optional(),
  external_id: z.union([z.number(), z.null()]).optional(),
  tracking_id: z.union([z.string(), z.null()]).optional(),
  name_sort: z.string().optional(),
  latitude: z.union([z.number(), z.null()]).optional(),
  longitude: z.union([z.number(), z.null()]).optional(),
  hours: z.array(HoursSchema).optional(),
  hours_text: z.string().optional(),
  rates: z.array(RateSchema).optional(),
  cities_served: z.array(z.string()).optional(),
  amenities: z.array(z.any()).optional(),
  products: z.array(z.any()).optional(),
  photos: z.array(z.any()).optional(),
  meeting_facilities: MeetingFacilitiesSchema.optional(),
  num_of_rooms: z.union([z.number(), z.null()]).optional(),
  num_of_suites: z.union([z.number(), z.null()]).optional(),
  venue_name: z.string().optional(),
  event_dates: z.array(z.any()).optional(),
  published_city_id: z.number().optional(),
  published_under: z.object({
    name: z.string(),
    county: z.string(),
    region: z.string(),
    latitude: z.string(),
    longitude: z.string(),
  }).optional(),
  geography: z.any().optional(),
  account_id: z.number().optional(),
  custom: z.record(z.string(), z.any()).optional(),
  external_data: z.object({ tripadvisor: z.array(z.any()) }).optional(),
  last_publish_utc: z.union([z.string(), z.null()]).optional(),
}).passthrough() // Allow additional fields from API

// Transformed Profile Schema for Payload CMS
export const TransformedProfileSchema = z.object({
  title: z.string(),
  sortName: z.string(),
  externalId: z.number(),
  trackingId: z.string(),
  type: z.string(),
  description: z.object({
    root: z.object({
      type: z.literal('root'),
      format: z.string(),
      indent: z.number(),
      version: z.number(),
      children: z.array(z.any()),
      direction: z.string(),
    })
  }).optional(),
  location: z.tuple([z.number(), z.number()]).optional(), // [longitude, latitude]
  address: z.object({
    line1: z.string(),
    line2: z.string(),
    city: z.string(),
    state: z.string(),
    postcode: z.string(),
  }),
  emailAddresses: z.object({
    business: z.string(),
    booking: z.string(),
  }),
  phoneNumbers: z.object({
    local: z.string(),
    alt: z.string(),
    fax: z.string(),
    freeUS: z.string(),
    freeWorld: z.string(),
  }),
  websites: z.object({
    business: z.string(),
    booking: z.string(),
    meetings: z.string(),
    mobile: z.string(),
  }),
  socials: z.object({
    facebook: z.string(),
    twitter: z.string(),
    instagram: z.string(),
    youtube: z.string(),
    pinterest: z.string(),
    tripadvisor: z.string(),
  }),
  hours: z.array(z.object({
    day: z.string(),
    open: z.string(),
    close: z.string(),
  })),
  hoursText: z.string(),
  amenities: z.array(z.string()),
  categories: z.array(z.string()),
  photos: z.array(z.object({
    url: z.string(),
    caption: z.string(),
    altText: z.string(),
    externalId: z.number(),
  })),
  rates: z.array(z.object({
    type: z.string(),
    amount: z.string(),
    description: z.string(),
  })),
  roomsInfo: z.object({
    numOfRooms: z.union([z.number(), z.null()]),
    numOfSuites: z.union([z.number(), z.null()]),
  }).optional(),
  meetingFacilities: z.object({
    totalSqFt: z.union([z.number(), z.null()]),
    numMtgRooms: z.union([z.number(), z.null()]),
    largestRoom: z.union([z.number(), z.null()]),
    ceilingHt: z.union([z.number(), z.null()]),
  }).optional(),
  citiesServed: z.array(z.string()),
  listingData: z.any(),
  syncedAt: z.string(),
  syncSource: z.string(),
  _status: z.enum(['published', 'draft']),
})

// Type exports
export type Hours = z.infer<typeof HoursSchema>
export type Rate = z.infer<typeof RateSchema>
export type FedSyncProfile = z.infer<typeof ProfileSchema>
export type TransformedProfile = z.infer<typeof TransformedProfileSchema>