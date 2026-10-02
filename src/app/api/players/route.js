import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';

export async function GET() {
  const players = await prisma.player.findMany();
  return NextResponse.json(players);
}

export async function POST(request) {
  try {
    await requireAuth();
    const data = await request.json();
    const player = await prisma.player.create({
      data: {
        name: data.name,
        email: data.email,
        location: data.location,
        skillLevel: data.skillLevel
      }
    });
    return NextResponse.json(player);
  } catch(e) {
    return NextResponse.json({ error: e.message }, { status: 401 });
  }
}