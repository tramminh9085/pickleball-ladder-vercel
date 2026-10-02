import { NextResponse } from 'next/server';

export async function GET() {
    return NextResponse.json({
        authenticated: true,
        username: 'admin',
        csrfHeader: null,
        csrfToken: null
    });
}
