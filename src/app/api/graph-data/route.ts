import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
    const userId = req.nextUrl.searchParams.get('userId') || 'default-user';

    try {
        const nodes = await prisma.node.findMany({
            where: { userId },
            select: { id: true, label: true, type: true }
        });

        const edges = await prisma.edge.findMany({
            where: { userId },
            select: { id: true, sourceId: true, targetId: true, relationship: true }
        });

        // Format for React Flow
        const flowNodes = nodes.map(n => ({
            id: n.id,
            data: { label: n.label, type: n.type },
            position: { x: Math.random() * 500, y: Math.random() * 500 }, // Random position for now, layouting can be improved
            type: 'default' // or custom type
        }));

        const flowEdges = edges.map(e => ({
            id: e.id,
            source: e.sourceId,
            target: e.targetId,
            label: e.relationship,
            animated: true
        }));

        return NextResponse.json({ nodes: flowNodes, edges: flowEdges });

    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch graph' }, { status: 500 });
    }
}
