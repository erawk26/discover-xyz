/**
 * Event Transformer
 * 
 * Transforms FedSync event data to Payload CMS format
 */

import { isEvent } from '../types/fedsync.types'
import { TransformedEventSchema } from '../schemas/event.schema'
import type { Listing, TransformedEvent } from '../types/fedsync.types'

export class EventTransformer {
  constructor(
    private categoryMap: Map<number, string>
  ) {}

  /**
   * Transform FedSync event to Payload format
   */
  transform(source: Listing): TransformedEvent {
    // Validate this is an event
    if (!isEvent(source)) {
      throw new Error(`Expected event type, got ${source.type}`)
    }

    // Extract description from products
    const description = source.products?.[0]?.description?.text

    // Transform event dates
    const eventDates = source.event_dates.map(date => ({
      name: date.name,
      startDate: date.start_date,
      endDate: date.end_date,
      startTime: date.start_time,
      endTime: date.end_time,
      allDay: Boolean(date.all_day),
      timesText: date.times_text || '',
    }))

    // Resolve category IDs to names
    const categories: string[] = []
    if (source.products?.[0]?.categories) {
      for (const cat of source.products[0].categories) {
        const categoryName = this.categoryMap.get(cat.category_id)
        if (categoryName) {
          categories.push(categoryName)
        }
      }
    }

    const transformed: TransformedEvent = {
      title: source.name,
      externalId: source.external_id || 0,
      trackingId: source.tracking_id || '',
      ...(description && {
        description: [{
          children: [{ text: description }]
        }]
      }),
      
      // Location as [longitude, latitude]
      ...(source.latitude && source.longitude && {
        location: [source.longitude, source.latitude]
      }),
      
      venueName: source.venue_name,
      
      // Address
      address: {
        line1: source.address.line_1 || '',
        line2: source.address.line_2 || '',
        city: source.address.city,
        state: source.address.state,
        postcode: source.address.postcode || '',
      },
      
      // Event dates
      eventDates,
      
      // Contact info
      emailAddresses: {
        business: source.email_addresses.business,
        booking: source.email_addresses.booking,
      },
      
      phoneNumbers: {
        local: source.phone_numbers.local,
        alt: source.phone_numbers.alt,
        fax: source.phone_numbers.fax,
        freeUS: source.phone_numbers.free_us,
        freeWorld: source.phone_numbers.free_world,
      },
      
      websites: {
        business: source.websites.business,
        booking: source.websites.booking || '',
      },
      
      socials: {
        facebook: source.socials.facebook,
        twitter: source.socials.twitter,
        instagram: source.socials.instagram,
        youtube: source.socials.youtube,
        pinterest: source.socials.pinterest || '',
      },
      
      // Categories
      categories,
      
      // Metadata
      listingData: source,
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
    const result = TransformedEventSchema.safeParse(data)
    return result.success
  }
}