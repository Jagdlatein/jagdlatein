// Protect /admin/* with a simple cookie
import { NextResponse } from 'next/server';

export function middleware(req) {
  const { pathname } = req.nextUrl;
  if (!pathname.startsWith('/admin')) return NextResponse.next();

  const cookie = req.cookies.get('admin');
  if (cookie?.value === '1') return NextResponse.next();

  const url = req.nextUrl.clone();
  url.pathname = '/admin/auth';
  return NextResponse.redirect(url);
}
