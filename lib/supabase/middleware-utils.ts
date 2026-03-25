export const PUBLIC_PATHS = ['/login', '/signup']

export function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATHS.some((path) => pathname.startsWith(path))
}

export function isApiPath(pathname: string): boolean {
  return pathname.startsWith('/api/')
}
