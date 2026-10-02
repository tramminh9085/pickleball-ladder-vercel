import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';

export async function GET() {
  let config = await prisma.appConfig.findFirst();
  if (!config) {
    config = await prisma.appConfig.create({ data: { maxLosses: 3, showMaxColumn: true }});
  }
  return NextResponse.json(config);
}

export async function PUT(request) {
  try {
    await requireAuth();
    const data = await request.json();
    let config = await prisma.appConfig.findFirst();
    config = await prisma.appConfig.update({
      where: { id: config?.id || 1 },
      data: {
        maxLosses: data.maxLosses,
        showMaxColumn: data.showMaxColumn
      }
    });
    return NextResponse.json(config);
  } catch(e) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
}