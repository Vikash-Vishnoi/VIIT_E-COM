import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Protect Admin Routes (Frontend and API)
  if (pathname.startsWith('/admin') || pathname.startsWith('/api/admin')) {
    const token = request.cookies.get('auth_token')?.value;
    
    // 1. Check if token exists
    if (!token) {
      if (pathname.startsWith('/api/')) {
        return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
      }
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('returnTo', pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  // Protect Profile Routes
  if (pathname.startsWith('/profile')) {
    const token = request.cookies.get('auth_token')?.value;
    
    if (!token) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('returnTo', pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

// Only run proxy on specific paths to keep the application lightning fast
export const config = {
  matcher: ['/profile/:path*', '/admin/:path*', '/api/admin/:path*'],
};
