import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';

export async function PUT(request, { params }) {
  try {
    await requireAuth();
    const id = parseInt(params.id);
    const data = await request.json();
    const day = await prisma.playDay.update({
      where: { id },
      data: { name: data.name, playDate: data.playDate }
    });
    await prisma.playDayPlayer.deleteMany({ where: { playDayId: id }});
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