import { describe, it, expect } from 'vitest'
import { matchesPattern } from '../email-matcher'

describe('Email Pattern Matching', () => {
  describe('matchesPattern', () => {
    it('should match exact emails case-insensitively', () => {
      expect(matchesPattern('test@example.com', 'test@example.com')).toBe(true)
      expect(matchesPattern('Test@Example.com', 'test@example.com')).toBe(true)
      expect(matchesPattern('test@example.com', 'Test@Example.com')).toBe(true)
      expect(matchesPattern('other@example.com', 'test@example.com')).toBe(false)
    })

    it('should match wildcard domain patterns', () => {
      // Should match
      expect(matchesPattern('john@milespartnership.com', '*@milespartnership.com')).toBe(true)
      expect(matchesPattern('jane.doe@milespartnership.com', '*@milespartnership.com')).toBe(true)
      
      // Should NOT match - different domains
      expect(matchesPattern('erawk26@gmail.com', '*@milespartnership.com')).toBe(false)
      expect(matchesPattern('test@example.com', '*@milespartnership.com')).toBe(false)
      expect(matchesPattern('user@milespartnership.org', '*@milespartnership.com')).toBe(false)
      expect(matchesPattern('user@sub.milespartnership.com', '*@milespartnership.com')).toBe(false)
    })

    it('should handle complex wildcard patterns', () => {
      // Subdomain wildcards
      expect(matchesPattern('user@mail.example.com', '*@*.example.com')).toBe(true)
      expect(matchesPattern('user@example.com', '*@*.example.com')).toBe(false)
      
      // Username wildcards
      expect(matchesPattern('admin@example.com', 'admin*@example.com')).toBe(true)
      expect(matchesPattern('admin123@example.com', 'admin*@example.com')).toBe(true)
      expect(matchesPattern('superadmin@example.com', 'admin*@example.com')).toBe(false)
    })

    it('should properly escape special regex characters', () => {
      // Dots should be literal
      expect(matchesPattern('user@example.com', '*@example.com')).toBe(true)
      expect(matchesPattern('user@exampleXcom', '*@example.com')).toBe(false)
      
      // Plus signs should be literal
      expect(matchesPattern('user+tag@example.com', 'user+tag@example.com')).toBe(true)
      expect(matchesPattern('user+tag@example.com', '*+tag@example.com')).toBe(true)
      expect(matchesPattern('userXtag@example.com', '*+tag@example.com')).toBe(false)
    })

    it('should not match partial domains', () => {
      // These should NOT match because they're not complete domain matches
      expect(matchesPattern('user@notmilespartnership.com', '*@milespartnership.com')).toBe(false)
      expect(matchesPattern('user@milespartnershipextra.com', '*@milespartnership.com')).toBe(false)
    })
  })
})