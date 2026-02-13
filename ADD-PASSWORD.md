# Add Password Protection

**From Dan (Feb 12, 2026 @ 7:42 PM)**

Add simple password protection to The Bridge.

## Implementation

### 1. Create Login Page (`/app/login/page.tsx`)
Simple password input form that sets a cookie on success.

### 2. Create Middleware (`/middleware.ts`)
```typescript
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const authCookie = request.cookies.get('bridge-auth')
  
  if (authCookie?.value === process.env.BRIDGE_PASSWORD) {
    return NextResponse.next()
  }
  
  if (request.nextUrl.pathname === '/login') {
    return NextResponse.next()
  }
  
  return NextResponse.redirect(new URL('/login', request.url))
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|logo.svg).*)'],
}
```

### 3. Login API Route (`/app/api/login/route.ts`)
Check password, set cookie if correct.

### 4. Environment Variable
Add `BRIDGE_PASSWORD` to Vercel with a secure password.

### 5. Login Page Design
- Clean, minimal
- Show The Bridge logo
- Password input field
- "Enter The Bridge" button
- Dark theme to match the app

## Priority
Do this AFTER the rebrand is complete.
