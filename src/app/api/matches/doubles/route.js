import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';

export async function POST(request) {
  try {
    await requireAuth();
    const data = await request.json();
    
    // We should fetch player names to store them
    const [t1p1, t1p2, t2p1, t2p2] = await Promise.all([
      prisma.player.findUnique({where: {id: data.team1Player1Id}}),
      prisma.player.findUnique({where: {id: data.team1Player2Id}}),
      prisma.player.findUnique({where: {id: data.team2Player1Id}}),
      prisma.player.findUnique({where: {id: data.team2Player2Id}}),
    ]);
    
    const winningTeam = data.team1Score > data.team2Score ? 1 : 2;
    
    const match = await prisma.match.create({
      data: {
        playDayId: data.playDayId,
        team1Player1Id: data.team1Player1Id,
        team1Player2Id: data.team1Player2Id,
        team2Player1Id: data.team2Player1Id,
        team2Player2Id: data.team2Player2Id,
        team1Player1Name: t1p1?.name || '',
        team1Player2Name: t1p2?.name || '',
        team2Player1Name: t2p1?.name || '',
        team2Player2Name: t2p2?.name || '',
        team1Score: data.team1Score,
        team2Score: data.team2Score,
        winningTeam,
        matchType: 'DOUBLES'
      }
    });
    
    return NextResponse.json(match);
  } catch(e) {
    console.error(e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}