/**
 * FedSync Import Type Definitions
 * 
 * This file only contains types specific to the import process.
 * All FedSync data types are imported from the FedSync library.
 */

import type {
  Listing,
  Address,
  EmailAddresses,
  PhoneNumbers,
  Websites,
  Socials,
  Photo,
  Category,
  CategoryGroup,
  Amenity,
  Product,
  EventDate,
  EnrichedListing,
  FederatorResponse
} from '../../../lib/fedsync'

// Re-export commonly used FedSync types for convenience
export type {
  Listing,
  Address,
  EmailAddresses,
  PhoneNumbers,
  Websites,
  Socials,
  Photo,
  Category,
  CategoryGroup,
  Amenity,
  Product,
  EventDate,
  EnrichedListing
}

// Type guards from FedSync
import { isEvent, isProfile } from '../../../lib/fedsync/dist/api-types'
export { isEvent, isProfile }

// FedSync uses a unified Listing type with a discriminator field
// Events have type: 'event'
// Profiles have type: 'profile'
// Deals have type: 'deal'
export type FedSyncEvent = Extract<Listing, { type: 'event' }>
export type FedSyncProfile = Extract<Listing, { type: 'profile' }>
export type FedSyncDeal = Extract<Listing, { type: 'deal' }>

// Extended CategoryGroup with nested categories
export interface ExtendedCategoryGroup extends CategoryGroup {
  categories?: Category[]
}

// Categories file structure (specific to our import process)
export interface CategoriesFile {
  categories: ExtendedCategoryGroup[]
}

// Extended types for fields that exist in data but not in FedSync types
export interface MeetingFacilities {
  total_sq_ft: number | null
  num_mtg_rooms: number | null
  largest_room: number | null
  ceiling_ht: number | null
}

// Extended listing types with additional fields found in actual data
export interface ExtendedProfile extends Listing {
  meeting_facilities?: MeetingFacilities
  meeting_rooms?: any[]
  num_of_rooms?: number | null
  num_of_suites?: number | null
}

// Transformed types for Payload CMS (specific to our import process)
export interface TransformedEvent {
  title: string
  externalId: number
  trackingId: string
  description?: any
  location?: [number, number]
  venueName?: string
  address: {
    line1: string
    line2: string
    city: string
    state: string
    postcode: string
  }
  eventDates: Array<{
    name: string
    startDate: string
    endDate: string | null
    startTime: string | null
    endTime: string | null
    allDay: boolean
    timesText: string
  }>
  emailAddresses: {
    business: string
    booking: string
  }
  phoneNumbers: {
    local: string
    alt: string
    fax: string
    freeUS: string
    freeWorld: string
  }
  websites: {
    business: string
    booking: string
  }
  socials: {
    facebook: string
    twitter: string
    instagram: string
    youtube: string
    pinterest: string
  }
  categories: string[]
  listingData: any
  syncedAt: string
  syncSource: string
  status: string
  publishedAt: string
}

export interface TransformedProfile {
  title: string
  sortName: string
  externalId: number
  trackingId: string
  type: string
  description?: any
  location?: [number, number]
  address: {
    line1: string
    line2: string
    city: string
    state: string
    postcode: string
  }
  emailAddresses: {
    business: string
    booking: string
  }
  phoneNumbers: {
    local: string
    alt: string
    fax: string
    freeUS: string
    freeWorld: string
  }
  websites: {
    business: string
    booking: string
    meetings: string
    mobile: string
  }
  socials: {
    facebook: string
    twitter: string
    instagram: string
    youtube: string
    pinterest: string
    tripadvisor: string
  }
  hours: Array<{
    day: string
    open: string
    close: string
  }>
  hoursText: string
  amenities: string[]
  categories: string[]
  photos: Array<{
    url: string
    caption: string
    altText: string
    externalId: number
  }>
  rates: Array<{
    type: string
    amount: string
    description: string
  }>
  roomsInfo?: {
    numOfRooms: number | null
    numOfSuites: number | null
  }
  meetingFacilities?: {
    totalSqFt: number | null
    numMtgRooms: number | null
    largestRoom: number | null
    ceilingHt: number | null
  }
  citiesServed: string[]
  listingData: any
  syncedAt: string
  syncSource: string
  status: string
  publishedAt: string
}