export function safeFrom(value: string | null): string {
  if (
    !value ||
    !value.startsWith('/') ||
    value.startsWith('//') ||
    value.includes('\\') ||
    Array.from(value).some((char) => char.charCodeAt(0) < 32)
  )
    return '/';
  const url = new URL(value, window.location.origin);
  let pathname: string;
  try {
    pathname = decodeURIComponent(url.pathname).toLowerCase();
  } catch {
    return '/';
  }
  if (url.origin !== window.location.origin || pathname === '/login' || pathname.startsWith('/login/')) return '/';
  return url.pathname + url.search + url.hash;
}
