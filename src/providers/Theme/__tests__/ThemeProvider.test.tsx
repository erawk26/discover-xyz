import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ThemeProvider, useTheme } from '../index'
import { themeLocalStorageKey } from '../shared'

// Mock canUseDOM
vi.mock('@/utilities/canUseDOM', () => ({
  default: true,
}))

// Test component to access theme context
function ThemeTestComponent() {
  const { theme, setTheme } = useTheme()
  
  return (
    <div>
      <div data-testid="current-theme">{theme}</div>
      <button onClick={() => setTheme('dark')}>Set Dark</button>
      <button onClick={() => setTheme('light')}>Set Light</button>
      <button onClick={() => setTheme(null)}>Reset Theme</button>
    </div>
  )
}

describe('ThemeProvider', () => {
  beforeEach(() => {
    // Clear localStorage and reset document
    localStorage.clear()
    document.documentElement.removeAttribute('data-theme')
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('should provide theme context to children', () => {
    render(
      <ThemeProvider>
        <ThemeTestComponent />
      </ThemeProvider>
    )

    expect(screen.getByTestId('current-theme')).toBeInTheDocument()
  })

  it('should initialize with default theme', () => {
    render(
      <ThemeProvider>
        <ThemeTestComponent />
      </ThemeProvider>
    )

    expect(screen.getByTestId('current-theme')).toHaveTextContent('light')
    expect(document.documentElement.getAttribute('data-theme')).toBe('light')
  })

  it('should initialize with saved theme from localStorage', () => {
    localStorage.setItem(themeLocalStorageKey, 'dark')

    render(
      <ThemeProvider>
        <ThemeTestComponent />
      </ThemeProvider>
    )

    expect(screen.getByTestId('current-theme')).toHaveTextContent('dark')
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark')
  })

  it('should update theme when setTheme is called', async () => {
    const user = userEvent.setup()

    render(
      <ThemeProvider>
        <ThemeTestComponent />
      </ThemeProvider>
    )

    expect(screen.getByTestId('current-theme')).toHaveTextContent('light')

    await user.click(screen.getByText('Set Dark'))

    expect(screen.getByTestId('current-theme')).toHaveTextContent('dark')
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark')
    expect(localStorage.getItem(themeLocalStorageKey)).toBe('dark')
  })

  it('should toggle between light and dark themes', async () => {
    const user = userEvent.setup()

    render(
      <ThemeProvider>
        <ThemeTestComponent />
      </ThemeProvider>
    )

    // Start with light
    expect(screen.getByTestId('current-theme')).toHaveTextContent('light')

    // Switch to dark
    await user.click(screen.getByText('Set Dark'))
    expect(screen.getByTestId('current-theme')).toHaveTextContent('dark')

    // Switch back to light
    await user.click(screen.getByText('Set Light'))
    expect(screen.getByTestId('current-theme')).toHaveTextContent('light')
  })

  it('should reset theme when setTheme(null) is called', async () => {
    const user = userEvent.setup()

    render(
      <ThemeProvider>
        <ThemeTestComponent />
      </ThemeProvider>
    )

    // Set dark theme
    await user.click(screen.getByText('Set Dark'))
    expect(localStorage.getItem(themeLocalStorageKey)).toBe('dark')

    // Reset theme
    await user.click(screen.getByText('Reset Theme'))

    // Should remove from localStorage
    expect(localStorage.getItem(themeLocalStorageKey)).toBeNull()
  })

  it('should use system preference when no saved theme', () => {
    // Mock matchMedia to prefer dark
    const mockMatchMedia = vi.fn().mockReturnValue({
      matches: true, // dark mode
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })
    window.matchMedia = mockMatchMedia

    render(
      <ThemeProvider>
        <ThemeTestComponent />
      </ThemeProvider>
    )

    expect(screen.getByTestId('current-theme')).toHaveTextContent('dark')
  })

  it('should validate theme from localStorage', () => {
    // Set invalid theme
    localStorage.setItem(themeLocalStorageKey, 'invalid-theme')

    render(
      <ThemeProvider>
        <ThemeTestComponent />
      </ThemeProvider>
    )

    // Should fall back to default
    expect(screen.getByTestId('current-theme')).toHaveTextContent('light')
  })

  it('should read initial theme from document attribute', () => {
    // Set theme on document before render
    document.documentElement.setAttribute('data-theme', 'dark')

    render(
      <ThemeProvider>
        <ThemeTestComponent />
      </ThemeProvider>
    )

    expect(screen.getByTestId('current-theme')).toHaveTextContent('dark')
  })

  it('should persist theme changes across re-renders', async () => {
    const user = userEvent.setup()

    const { rerender } = render(
      <ThemeProvider>
        <ThemeTestComponent />
      </ThemeProvider>
    )

    await user.click(screen.getByText('Set Dark'))
    expect(screen.getByTestId('current-theme')).toHaveTextContent('dark')

    // Re-render
    rerender(
      <ThemeProvider>
        <ThemeTestComponent />
      </ThemeProvider>
    )

    // Theme should persist
    expect(screen.getByTestId('current-theme')).toHaveTextContent('dark')
  })
})