import { NextResponse } from 'next/server'
import { NextRequest } from 'next/server'

const username = 'admin'
const password = 'secret'

export function middleware(request: NextRequest) {
  const basicAuth = request.headers.get("authorization")

  if (basicAuth) {
    const authValue = basicAuth.split(' ')[1]
    const [usr, pwd] = atob(authValue).split(':')

    if (usr === username && pwd === password) {
      return NextResponse.next()
    }
  }

  return new Response('Authentication Required', {
    status:401,
    headers: {
      'WWW-Authenticate' : 'Basic realm="Secure Area"'
    }
  })
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)']
}