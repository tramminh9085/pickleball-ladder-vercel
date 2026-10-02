import { NextResponse } from 'next/server';
import { encrypt } from '@/lib/auth';
import { cookies } from 'next/headers';

export async function POST(request) {
  const body = await request.json();
  const validUser = process.env.ADMIN_USERNAME || 'admin';
  const validPass = process.env.ADMIN_PASSWORD || 'admin123';
  
  if (body.username === validUser && body.password === validPass) {
    const session = await encrypt({ user: body.username });
    cookies().set('session', session, { httpOnly: true, secure: process.env.NODE_ENV === 'production', maxAge: 86400, path: '/' });
    return NextResponse.json({ message: 'Success' });
  }
  return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
}