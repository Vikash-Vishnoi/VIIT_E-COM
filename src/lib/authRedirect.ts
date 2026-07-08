/**
 * Determines the safest and most appropriate URL to redirect a user to after successful authentication.
 * 
 * 1. Prioritizes the `returnTo` URL parameter if present and valid (must be a relative path).
 * 2. Falls back to `document.referrer` if the referrer is from the same origin and is not an auth page.
 * 3. Defaults to `/` if neither is valid.
 */
export function getAuthRedirectUrl(): string {
  let returnUrl = '/';
  
  if (typeof window === 'undefined') {
    return returnUrl;
  }

  const searchParams = new URLSearchParams(window.location.search);
  const returnToParam = searchParams.get('returnTo');

  // Priority 1: returnTo param
  if (returnToParam && returnToParam.startsWith('/') && !returnToParam.startsWith('//')) {
    returnUrl = returnToParam;
  } 
  // Priority 2: document.referrer
  else if (document.referrer) {
    try {
      const referrerUrl = new URL(document.referrer);
      
      const isSameOrigin = referrerUrl.origin === window.location.origin;
      const isAuthPage = 
        referrerUrl.pathname.includes('/login') || 
        referrerUrl.pathname.includes('/register') || 
        referrerUrl.pathname.includes('/forgot-password');

      if (isSameOrigin && !isAuthPage) {
        returnUrl = referrerUrl.pathname + referrerUrl.search;
      }
    } catch (err) {
      // Ignore URL parsing errors and fallback to default
    }
  }

  return returnUrl;
}
