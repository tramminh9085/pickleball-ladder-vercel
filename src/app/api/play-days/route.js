import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';

export async function GET() {
  const days = await prisma.playDay.findMany();
  // Fetch player ids for each day
  for (let day of days) {
    const players = await prisma.playDayPlayer.findMany({ where: { playDayId: day.id }});
    day.playerIds = players.map(p => p.playerId);
  }
  return NextResponse.json(days);
}

export async function POST(request) {
  try {
    await requireAuth();
    const data = await request.json();
    const day = await prisma.playDay.create({
      data: { name: data.name, playDate: data.playDate }
    });
    for (let pId of data.playerIds) {
      await prisma.playDayPlayer.create({
        data: { playDayId: day.id, playerId: pId }
      });
    }
    day.playerIds = data.playerIds;
    return NextResponse.json(day);
  } catch(e) {
    return NextResponse.json({ error: e.message }, { status: 401 });
  }
}