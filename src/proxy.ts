import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Protect Profile Routes
  if (pathname.startsWith('/profile')) {
    const token = request.cookies.get('auth_token')?.value;
    
    // If no token exists, immediately redirect to login before the page even renders
    if (!token) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('returnTo', pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  // Protect Admin Routes
  if (pathname.startsWith('/admin')) {
    const token = request.cookies.get('auth_token')?.value;
    
    // If no token exists, immediately redirect to login
    if (!token) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('returnTo', pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

// Only run middleware on specific paths to keep the application lightning fast
export const config = {
  matcher: ['/profile/:path*', '/admin/:path*'],
};
