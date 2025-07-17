/**
 * Event Schema Definitions
 * 
 * Zod schemas for validating event data from FedSync
 */

import { z } from 'zod'

// Calendar Event Schema
export const CalendarEventSchema = z.object({
  title: z.string(),
  start: z.string(),
  end: z.union([z.string(), z.null()]),
  allDay: z.union([z.number(), z.boolean()]).transform(val => Boolean(val)),
})

// Event Date Schema
export const EventDateSchema = z.object({
  name: z.string(),
  start_date: z.string(),
  end_date: z.union([z.string(), z.null()]),
  weekdays: z.string(),
  start_time: z.union([z.string(), z.null()]),
  end_time: z.union([z.string(), z.null()]),
  all_day: z.union([z.number(), z.boolean()]).transform(val => Boolean(val)),
  times_text: z.string(),
  calendar: z.array(CalendarEventSchema),
})

// Common schemas for contact info
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

// FedSync Event Schema
export const EventSchema = z.object({
  type: z.literal('event'),
  name: z.string(),
  event_dates: z.array(EventDateSchema).min(1, { message: 'Event must have at least 1 date' }),
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
  venue_name: z.string().optional(),
  hours: z.array(z.any()).optional(),
  hours_text: z.string().optional(),
  rates: z.array(z.any()).optional(),
  cities_served: z.array(z.any()).optional(),
  amenities: z.array(z.any()).optional(),
  products: z.array(z.any()).optional(),
  photos: z.array(z.any()).optional(),
  custom: z.record(z.any()).optional(),
  external_data: z.object({ tripadvisor: z.array(z.any()) }).optional(),
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
  last_publish_utc: z.union([z.string(), z.null()]).optional(),
}).passthrough() // Allow additional fields from API

// Transformed Event Schema for Payload CMS
export const TransformedEventSchema = z.object({
  title: z.string(),
  externalId: z.number(),
  trackingId: z.string(),
  description: z.array(z.object({
    children: z.array(z.object({
      text: z.string()
    }))
  })).optional(),
  location: z.tuple([z.number(), z.number()]).optional(), // [longitude, latitude]
  venueName: z.string().optional(),
  address: z.object({
    line1: z.string(),
    line2: z.string(),
    city: z.string(),
    state: z.string(),
    postcode: z.string(),
  }),
  eventDates: z.array(z.object({
    name: z.string(),
    startDate: z.string(),
    endDate: z.union([z.string(), z.null()]),
    startTime: z.union([z.string(), z.null()]),
    endTime: z.union([z.string(), z.null()]),
    allDay: z.boolean(),
    timesText: z.string(),
  })),
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
  }),
  socials: z.object({
    facebook: z.string(),
    twitter: z.string(),
    instagram: z.string(),
    youtube: z.string(),
    pinterest: z.string(),
  }),
  categories: z.array(z.string()).optional(),
  listingData: z.any().optional(),
  syncedAt: z.string(),
  syncSource: z.string(),
  status: z.enum(['published', 'draft']),
  publishedAt: z.string(),
})

// Type exports
export type EventDate = z.infer<typeof EventDateSchema>
export type FedSyncEvent = z.infer<typeof EventSchema>
export type TransformedEvent = z.infer<typeof TransformedEventSchema>