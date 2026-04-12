// src/middleware.ts
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Routes that don't require authentication
const PUBLIC_ROUTES = ['/', '/auth/signin', '/auth/signup']

// Routes that authenticated users shouldn't access (redirect to dashboard)
const AUTH_ROUTES = ['/auth/signin', '/auth/signup']

export function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl

    // Check for auth cookie (your backend sets 'access_token')
    const token = request.cookies.get('access_token')?.value

    const isPublicRoute = PUBLIC_ROUTES.some(r => pathname === r)
    const isAuthRoute = AUTH_ROUTES.some(r => pathname.startsWith(r))
    const isApiRoute = pathname.startsWith('/api')

    // Skip middleware for API routes and static files
    if (isApiRoute || pathname.startsWith('/_next') || pathname.startsWith('/favicon')) {
        return NextResponse.next()
    }

    // If user is NOT authenticated and trying to access protected route
    if (!token && !isPublicRoute) {
        const signInUrl = new URL('/auth/signin', request.url)
        signInUrl.searchParams.set('from', pathname) // remember where they were going
        return NextResponse.redirect(signInUrl)
    }

    // If user IS authenticated and trying to access sign-in/sign-up
    if (token && isAuthRoute) {
        return NextResponse.redirect(new URL('/dashboard', request.url))
    }

    return NextResponse.next()
}

export const config = {
    matcher: [
        /*
         * Match all request paths EXCEPT:
         * - _next/static (static files)
         * - _next/image (image optimization)
         * - favicon.ico
         */
        '/((?!_next/static|_next/image|favicon.ico).*)',
    ],
}