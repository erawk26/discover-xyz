/**
 * Profile Schema Tests
 * 
 * TDD: Writing tests BEFORE implementation
 */

import { describe, it, expect } from 'vitest'
import { ProfileSchema, HoursSchema, RateSchema, TransformedProfileSchema } from '../profile.schema'
import type { Listing, Hours, Rate, ExtendedProfile } from '../../types/fedsync.types'

describe('ProfileSchema', () => {
  describe('Hours Validation', () => {
    it('should validate valid business hours', () => {
      const validHours: Hours = {
        dayOfWeek: 'Monday',
        openAt: '09:00:00',
        closeAt: '17:00:00',
        allDay: false,
      }
      
      const result = HoursSchema.safeParse(validHours)
      expect(result.success).toBe(true)
    })

    it('should validate 24-hour business', () => {
      const allDayHours: Hours = {
        dayOfWeek: 'Monday',
        openAt: '00:00:00',
        closeAt: '23:59:59',
        allDay: true,
      }
      
      const result = HoursSchema.safeParse(allDayHours)
      expect(result.success).toBe(true)
    })

    it('should reject hours without required fields', () => {
      const invalidHours = {
        dayOfWeek: 'Monday',
        // Missing openAt and closeAt
      }
      
      const result = HoursSchema.safeParse(invalidHours)
      expect(result.success).toBe(false)
    })
  })

  describe('Rate Validation', () => {
    it('should validate valid rate', () => {
      const validRate: Rate = {
        name: 'Standard Room',
        value: '$150-$200',
      }
      
      const result = RateSchema.safeParse(validRate)
      expect(result.success).toBe(true)
    })

    it('should reject rate without required fields', () => {
      const invalidRate = {
        name: 'Standard Room',
        // Missing value
      }
      
      const result = RateSchema.safeParse(invalidRate)
      expect(result.success).toBe(false)
    })
  })

  describe('FedSync Profile Validation', () => {
    const createValidProfile = (): Partial<ExtendedProfile> => ({
      schema: 'profile',
      id: 683,
      external_id: 683,
      tracking_id: 'PROF-683',
      type: 'profile',
      name: 'The Grand Hotel',
      name_sort: 'grand hotel the',
      latitude: 40.7589,
      longitude: -73.9851,
      address: {
        line_1: '1 Grand Plaza',
        line_2: 'Suite 100',
        city: 'New York',
        state: 'NY',
        postcode: '10019',
      },
      email_addresses: {
        business: 'info@grandhotel.com',
        booking: 'reservations@grandhotel.com',
      },
      phone_numbers: {
        local: '212-555-1000',
        alt: '212-555-1001',
        fax: '212-555-1002',
        free_us: '1-800-555-1000',
        free_world: '+1-800-555-1000',
      },
      websites: {
        business: 'https://grandhotel.com',
        booking: 'https://grandhotel.com/book',
        meetings: 'https://grandhotel.com/meetings',
        mobile: 'https://m.grandhotel.com',
      },
      socials: {
        facebook: 'grandhotelnyc',
        twitter: 'grandhotelnyc',
        instagram: 'grandhotelnyc',
        youtube: 'grandhotelnyc',
        pinterest: 'grandhotelnyc',
        tripadvisor: 'Hotel_Review-g60763',
        tiktok: 'grandhotelnyc',
      },
      hours: [
        {
          dayOfWeek: 'Monday',
          openAt: '00:00:00',
          closeAt: '23:59:59',
          allDay: true,
        }
      ],
      hours_text: '24/7',
      rates: [
        {
          name: 'Standard Room',
          value: '$250-$350',
        }
      ],
      cities_served: ['New York', 'Manhattan'],
      amenities: [],
      products: [],
      photos: [],
      meeting_facilities: {
        total_sq_ft: 50000,
        num_mtg_rooms: 20,
        largest_room: 10000,
        ceiling_ht: 20,
      },
      num_of_rooms: 500,
      num_of_suites: 50,
      venue_name: '',
      event_dates: [],
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
      custom: {},
      external_data: { tripadvisor: [] },
      last_publish_utc: '2024-01-01T00:00:00Z',
    })

    it('should validate a complete valid profile', () => {
      const validProfile = createValidProfile()
      
      const result = ProfileSchema.safeParse(validProfile)
      expect(result.success).toBe(true)
    })

    it('should require type to be "profile"', () => {
      const invalidProfile = {
        ...createValidProfile(),
        type: 'event' as const,
      }
      
      const result = ProfileSchema.safeParse(invalidProfile)
      expect(result.success).toBe(false)
    })

    it('should validate profile with minimal required fields', () => {
      const minimalProfile = {
        type: 'profile',
        name: 'Test Business',
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
      
      const result = ProfileSchema.safeParse(minimalProfile)
      expect(result.success).toBe(true)
    })

    it('should handle optional meeting facilities', () => {
      const profileWithoutMeetings = {
        ...createValidProfile(),
        meeting_facilities: undefined,
      }
      
      const result = ProfileSchema.safeParse(profileWithoutMeetings)
      expect(result.success).toBe(true)
    })

    it('should validate different profile types', () => {
      const profileTypes = [
        'profile',
        'accommodation',
        'restaurant',
        'attraction',
        'activity',
        'shopping',
        'service',
      ] as const
      
      profileTypes.forEach(profileType => {
        const profile = {
          ...createValidProfile(),
          type: profileType,
        }
        
        const result = ProfileSchema.safeParse(profile)
        expect(result.success).toBe(true)
      })
    })
  })

  describe('Transformed Profile Schema', () => {
    it('should validate a transformed profile for Payload', () => {
      const transformedProfile = {
        title: 'The Grand Hotel',
        sortName: 'grand hotel the',
        externalId: 683,
        trackingId: 'PROF-683',
        type: 'accommodation',
        description: [
          {
            children: [{ text: 'Luxury hotel in the heart of Manhattan.' }]
          }
        ],
        location: [-73.9851, 40.7589],
        address: {
          line1: '1 Grand Plaza',
          line2: 'Suite 100',
          city: 'New York',
          state: 'NY',
          postcode: '10019',
        },
        emailAddresses: {
          business: 'info@grandhotel.com',
          booking: 'reservations@grandhotel.com',
        },
        phoneNumbers: {
          local: '212-555-1000',
          alt: '212-555-1001',
          fax: '212-555-1002',
          freeUS: '1-800-555-1000',
          freeWorld: '+1-800-555-1000',
        },
        websites: {
          business: 'https://grandhotel.com',
          booking: 'https://grandhotel.com/book',
          meetings: 'https://grandhotel.com/meetings',
          mobile: 'https://m.grandhotel.com',
        },
        socials: {
          facebook: 'grandhotelnyc',
          twitter: 'grandhotelnyc',
          instagram: 'grandhotelnyc',
          youtube: 'grandhotelnyc',
          pinterest: 'grandhotelnyc',
          tripadvisor: 'Hotel_Review-g60763',
        },
        hours: [
          {
            day: 'Monday',
            open: '00:00:00',
            close: '23:59:59',
          }
        ],
        hoursText: '24/7',
        amenities: [],
        categories: [],
        photos: [
          {
            url: 'https://example.com/photo1.jpg',
            caption: 'Hotel Exterior',
            altText: 'Front view of The Grand Hotel',
            externalId: 1,
          }
        ],
        rates: [
          {
            type: 'Standard Room',
            amount: '$250-$350',
            description: 'Our comfortable standard rooms',
          }
        ],
        roomsInfo: {
          numOfRooms: 500,
          numOfSuites: 50,
        },
        meetingFacilities: {
          totalSqFt: 50000,
          numMtgRooms: 20,
          largestRoom: 10000,
          ceilingHt: 20,
        },
        citiesServed: ['New York', 'Manhattan'],
        listingData: {},
        syncedAt: '2024-01-01T00:00:00Z',
        syncSource: 'federator-api',
        status: 'published',
        publishedAt: '2024-01-01T00:00:00Z',
      }
      
      const result = TransformedProfileSchema.safeParse(transformedProfile)
      expect(result.success).toBe(true)
    })

    it('should require title field', () => {
      const profileWithoutTitle = {
        sortName: 'test',
        externalId: 1,
        trackingId: 'TEST-1',
        type: 'profile',
        // Missing title
      }
      
      const result = TransformedProfileSchema.safeParse(profileWithoutTitle)
      expect(result.success).toBe(false)
    })

    it('should validate photo structure', () => {
      const profileWithPhotos = {
        ...createMinimalTransformedProfile(),
        photos: [
          {
            url: 'https://example.com/photo.jpg',
            caption: 'Test Photo',
            altText: 'Alt text for photo',
            externalId: 123,
          }
        ],
      }
      
      const result = TransformedProfileSchema.safeParse(profileWithPhotos)
      expect(result.success).toBe(true)
    })

    it('should validate transformed hours format', () => {
      const profileWithHours = {
        ...createMinimalTransformedProfile(),
        hours: [
          {
            day: 'Monday',
            open: '09:00:00',
            close: '17:00:00',
          },
          {
            day: 'Tuesday',
            open: '09:00:00',
            close: '17:00:00',
          }
        ],
      }
      
      const result = TransformedProfileSchema.safeParse(profileWithHours)
      expect(result.success).toBe(true)
    })

    it('should handle optional fields correctly', () => {
      const minimalProfile = createMinimalTransformedProfile()
      
      const result = TransformedProfileSchema.safeParse(minimalProfile)
      expect(result.success).toBe(true)
      
      // Verify optional fields are not required
      expect(result.data).not.toHaveProperty('description')
      expect(result.data).not.toHaveProperty('location')
      expect(result.data).not.toHaveProperty('roomsInfo')
      expect(result.data).not.toHaveProperty('meetingFacilities')
    })

    it('should validate rates with proper structure', () => {
      const profileWithRates = {
        ...createMinimalTransformedProfile(),
        rates: [
          {
            type: 'Weekday',
            amount: '$100',
            description: 'Monday through Thursday',
          },
          {
            type: 'Weekend',
            amount: '$150',
            description: 'Friday through Sunday',
          }
        ],
      }
      
      const result = TransformedProfileSchema.safeParse(profileWithRates)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.rates).toHaveLength(2)
      }
    })
  })
})

// Helper function for creating minimal transformed profiles
function createMinimalTransformedProfile() {
  return {
    title: 'Test Business',
    sortName: 'test business',
    externalId: 1,
    trackingId: 'TEST-1',
    type: 'profile',
    address: {
      line1: '',
      line2: '',
      city: 'Test',
      state: 'TS',
      postcode: '',
    },
    emailAddresses: { business: '', booking: '' },
    phoneNumbers: { local: '', alt: '', fax: '', freeUS: '', freeWorld: '' },
    websites: { business: '', booking: '', meetings: '', mobile: '' },
    socials: { 
      facebook: '', 
      twitter: '', 
      instagram: '', 
      youtube: '', 
      pinterest: '', 
      tripadvisor: '' 
    },
    hours: [],
    hoursText: '',
    amenities: [],
    categories: [],
    photos: [],
    rates: [],
    citiesServed: [],
    listingData: {},
    syncedAt: new Date().toISOString(),
    syncSource: 'federator-api',
    status: 'published',
    publishedAt: new Date().toISOString(),
  }
}