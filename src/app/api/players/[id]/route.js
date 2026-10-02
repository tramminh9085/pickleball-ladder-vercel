import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';

export async function PUT(request, { params }) {
  try {
    await requireAuth();
    const id = parseInt(params.id);
    const data = await request.json();
    const player = await prisma.player.update({
      where: { id },
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

export async function DELETE(request, { params }) {
  try {
    await requireAuth();
    const id = parseInt(params.id);
    await prisma.player.delete({ where: { id }});
    return NextResponse.json({ success: true });
  } catch(e) {
    return NextResponse.json({ error: e.message }, { status: 401 });
  }
}