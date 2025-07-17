/**
 * Event Transformer Tests
 * 
 * TDD: Writing tests BEFORE implementation
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { EventTransformer } from '../event.transformer'
import type { Listing } from '../../types/fedsync.types'

describe('EventTransformer', () => {
  let transformer: EventTransformer
  let mockCategoryMap: Map<number, string>

  beforeEach(() => {
    // Mock category map for testing
    mockCategoryMap = new Map([
      [1, 'Art Gallery/Display'],
      [3, 'Museums'],
      [10, 'Festival'],
    ])
    transformer = new EventTransformer(mockCategoryMap)
  })

  describe('transform', () => {
    const createMockEvent = (): Listing => ({
      schema: 'event',
      type: 'event',
      id: 1024,
      external_id: 1024,
      tracking_id: 'EVT-1024',
      name: 'Art Exhibition Opening',
      name_sort: 'art exhibition opening',
      latitude: 40.7128,
      longitude: -74.0060,
      venue_name: 'NYC Art Gallery',
      address: {
        line_1: '123 Art Street',
        line_2: 'Suite 100',
        city: 'New York',
        state: 'NY',
        postcode: '10001',
      },
      hours: [],
      hours_text: '',
      rates: [],
      cities_served: [],
      amenities: [],
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
        alt: '212-555-0101',
        fax: '',
        free_us: '1-800-ART-SHOW',
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
        twitter: '@artgallerynyc',
        instagram: 'artgallerynyc',
        youtube: '',
        pinterest: '',
        tripadvisor: '',
        tiktok: '',
      },
      products: [
        {
          product_id: 1,
          product_tier_id: 1,
          status: 'active',
          videos: [],
          i360s: [],
          enhancements: [],
          product: {
            id: 1,
            name: 'Event Listing',
            type: 'event',
            client_name: 'NYC Art Gallery'
          },
          categories: [
            { 
              category_id: 1,
              category: { id: 1, name: 'Art Gallery/Display' },
              description: 'Art galleries and exhibitions',
              groups: []
            },
            { 
              category_id: 3,
              category: { id: 3, name: 'Museums' },
              description: 'Museums and cultural institutions',
              groups: []
            },
          ],
          tier: {
            id: 1,
            type: 'standard',
            is_default: true
          },
          description: {
            id: 1,
            describable_id: 1024,
            describable_type: 'Event',
            text: 'Join us for the opening night of our latest contemporary art exhibition.'
          },
          photos: [],
          documents: [],
          brochures: [],
          deals: []
        }
      ],
      photos: [],
      account_id: 1,
      published_city_id: 1,
      geography: null,
      last_publish_utc: '2024-01-01T00:00:00Z',
      published_under: {
        name: 'New York',
        county: 'New York County',
        region: 'Northeast',
        latitude: '40.7128',
        longitude: '-74.0060'
      },
      custom: {},
      external_data: {
        tripadvisor: []
      }
    })

    it('should transform basic event information', () => {
      const event = createMockEvent()
      const result = transformer.transform(event)

      expect(result.title).toBe('Art Exhibition Opening')
      expect(result.externalId).toBe(1024)
      expect(result.trackingId).toBe('EVT-1024')
      expect(result.venueName).toBe('NYC Art Gallery')
    })

    it('should transform location to [longitude, latitude] tuple', () => {
      const event = createMockEvent()
      const result = transformer.transform(event)

      expect(result.location).toEqual([-74.0060, 40.7128])
    })

    it('should handle events without coordinates', () => {
      const event: Listing = {
        ...createMockEvent(),
        latitude: null as any,
        longitude: null as any,
      }
      const result = transformer.transform(event)

      expect(result.location).toBeUndefined()
    })

    it('should transform address correctly', () => {
      const event = createMockEvent()
      const result = transformer.transform(event)

      expect(result.address).toEqual({
        line1: '123 Art Street',
        line2: 'Suite 100',
        city: 'New York',
        state: 'NY',
        postcode: '10001',
      })
    })

    it('should handle null address fields', () => {
      const event: Listing = {
        ...createMockEvent(),
        address: {
          line_1: '123 Main St',
          line_2: '',
          city: 'New York',
          state: 'NY',
          postcode: '',
        }
      }
      const result = transformer.transform(event)

      expect(result.address.line2).toBe('')
      expect(result.address.postcode).toBe('')
    })

    it('should transform event dates', () => {
      const event = createMockEvent()
      const result = transformer.transform(event)

      expect(result.eventDates).toHaveLength(1)
      expect(result.eventDates[0]).toEqual({
        name: 'Opening Night',
        startDate: '2024-01-15',
        endDate: '2024-01-15',
        startTime: '18:00:00',
        endTime: '21:00:00',
        allDay: false,
        timesText: '6:00 PM - 9:00 PM',
      })
    })

    it('should handle all-day events', () => {
      const event = {
        ...createMockEvent(),
        event_dates: [{
          name: 'Festival Day',
          start_date: '2024-01-20',
          end_date: '2024-01-20',
          weekdays: 'Saturday',
          start_time: null,
          end_time: null,
          all_day: 1,
          times_text: 'All Day',
          calendar: [],
        }]
      }
      const result = transformer.transform(event)

      expect(result.eventDates[0].allDay).toBe(true)
      expect(result.eventDates[0].startTime).toBeNull()
      expect(result.eventDates[0].endTime).toBeNull()
    })

    it('should transform contact information', () => {
      const event = createMockEvent()
      const result = transformer.transform(event)

      expect(result.emailAddresses).toEqual({
        business: 'info@artgallery.com',
        booking: 'tickets@artgallery.com',
      })

      expect(result.phoneNumbers).toEqual({
        local: '212-555-0100',
        alt: '212-555-0101',
        fax: '',
        freeUS: '1-800-ART-SHOW',
        freeWorld: '',
      })

      expect(result.websites).toEqual({
        business: 'https://artgallery.com',
        booking: 'https://artgallery.com/tickets',
      })
    })

    it('should transform social media handles', () => {
      const event = createMockEvent()
      const result = transformer.transform(event)

      expect(result.socials).toEqual({
        facebook: 'artgallerynyc',
        twitter: '@artgallerynyc',
        instagram: 'artgallerynyc',
        youtube: '',
        pinterest: '',
      })
    })

    it('should extract description from products', () => {
      const event = createMockEvent()
      const result = transformer.transform(event)

      expect(result.description).toEqual([{
        children: [{ 
          text: 'Join us for the opening night of our latest contemporary art exhibition.' 
        }]
      }])
    })

    it('should handle missing description', () => {
      const event = {
        ...createMockEvent(),
        products: []
      }
      const result = transformer.transform(event)

      expect(result.description).toBeUndefined()
    })

    it('should resolve category IDs to names', () => {
      const event = createMockEvent()
      const result = transformer.transform(event)

      expect(result.categories).toEqual([
        'Art Gallery/Display',
        'Museums'
      ])
    })

    it('should skip unknown category IDs', () => {
      const event = {
        ...createMockEvent(),
        products: [{
          product_id: 1,
          product_tier_id: 1,
          status: 'active',
          videos: [],
          i360s: [],
          enhancements: [],
          product: {
            id: 1,
            name: 'Event Listing',
            type: 'event',
            client_name: 'NYC Art Gallery'
          },
          categories: [
            { 
              category_id: 1,
              category: { id: 1, name: 'Art Gallery/Display' },
              description: 'Art galleries and exhibitions',
              groups: []
            },
            { 
              category_id: 999,
              category: { id: 999, name: 'Unknown' },
              description: 'Unknown category',
              groups: []
            }, // Unknown
            { 
              category_id: 3,
              category: { id: 3, name: 'Museums' },
              description: 'Museums and cultural institutions',
              groups: []
            },
          ],
          tier: {
            id: 1,
            type: 'standard',
            is_default: true
          },
          description: {
            id: 1,
            describable_id: 1024,
            describable_type: 'Event',
            text: ''
          },
          photos: [],
          documents: [],
          brochures: [],
          deals: []
        }]
      }
      const result = transformer.transform(event)

      expect(result.categories).toEqual([
        'Art Gallery/Display',
        'Museums'
      ])
    })

    it('should add metadata fields', () => {
      const event = createMockEvent()
      const result = transformer.transform(event)

      expect(result.syncedAt).toBeDefined()
      expect(result.syncSource).toBe('federator-api')
      expect(result.status).toBe('published')
      expect(result.publishedAt).toBeDefined()
      expect(result.listingData).toEqual(event)
    })

    it('should handle minimal event data', () => {
      const minimalEvent: Partial<Listing> = {
        type: 'event',
        name: 'Simple Event',
        event_dates: [{
          name: 'Event Date',
          start_date: '2024-01-01',
          end_date: '2024-01-01',
          weekdays: '',
          start_time: null,
          end_time: null,
          all_day: 1,
          times_text: '',
          calendar: [],
        }],
        address: {
          line_1: '',
          line_2: '',
          city: 'City',
          state: 'ST',
          postcode: '',
        },
        email_addresses: { business: '', booking: '' },
        phone_numbers: { local: '', alt: '', fax: '', free_us: '', free_world: '' },
        websites: { business: '', booking: '', meetings: '', mobile: '' },
        socials: { 
          facebook: '', twitter: '', instagram: '', 
          youtube: '', pinterest: '', tripadvisor: '', tiktok: '' 
        },
      }

      const result = transformer.transform(minimalEvent as Listing)

      expect(result.title).toBe('Simple Event')
      expect(result.externalId).toBe(0)
      expect(result.trackingId).toBe('')
      expect(result.eventDates).toHaveLength(1)
    })
  })

  describe('validation', () => {
    it('should validate transformed events', () => {
      const event = createMockEvent()
      const transformed = transformer.transform(event as Listing)
      const isValid = transformer.validateTransformed(transformed)

      expect(isValid).toBe(true)
    })

    it('should reject events missing required fields', () => {
      const invalidData = {
        title: 'Test Event',
        // Missing other required fields
      }

      const isValid = transformer.validateTransformed(invalidData)
      expect(isValid).toBe(false)
    })
  })

  describe('error handling', () => {
    it('should throw error for non-event types', () => {
      const profile = {
        type: 'profile',
        name: 'Not an event',
      }

      expect(() => transformer.transform(profile as any)).toThrow('Expected event type')
    })
  })
})

// Helper to create valid mock event
function createMockEvent(): Partial<Listing> {
  return {
    type: 'event',
    id: 1024,
    external_id: 1024,
    tracking_id: 'EVT-1024',
    name: 'Art Exhibition Opening',
    name_sort: 'art exhibition opening',
    latitude: 40.7128,
    longitude: -74.0060,
    venue_name: 'NYC Art Gallery',
    address: {
      line_1: '123 Art Street',
      line_2: 'Suite 100',
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
      alt: '212-555-0101',
      fax: '',
      free_us: '1-800-ART-SHOW',
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
      twitter: '@artgallerynyc',
      instagram: 'artgallerynyc',
      youtube: '',
      pinterest: '',
      tripadvisor: '',
      tiktok: '',
    },
    products: [
      {
        product_id: 1,
        product_tier_id: 1,
        status: 'active',
        videos: [],
        i360s: [],
        enhancements: [],
        product: {
          id: 1,
          name: 'Event Listing',
          type: 'event',
          client_name: 'NYC Art Gallery'
        },
        categories: [
          { 
            category_id: 1,
            category: { id: 1, name: 'Art Gallery/Display' },
            description: 'Art galleries and exhibitions',
            groups: []
          },
          { 
            category_id: 3,
            category: { id: 3, name: 'Museums' },
            description: 'Museums and cultural institutions',
            groups: []
          },
        ],
        tier: {
          id: 1,
          type: 'standard',
          is_default: true
        },
        description: {
          id: 1,
          describable_id: 1024,
          describable_type: 'Event',
          text: 'Join us for the opening night of our latest contemporary art exhibition.'
        },
        photos: [],
        documents: [],
        brochures: [],
        deals: []
      }
    ],
  }
}