/**
 * Cookie Utility Functions
 *
 * Helper functions for managing cookies in the application.
 * Used for persisting user preferences like last selected project.
 */

/**
 * Set a cookie
 *
 * @param name - Cookie name
 * @param value - Cookie value
 * @param days - Number of days until expiration (default: 30)
 */
export function setCookie(name: string, value: string, days: number = 30): void {
  const expires = new Date()
  expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000)
  document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/;SameSite=Strict`
}

/**
 * Get a cookie value
 *
 * @param name - Cookie name
 * @returns Cookie value or null if not found
 */
export function getCookie(name: string): string | null {
  const nameEQ = name + '='
  const cookies = document.cookie.split(';')

  for (let i = 0; i < cookies.length; i++) {
    let cookie = cookies[i]
    while (cookie.charAt(0) === ' ') {
      cookie = cookie.substring(1, cookie.length)
    }
    if (cookie.indexOf(nameEQ) === 0) {
      return cookie.substring(nameEQ.length, cookie.length)
    }
  }
  return null
}

/**
 * Delete a cookie
 *
 * @param name - Cookie name
 */
export function deleteCookie(name: string): void {
  document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/;`
}

/**
 * Constants for cookie names
 */
export const COOKIE_NAMES = {
  LAST_SELECTED_PROJECT: 'hooran_last_project',
  USER_PREFERENCES: 'hooran_user_prefs',
} as const
