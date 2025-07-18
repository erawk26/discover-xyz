/**
 * Profile Transformer
 *
 * Transforms FedSync profile/business listing data to Payload CMS format
 */

import { TransformedProfileSchema } from '../schemas/profile.schema'
import type { Listing, ExtendedProfile, TransformedProfile } from '../types/fedsync.types'

export class ProfileTransformer {
  constructor(
    private categoryMap: Map<number, string>,
    private amenityMap: Map<number, string>,
  ) {}

  /**
   * Transform FedSync profile to Payload format
   */
  transform(source: Listing | ExtendedProfile): TransformedProfile {
    // Validate this is a profile/listing (FedSync uses "listing" as generic type)
    const validTypes = [
      'profile',
      'accommodation',
      'restaurant',
      'attraction',
      'activity',
      'shopping',
      'service',
      'listing',
    ]
    if (!validTypes.includes(source.type)) {
      throw new Error(`Expected profile or listing type, got ${source.type}`)
    }

    // Cast to ExtendedProfile to access profile-specific fields
    const profile = source as ExtendedProfile

    // Extract description from products
    const description = profile.products?.[0]?.description?.text

    // TODO: Handle photos properly - they need to be Media collection references
    // For now, skip photos to avoid validation errors
    const photos: any[] = []

    // Transform hours - normalize day names
    const hours =
      profile.hours?.map((h) => ({
        day: this.normalizeDayName(h.dayOfWeek),
        open: h.openAt,
        close: h.closeAt,
      })) || []

    // Transform rates
    const rates =
      profile.rates?.map((r) => ({
        type: r.name,
        amount: r.value,
        description: r.name, // Use name as description
      })) || []

    // TODO: Handle categories as relationship IDs to categories collection
    // For now, skip to avoid validation errors
    const categories: any[] = []

    // TODO: Handle amenities as relationship IDs to categories collection
    // For now, skip to avoid validation errors
    const amenities: any[] = []

    const transformed: TransformedProfile = {
      title: profile.name,
      sortName: profile.name_sort || '',
      externalId: profile.external_id || 0,
      trackingId: profile.tracking_id || '',
      type: profile.type || 'profile',
      ...(description && {
        description: {
          root: {
            type: 'root',
            format: '',
            indent: 0,
            version: 1,
            children: [{
              type: 'paragraph',
              format: '',
              indent: 0,
              version: 1,
              children: [{
                type: 'text',
                format: 0,
                text: description,
                mode: 'normal',
                style: '',
                detail: 0,
                version: 1
              }],
              direction: 'ltr'
            }],
            direction: 'ltr'
          }
        }
      }),

      // Location as [longitude, latitude]
      ...(profile.latitude &&
        profile.longitude && {
          location: [profile.longitude, profile.latitude],
        }),

      // Address
      address: {
        line1: profile.address.line_1 || '',
        line2: profile.address.line_2 || '',
        city: profile.address.city,
        state: profile.address.state,
        postcode: profile.address.postcode || '',
      },

      // Contact info - clean email addresses
      emailAddresses: {
        business: this.cleanEmail(profile.email_addresses.business),
        booking: this.cleanEmail(profile.email_addresses.booking),
      },

      phoneNumbers: {
        local: profile.phone_numbers.local,
        alt: profile.phone_numbers.alt,
        fax: profile.phone_numbers.fax,
        freeUS: profile.phone_numbers.free_us,
        freeWorld: profile.phone_numbers.free_world,
      },

      websites: {
        business: profile.websites.business,
        booking: profile.websites.booking || '',
        meetings: profile.websites.meetings || '',
        mobile: profile.websites.mobile || '',
      },

      socials: {
        facebook: profile.socials.facebook,
        twitter: profile.socials.twitter,
        instagram: profile.socials.instagram,
        youtube: profile.socials.youtube,
        pinterest: profile.socials.pinterest || '',
        tripadvisor: profile.socials.tripadvisor,
      },

      // Business info
      hours,
      hoursText: profile.hours_text || '',
      photos,
      rates,
      citiesServed: profile.cities_served || [],

      // Meeting facilities
      ...(profile.meeting_facilities?.total_sq_ft && {
        meetingFacilities: {
          totalSqFt: profile.meeting_facilities.total_sq_ft,
          numMtgRooms: profile.meeting_facilities.num_mtg_rooms,
          largestRoom: profile.meeting_facilities.largest_room,
          ceilingHt: profile.meeting_facilities.ceiling_ht,
        },
      }),

      // Rooms info
      ...(profile.num_of_rooms && {
        roomsInfo: {
          numOfRooms: profile.num_of_rooms,
          numOfSuites: profile.num_of_suites || null,
        },
      }),

      // Categories & Amenities
      categories,
      amenities,

      // Metadata
      listingData: profile,
      syncedAt: new Date().toISOString(),
      syncSource: 'federator-api',
      status: 'published',
      publishedAt: new Date().toISOString(),
    }

    return transformed
  }

  /**
   * Clean email address by removing invisible unicode characters
   */
  private cleanEmail(email: string): string {
    if (!email) return ''
    
    // Remove zero-width spaces and other invisible characters
    return email
      .replace(/[\u200B-\u200D\uFEFF]/g, '') // Zero-width spaces
      .replace(/[\u00AD]/g, '') // Soft hyphens
      .trim()
  }

  /**
   * Normalize day names from FedSync format to Payload format
   */
  private normalizeDayName(dayOfWeek: string): string {
    if (!dayOfWeek) return ''
    
    const dayMap: Record<string, string> = {
      'mon': 'Monday',
      'tue': 'Tuesday', 
      'wed': 'Wednesday',
      'thu': 'Thursday',
      'fri': 'Friday',
      'sat': 'Saturday',
      'sun': 'Sunday'
    }
    
    const normalized = dayMap[dayOfWeek.toLowerCase()]
    return normalized || dayOfWeek
  }

  /**
   * Validate transformed data
   */
  validateTransformed(data: any): boolean {
    const result = TransformedProfileSchema.safeParse(data)
    return result.success
  }
}
