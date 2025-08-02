// Email pattern matching utilities

export function matchesPattern(email: string, pattern: string): boolean {
  // Exact match
  if (!pattern.includes('*')) {
    return email.toLowerCase() === pattern.toLowerCase()
  }

  // Convert wildcard pattern to regex
  // First escape all special regex characters except *
  const escapedPattern = pattern
    .toLowerCase()
    .replace(/[.+?^${}()|[\]\\]/g, '\\$&')
  
  // Then replace * with .* for wildcard matching
  const regexPattern = escapedPattern.replace(/\*/g, '.*')
  
  // Create regex and test
  const regex = new RegExp(`^${regexPattern}$`)
  return regex.test(email.toLowerCase())
}

export async function findMatchingPattern(email: string, payload: any) {
  // First check for exact match
  const exactMatches = await payload.find({
    collection: 'allowed-users',
    where: {
      and: [
        { pattern: { equals: email.toLowerCase() } },
        { type: { equals: 'exact' } },
      ],
    },
    limit: 1,
  })

  if (exactMatches.docs && exactMatches.docs.length > 0) {
    return exactMatches.docs[0]
  }

  // Then check wildcard patterns
  const wildcardPatterns = await payload.find({
    collection: 'allowed-users',
    where: { type: { equals: 'wildcard' } },
    limit: 1000, // Adjust if you have many patterns
  })

  if (wildcardPatterns.docs) {
    for (const pattern of wildcardPatterns.docs) {
      if (matchesPattern(email, pattern.pattern)) {
        return pattern
      }
    }
  }

  return null
}