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
    private categoryMap: Map<number, string> // TODO: Will be used for category relationships
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

    // TODO: Handle categories as relationship IDs to categories collection
    // For now, skip to avoid validation errors
    const categories: any[] = []

    const transformed: TransformedEvent = {
      title: source.name,
      externalId: source.external_id || 0,
      trackingId: source.tracking_id || '',
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
      
      // Contact info - clean email addresses to remove invisible characters
      emailAddresses: {
        business: this.cleanEmail(source.email_addresses.business),
        booking: this.cleanEmail(source.email_addresses.booking),
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
   * Validate transformed data
   */
  validateTransformed(data: any): boolean {
    const result = TransformedEventSchema.safeParse(data)
    return result.success
  }
}