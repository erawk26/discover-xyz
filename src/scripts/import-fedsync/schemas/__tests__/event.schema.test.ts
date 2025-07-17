/**
 * Event Schema Tests
 * 
 * TDD: Writing tests BEFORE implementation
 */

import { describe, it, expect } from 'vitest'
import { EventSchema, EventDateSchema, TransformedEventSchema } from '../event.schema'
import type { Listing, EventDate } from '../../types/fedsync.types'

describe('EventSchema', () => {
  describe('EventDate Validation', () => {
    it('should validate a valid event date', () => {
      const validEventDate: EventDate = {
        name: 'Opening Night',
        start_date: '2024-01-15',
        end_date: '2024-01-15',
        weekdays: 'Monday',
        start_time: '18:00:00',
        end_time: '21:00:00',
        all_day: 0,
        times_text: '6:00 PM - 9:00 PM',
        calendar: [
          {
            title: 'Opening Night',
            start: '2024-01-15T18:00:00',
            end: '2024-01-15T21:00:00',
            allDay: 0,
          }
        ],
      }
      
      const result = EventDateSchema.safeParse(validEventDate)
      expect(result.success).toBe(true)
    })

    it('should validate an all-day event', () => {
      const allDayEvent: EventDate = {
        name: 'Festival Day',
        start_date: '2024-01-20',
        end_date: '2024-01-20',
        weekdays: 'Saturday',
        start_time: null,
        end_time: null,
        all_day: 1,
        times_text: 'All Day',
        calendar: [],
      }
      
      const result = EventDateSchema.safeParse(allDayEvent)
      expect(result.success).toBe(true)
    })

    it('should validate multi-day event', () => {
      const multiDayEvent: EventDate = {
        name: 'Weekend Festival',
        start_date: '2024-01-20',
        end_date: '2024-01-22',
        weekdays: 'Saturday, Sunday, Monday',
        start_time: '10:00:00',
        end_time: '22:00:00',
        all_day: 0,
        times_text: '10:00 AM - 10:00 PM',
        calendar: [],
      }
      
      const result = EventDateSchema.safeParse(multiDayEvent)
      expect(result.success).toBe(true)
    })

    it('should reject event date without required fields', () => {
      const invalidDate = {
        name: 'Test Event',
        // Missing start_date
      }
      
      const result = EventDateSchema.safeParse(invalidDate)
      expect(result.success).toBe(false)
    })

    it('should coerce all_day to boolean', () => {
      const eventWithNumericAllDay = {
        name: 'Test Event',
        start_date: '2024-01-20',
        end_date: '2024-01-20',
        weekdays: 'Saturday',
        start_time: null,
        end_time: null,
        all_day: 1,
        times_text: 'All Day',
        calendar: [],
      }
      
      const result = EventDateSchema.safeParse(eventWithNumericAllDay)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.all_day).toBe(true)
      }
    })
  })

  describe('FedSync Event Validation', () => {
    const createValidEvent = (): Partial<Listing> => ({
      schema: 'event',
      id: 1024,
      external_id: 1024,
      tracking_id: 'EVT-1024',
      type: 'event',
      name: 'Art Exhibition Opening',
      name_sort: 'art exhibition opening',
      latitude: 40.7128,
      longitude: -74.0060,
      address: {
        line_1: '123 Art Street',
        line_2: '',
        city: 'New York',
        state: 'NY',
        postcode: '10001',
      },
      event_dates: [
        {
          name: 'Opening Night',
          start_date: '2024-01-15',
          end_date: '2024-01-15',
          weekdays: 'Monday',
          start_time: '18:00:00',
          end_time: '21:00:00',
          all_day: 0,
          times_text: '6:00 PM - 9:00 PM',
          calendar: [],
        }
      ],
      email_addresses: {
        business: 'info@artgallery.com',
        booking: 'tickets@artgallery.com',
      },
      phone_numbers: {
        local: '212-555-0100',
        alt: '',
        fax: '',
        free_us: '',
        free_world: '',
      },
      websites: {
        business: 'https://artgallery.com',
        booking: 'https://artgallery.com/tickets',
        meetings: '',
        mobile: '',
      },
      socials: {
        facebook: 'artgallerynyc',
        twitter: 'artgallerynyc',
        instagram: 'artgallerynyc',
        youtube: '',
        pinterest: '',
        tripadvisor: '',
        tiktok: '',
      },
      venue_name: 'NYC Art Gallery',
      hours: [],
      hours_text: '',
      rates: [],
      cities_served: [],
      amenities: [],
      products: [],
      photos: [],
      custom: {},
      external_data: { tripadvisor: [] },
      published_city_id: 1,
      published_under: {
        name: 'New York',
        county: 'New York County',
        region: 'NY',
        latitude: '40.7128',
        longitude: '-74.0060',
      },
      geography: null,
      account_id: 1,
      last_publish_utc: '2024-01-01T00:00:00Z',
    })

    it('should validate a complete valid event', () => {
      const validEvent = createValidEvent()
      
      const result = EventSchema.safeParse(validEvent)
      expect(result.success).toBe(true)
    })

    it('should require type to be "event"', () => {
      const invalidEvent = {
        ...createValidEvent(),
        type: 'profile' as const,
      }
      
      const result = EventSchema.safeParse(invalidEvent)
      expect(result.success).toBe(false)
    })

    it('should require at least one event date', () => {
      const eventWithoutDates = {
        ...createValidEvent(),
        event_dates: [],
      }
      
      const result = EventSchema.safeParse(eventWithoutDates)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('at least 1')
      }
    })

    it('should validate event with minimal required fields', () => {
      const minimalEvent = {
        type: 'event',
        name: 'Test Event',
        event_dates: [
          {
            name: 'Event Date',
            start_date: '2024-01-15',
            end_date: '2024-01-15',
            weekdays: '',
            start_time: null,
            end_time: null,
            all_day: 1,
            times_text: '',
            calendar: [],
          }
        ],
        address: {
          line_1: '',
          line_2: '',
          city: 'Test City',
          state: 'TS',
          postcode: '',
        },
        email_addresses: {
          business: '',
          booking: '',
        },
        phone_numbers: {
          local: '',
          alt: '',
          fax: '',
          free_us: '',
          free_world: '',
        },
        websites: {
          business: '',
          booking: '',
          meetings: '',
          mobile: '',
        },
        socials: {
          facebook: '',
          twitter: '',
          instagram: '',
          youtube: '',
          pinterest: '',
          tripadvisor: '',
          tiktok: '',
        },
      }
      
      const result = EventSchema.safeParse(minimalEvent)
      expect(result.success).toBe(true)
    })

    it('should handle optional fields correctly', () => {
      const eventWithOptionals = {
        ...createValidEvent(),
        external_id: null,
        tracking_id: null,
        latitude: null,
        longitude: null,
      }
      
      const result = EventSchema.safeParse(eventWithOptionals)
      expect(result.success).toBe(true)
    })
  })

  describe('Transformed Event Schema', () => {
    it('should validate a transformed event for Payload', () => {
      const transformedEvent = {
        title: 'Art Exhibition Opening',
        externalId: 1024,
        trackingId: 'EVT-1024',
        description: [
          {
            children: [{ text: 'Join us for the opening night of our latest exhibition.' }]
          }
        ],
        location: [-74.0060, 40.7128],
        venueName: 'NYC Art Gallery',
        address: {
          line1: '123 Art Street',
          line2: '',
          city: 'New York',
          state: 'NY',
          postcode: '10001',
        },
        eventDates: [
          {
            name: 'Opening Night',
            startDate: '2024-01-15',
            endDate: '2024-01-15',
            startTime: '18:00:00',
            endTime: '21:00:00',
            allDay: false,
            timesText: '6:00 PM - 9:00 PM',
          }
        ],
        emailAddresses: {
          business: 'info@artgallery.com',
          booking: 'tickets@artgallery.com',
        },
        phoneNumbers: {
          local: '212-555-0100',
          alt: '',
          fax: '',
          freeUS: '',
          freeWorld: '',
        },
        websites: {
          business: 'https://artgallery.com',
          booking: 'https://artgallery.com/tickets',
        },
        socials: {
          facebook: 'artgallerynyc',
          twitter: 'artgallerynyc',
          instagram: 'artgallerynyc',
          youtube: '',
          pinterest: '',
        },
        categories: [],
        listingData: {},
        syncedAt: '2024-01-01T00:00:00Z',
        syncSource: 'federator-api',
        status: 'published',
        publishedAt: '2024-01-01T00:00:00Z',
      }
      
      const result = TransformedEventSchema.safeParse(transformedEvent)
      expect(result.success).toBe(true)
    })

    it('should require title field', () => {
      const eventWithoutTitle = {
        externalId: 1024,
        trackingId: 'EVT-1024',
        eventDates: [],
        address: {
          line1: '',
          line2: '',
          city: 'Test',
          state: 'TS',
          postcode: '',
        },
        // Missing title
      }
      
      const result = TransformedEventSchema.safeParse(eventWithoutTitle)
      expect(result.success).toBe(false)
    })

    it('should validate location as tuple of [longitude, latitude]', () => {
      const eventWithLocation = {
        title: 'Test Event',
        externalId: 1,
        trackingId: 'TEST-1',
        location: [-74.0060, 40.7128], // [lng, lat]
        eventDates: [],
        address: {
          line1: '',
          line2: '',
          city: 'Test',
          state: 'TS',
          postcode: '',
        },
        emailAddresses: { business: '', booking: '' },
        phoneNumbers: { local: '', alt: '', fax: '', freeUS: '', freeWorld: '' },
        websites: { business: '', booking: '' },
        socials: { facebook: '', twitter: '', instagram: '', youtube: '', pinterest: '' },
        syncedAt: new Date().toISOString(),
        syncSource: 'federator-api',
        status: 'published',
        publishedAt: new Date().toISOString(),
      }
      
      const result = TransformedEventSchema.safeParse(eventWithLocation)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.location).toHaveLength(2)
        expect(result.data.location?.[0]).toBe(-74.0060) // longitude
        expect(result.data.location?.[1]).toBe(40.7128)  // latitude
      }
    })

    it('should validate status enum values', () => {
      const draftEvent = {
        ...createMinimalTransformedEvent(),
        status: 'draft',
      }
      
      const result = TransformedEventSchema.safeParse(draftEvent)
      expect(result.success).toBe(true)
      
      const invalidStatus = {
        ...createMinimalTransformedEvent(),
        status: 'invalid-status',
      }
      
      const invalidResult = TransformedEventSchema.safeParse(invalidStatus)
      expect(invalidResult.success).toBe(false)
    })
  })
})

// Helper function for creating minimal transformed events
function createMinimalTransformedEvent() {
  return {
    title: 'Test Event',
    externalId: 1,
    trackingId: 'TEST-1',
    eventDates: [],
    address: {
      line1: '',
      line2: '',
      city: 'Test',
      state: 'TS',
      postcode: '',
    },
    emailAddresses: { business: '', booking: '' },
    phoneNumbers: { local: '', alt: '', fax: '', freeUS: '', freeWorld: '' },
    websites: { business: '', booking: '' },
    socials: { facebook: '', twitter: '', instagram: '', youtube: '', pinterest: '' },
    syncedAt: new Date().toISOString(),
    syncSource: 'federator-api',
    status: 'published',
    publishedAt: new Date().toISOString(),
  }
}