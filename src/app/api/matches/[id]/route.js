import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';

export async function DELETE(request, { params }) {
  try {
    await requireAuth();
    const id = parseInt(params.id);
    await prisma.match.delete({ where: { id }});
    return NextResponse.json({ success: true });
  } catch(e) {
    return NextResponse.json({ error: e.message }, { status: 401 });
  }
}