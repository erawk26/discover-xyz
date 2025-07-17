/**
 * Profile Transformer
 * 
 * Transforms FedSync profile/business listing data to Payload CMS format
 */

import { isProfile } from '../types/fedsync.types'
import { TransformedProfileSchema } from '../schemas/profile.schema'
import type { Listing, ExtendedProfile, TransformedProfile } from '../types/fedsync.types'

export class ProfileTransformer {
  constructor(
    private categoryMap: Map<number, string>,
    private amenityMap: Map<number, string>
  ) {}

  /**
   * Transform FedSync profile to Payload format
   */
  transform(source: Listing | ExtendedProfile): TransformedProfile {
    // Validate this is a profile (not an event or deal)
    const profileTypes = ['profile', 'accommodation', 'restaurant', 'attraction', 'activity', 'shopping', 'service']
    if (!profileTypes.includes(source.type)) {
      throw new Error(`Expected profile type, got ${source.type}`)
    }

    // Cast to ExtendedProfile to access profile-specific fields
    const profile = source as ExtendedProfile

    // Extract description from products
    const description = profile.products?.[0]?.description?.text

    // Transform photos
    const photos = profile.products?.[0]?.photos?.map(photo => ({
      url: photo.properties?.cloudinary?.secure_url || photo.path,
      caption: photo.caption,
      altText: photo.alt_text || photo.caption,
      externalId: photo.id,
    })) || []

    // Transform hours
    const hours = profile.hours?.map(h => ({
      day: h.dayOfWeek,
      open: h.openAt,
      close: h.closeAt,
    })) || []

    // Transform rates
    const rates = profile.rates?.map(r => ({
      type: r.name,
      amount: r.value,
      description: r.name, // Use name as description
    })) || []

    // Resolve category IDs to names
    const categories: string[] = []
    if (profile.products?.[0]?.categories) {
      for (const cat of profile.products[0].categories) {
        const categoryName = this.categoryMap.get(cat.category_id)
        if (categoryName) {
          categories.push(categoryName)
        }
      }
    }

    // Resolve amenity IDs to names
    const amenities: string[] = []
    if (profile.amenities) {
      for (const amenity of profile.amenities) {
        const amenityName = this.amenityMap.get(amenity.amenity_id)
        if (amenityName) {
          amenities.push(amenityName)
        }
      }
    }

    const transformed: TransformedProfile = {
      title: profile.name,
      sortName: profile.name_sort || '',
      externalId: profile.external_id || 0,
      trackingId: profile.tracking_id || '',
      type: profile.type || 'profile',
      ...(description && {
        description: [{
          children: [{ text: description }]
        }]
      }),
      
      // Location as [longitude, latitude]
      ...(profile.latitude && profile.longitude && {
        location: [profile.longitude, profile.latitude]
      }),
      
      // Address
      address: {
        line1: profile.address.line_1 || '',
        line2: profile.address.line_2 || '',
        city: profile.address.city,
        state: profile.address.state,
        postcode: profile.address.postcode || '',
      },
      
      // Contact info
      emailAddresses: {
        business: profile.email_addresses.business,
        booking: profile.email_addresses.booking,
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
        }
      }),
      
      // Rooms info
      ...(profile.num_of_rooms && {
        roomsInfo: {
          numOfRooms: profile.num_of_rooms,
          numOfSuites: profile.num_of_suites || null,
        }
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
   * Validate transformed data
   */
  validateTransformed(data: any): boolean {
    const result = TransformedProfileSchema.safeParse(data)
    return result.success
  }
}