/**
 * Profile Transformer Tests
 * 
 * TDD: Writing tests BEFORE implementation
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { ProfileTransformer } from '../profile.transformer'
import type { ExtendedProfile } from '../../types/fedsync.types'

describe('ProfileTransformer', () => {
  let transformer: ProfileTransformer
  let mockCategoryMap: Map<number, string>
  let mockAmenityMap: Map<number, string>

  beforeEach(() => {
    // Mock maps for testing
    mockCategoryMap = new Map([
      [100, 'Hotels & Motels'],
      [101, 'Bed & Breakfast'],
      [200, 'Restaurant'],
      [201, 'Cafe'],
    ])
    
    mockAmenityMap = new Map([
      [1, 'WiFi'],
      [2, 'Parking'],
      [3, 'Pool'],
      [4, 'Pet Friendly'],
    ])
    
    transformer = new ProfileTransformer(mockCategoryMap, mockAmenityMap)
  })

  describe('transform', () => {
    const createMockProfile = (): Partial<ExtendedProfile> => ({
      type: 'listing', // Fixed: Real FedSync uses 'listing' not 'profile'
      id: 683,
      external_id: 683,
      tracking_id: 'PROF-683',
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
        twitter: '@grandhotelnyc',
        instagram: 'grandhotelnyc',
        youtube: 'grandhotelnyc',
        pinterest: 'grandhotelnyc',
        tripadvisor: 'Hotel_Review-g60763',
        tiktok: '@grandhotelnyc',
      },
      hours: [
        {
          dayOfWeek: 'Monday',
          openAt: '00:00:00',
          closeAt: '23:59:59',
          allDay: true,
        },
        {
          dayOfWeek: 'Tuesday',
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
        },
        {
          name: 'Suite',
          value: '$450-$650',
        }
      ],
      cities_served: ['New York', 'Manhattan', 'Midtown'],
      amenities: [
        { 
          amenity_id: 1, 
          value: 'true',
          amenity: {
            id: 1,
            name: 'WiFi',
            is_constrained: false,
            data_type: 'boolean',
            min_value: null,
            max_value: null,
            is_required: false,
            group: { id: 1, name: 'Technology' }
          }
        },
        { 
          amenity_id: 2, 
          value: 'Valet and Self',
          amenity: {
            id: 2,
            name: 'Parking',
            is_constrained: false,
            data_type: 'string',
            min_value: null,
            max_value: null,
            is_required: false,
            group: { id: 2, name: 'Facilities' }
          }
        },
        { 
          amenity_id: 3, 
          value: 'Outdoor',
          amenity: {
            id: 3,
            name: 'Pool',
            is_constrained: false,
            data_type: 'string',
            min_value: null,
            max_value: null,
            is_required: false,
            group: { id: 2, name: 'Facilities' }
          }
        },
      ],
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
            name: 'Hotel Listing',
            type: 'profile',
            client_name: 'The Grand Hotel'
          },
          categories: [
            { 
              category_id: 100,
              category: { id: 100, name: 'Hotels & Motels' },
              description: 'Hotels and motels',
              groups: []
            },
            { 
              category_id: 101,
              category: { id: 101, name: 'Bed & Breakfast' },
              description: 'Bed and breakfast establishments',
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
            describable_id: 683,
            describable_type: 'Profile',
            text: 'Luxury hotel in the heart of Manhattan offering world-class amenities.'
          },
          photos: [
            {
              id: 1,
              name: 'hotel-exterior',
              path: '/photos/hotel-exterior.jpg',
              caption: 'Grand Hotel Exterior',
              alt_text: 'Front view of The Grand Hotel',
              is_external: false,
              external_host: '',
              properties: {
                cloudinary: {
                  asset_id: 'abc123',
                  public_id: 'hotel-exterior',
                  version: 1,
                  version_id: 'v1',
                  signature: 'sig123',
                  width: 1920,
                  height: 1080,
                  format: 'jpg',
                  resource_type: 'image',
                  created_at: '2024-01-15T00:00:00Z',
                  tags: [],
                  bytes: 500000,
                  type: 'upload',
                  etag: 'etag123',
                  placeholder: false,
                  url: 'https://res.cloudinary.com/hotel-exterior.jpg',
                  secure_url: 'https://res.cloudinary.com/hotel-exterior.jpg',
                  folder: 'hotels',
                  access_mode: 'public',
                  original_filename: 'hotel-exterior',
                  original_extension: 'jpg'
                }
              },
              type: 'image',
              original_filename: 'hotel-exterior.jpg',
              sort: '1'
            }
          ],
          documents: [],
          brochures: [],
          deals: []
        }
      ],
      meeting_facilities: {
        total_sq_ft: 50000,
        num_mtg_rooms: 20,
        largest_room: 10000,
        ceiling_ht: 20,
      },
      num_of_rooms: 500,
      num_of_suites: 50,
    })

    it('should transform basic profile information', () => {
      const profile = createMockProfile()
      const result = transformer.transform(profile as ExtendedProfile)

      expect(result.title).toBe('The Grand Hotel')
      expect(result.sortName).toBe('grand hotel the')
      expect(result.externalId).toBe(683)
      expect(result.trackingId).toBe('PROF-683')
      expect(result.type).toBe('profile')
    })

    it('should handle different profile types', () => {
      const types = ['accommodation', 'restaurant', 'attraction', 'activity', 'shopping', 'service']
      
      types.forEach(type => {
        const profile = { ...createMockProfile(), type }
        const result = transformer.transform(profile as ExtendedProfile)
        expect(result.type).toBe(type)
      })
    })

    it('should transform location to [longitude, latitude] tuple', () => {
      const profile = createMockProfile()
      const result = transformer.transform(profile as ExtendedProfile)

      expect(result.location).toEqual([-73.9851, 40.7589])
    })

    it('should handle missing coordinates', () => {
      const profile: ExtendedProfile = {
        ...createMockProfile(),
        latitude: null as any,
        longitude: null as any,
      } as ExtendedProfile
      const result = transformer.transform(profile)

      expect(result.location).toBeUndefined()
    })

    it('should transform address correctly', () => {
      const profile = createMockProfile()
      const result = transformer.transform(profile as ExtendedProfile)

      expect(result.address).toEqual({
        line1: '1 Grand Plaza',
        line2: 'Suite 100',
        city: 'New York',
        state: 'NY',
        postcode: '10019',
      })
    })

    it('should transform business hours', () => {
      const profile = createMockProfile()
      const result = transformer.transform(profile as ExtendedProfile)

      expect(result.hours).toHaveLength(2)
      expect(result.hours[0]).toEqual({
        day: 'Monday',
        open: '00:00:00',
        close: '23:59:59',
      })
      expect(result.hoursText).toBe('24/7')
    })

    it('should transform rates', () => {
      const profile = createMockProfile()
      const result = transformer.transform(profile as ExtendedProfile)

      expect(result.rates).toHaveLength(2)
      expect(result.rates[0]).toEqual({
        type: 'Standard Room',
        amount: '$250-$350',
        description: 'Standard Room',
      })
    })

    it('should extract and transform photos', () => {
      const profile = createMockProfile()
      const result = transformer.transform(profile as ExtendedProfile)

      expect(result.photos).toHaveLength(1)
      expect(result.photos[0]).toEqual({
        url: 'https://res.cloudinary.com/hotel-exterior.jpg',
        caption: 'Grand Hotel Exterior',
        altText: 'Front view of The Grand Hotel',
        externalId: 1,
      })
    })

    it('should use fallback URL for photos without cloudinary', () => {
      const profile = {
        ...createMockProfile(),
        products: [{
          photos: [{
            id: 2,
            path: '/photos/lobby.jpg',
            caption: 'Hotel Lobby',
            alt_text: 'Lobby',
            properties: {}
          }]
        }]
      }
      const result = transformer.transform(profile as ExtendedProfile)

      expect(result.photos[0].url).toBe('/photos/lobby.jpg')
    })

    it('should resolve category IDs to names', () => {
      const profile = createMockProfile()
      const result = transformer.transform(profile as ExtendedProfile)

      expect(result.categories).toEqual([
        'Hotels & Motels',
        'Bed & Breakfast'
      ])
    })

    it('should resolve amenity IDs to names', () => {
      const profile = createMockProfile()
      const result = transformer.transform(profile as ExtendedProfile)

      expect(result.amenities).toEqual([
        'WiFi',
        'Parking',
        'Pool'
      ])
    })

    it('should skip unknown category and amenity IDs', () => {
      const profile = {
        ...createMockProfile(),
        products: [{
          categories: [
            { category_id: 100 },
            { category_id: 999 }, // Unknown
          ]
        }],
        amenities: [
          { amenity_id: 1 },
          { amenity_id: 999 }, // Unknown
        ]
      }
      const result = transformer.transform(profile as ExtendedProfile)

      expect(result.categories).toEqual(['Hotels & Motels'])
      expect(result.amenities).toEqual(['WiFi'])
    })

    it('should transform meeting facilities', () => {
      const profile = createMockProfile()
      const result = transformer.transform(profile as ExtendedProfile)

      expect(result.meetingFacilities).toEqual({
        totalSqFt: 50000,
        numMtgRooms: 20,
        largestRoom: 10000,
        ceilingHt: 20,
      })
    })

    it('should transform room information', () => {
      const profile = createMockProfile()
      const result = transformer.transform(profile as ExtendedProfile)

      expect(result.roomsInfo).toEqual({
        numOfRooms: 500,
        numOfSuites: 50,
      })
    })

    it('should handle profiles without meeting facilities or rooms', () => {
      const profile = {
        ...createMockProfile(),
        meeting_facilities: undefined,
        num_of_rooms: undefined,
        num_of_suites: undefined,
      }
      const result = transformer.transform(profile as ExtendedProfile)

      expect(result.meetingFacilities).toBeUndefined()
      expect(result.roomsInfo).toBeUndefined()
    })

    it('should extract description from products', () => {
      const profile = createMockProfile()
      const result = transformer.transform(profile as ExtendedProfile)

      expect(result.description).toEqual([{
        children: [{ 
          text: 'Luxury hotel in the heart of Manhattan offering world-class amenities.' 
        }]
      }])
    })

    it('should transform cities served', () => {
      const profile = createMockProfile()
      const result = transformer.transform(profile as ExtendedProfile)

      expect(result.citiesServed).toEqual(['New York', 'Manhattan', 'Midtown'])
    })

    it('should add metadata fields', () => {
      const profile = createMockProfile()
      const result = transformer.transform(profile as ExtendedProfile)

      expect(result.syncedAt).toBeDefined()
      expect(result.syncSource).toBe('federator-api')
      expect(result.status).toBe('published')
      expect(result.publishedAt).toBeDefined()
      expect(result.listingData).toEqual(profile)
    })

    it('should handle minimal profile data', () => {
      const minimalProfile: Partial<ExtendedProfile> = {
        type: 'profile',
        name: 'Simple Business',
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

      const result = transformer.transform(minimalProfile as ExtendedProfile)

      expect(result.title).toBe('Simple Business')
      expect(result.sortName).toBe('')
      expect(result.externalId).toBe(0)
      expect(result.trackingId).toBe('')
      expect(result.hours).toEqual([])
      expect(result.amenities).toEqual([])
      expect(result.categories).toEqual([])
    })
  })

  describe('validation', () => {
    it('should validate transformed profiles', () => {
      const profile = createMockProfile()
      const transformed = transformer.transform(profile as ExtendedProfile)
      const isValid = transformer.validateTransformed(transformed)

      expect(isValid).toBe(true)
    })

    it('should reject profiles missing required fields', () => {
      const invalidData = {
        title: 'Test Business',
        // Missing other required fields
      }

      const isValid = transformer.validateTransformed(invalidData)
      expect(isValid).toBe(false)
    })
  })

  describe('error handling', () => {
    it('should throw error for non-profile types', () => {
      const event = {
        type: 'event',
        name: 'Not a profile',
      }

      expect(() => transformer.transform(event as any)).toThrow('Expected profile or listing type')
    })
  })
})

// Helper to create valid mock profile
function createMockProfile(): Partial<ExtendedProfile> {
  return {
    type: 'profile',
    id: 683,
    external_id: 683,
    tracking_id: 'PROF-683',
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
      twitter: '@grandhotelnyc',
      instagram: 'grandhotelnyc',
      youtube: 'grandhotelnyc',
      pinterest: 'grandhotelnyc',
      tripadvisor: 'Hotel_Review-g60763',
      tiktok: '@grandhotelnyc',
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
    amenities: [
      { 
        amenity_id: 1, 
        value: 'true',
        amenity: {
          id: 1,
          name: 'WiFi',
          is_constrained: false,
          data_type: 'boolean',
          min_value: null,
          max_value: null,
          is_required: false,
          group: { id: 1, name: 'Technology' }
        }
      },
      { 
        amenity_id: 2, 
        value: 'Valet',
        amenity: {
          id: 2,
          name: 'Parking',
          is_constrained: false,
          data_type: 'string',
          min_value: null,
          max_value: null,
          is_required: false,
          group: { id: 2, name: 'Facilities' }
        }
      },
    ],
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
          name: 'Hotel Listing',
          type: 'profile',
          client_name: 'The Grand Hotel'
        },
        categories: [
          { 
            category_id: 100,
            category: { id: 100, name: 'Hotels & Motels' },
            description: 'Hotels and motels',
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
          describable_id: 683,
          describable_type: 'Profile',
          text: 'Luxury hotel in the heart of Manhattan.'
        },
        photos: [
          {
            id: 1,
            name: 'hotel-exterior',
            path: '/photos/hotel-exterior.jpg',
            caption: 'Grand Hotel Exterior',
            alt_text: 'Front view of The Grand Hotel',
            is_external: false,
            external_host: '',
            properties: {
              cloudinary: {
                asset_id: 'abc123',
                public_id: 'hotel-exterior',
                version: 1,
                version_id: 'v1',
                signature: 'sig123',
                width: 1920,
                height: 1080,
                format: 'jpg',
                resource_type: 'image',
                created_at: '2024-01-15T00:00:00Z',
                tags: [],
                bytes: 500000,
                type: 'upload',
                etag: 'etag123',
                placeholder: false,
                url: 'https://res.cloudinary.com/hotel-exterior.jpg',
                secure_url: 'https://res.cloudinary.com/hotel-exterior.jpg',
                folder: 'hotels',
                access_mode: 'public',
                original_filename: 'hotel-exterior',
                original_extension: 'jpg'
              }
            },
            type: 'image',
            original_filename: 'hotel-exterior.jpg',
            sort: '1'
          }
        ],
        documents: [],
        brochures: [],
        deals: []
      }
    ],
    meeting_facilities: {
      total_sq_ft: 50000,
      num_mtg_rooms: 20,
      largest_room: 10000,
      ceiling_ht: 20,
    },
    num_of_rooms: 500,
    num_of_suites: 50,
  }
}