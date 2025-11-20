import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { z } from 'zod';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

const IngestSchema = z.object({
    text: z.string().min(1),
    userId: z.string().optional().default('default-user'),
});

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { text, userId } = IngestSchema.parse(body);

        // 1. Create User if not exists
        let user = await prisma.user.findUnique({ where: { email: 'user@example.com' } });
        if (!user) {
            user = await prisma.user.create({
                data: {
                    email: 'user@example.com',
                    name: 'Demo User',
                    id: userId,
                },
            });
        }

        // 2. Extract Concepts (Nodes) and Relationships (Edges) using Gemini
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash", generationConfig: { responseMimeType: "application/json" } });

        const extractionPrompt = `
      Analyze the following text and extract key entities (concepts, people, places) and their relationships.
      Return JSON format:
      {
        "nodes": [{ "label": "Name", "type": "Type" }],
        "edges": [{ "source": "Name", "target": "Name", "relationship": "relation" }]
      }
      Text: "${text}"
    `;

        const result = await model.generateContent(extractionPrompt);
        const extraction = JSON.parse(result.response.text());
        const nodes = extraction.nodes || [];
        const edges = extraction.edges || [];

        // 3. Generate Embeddings for the raw text
        const embeddingModel = genAI.getGenerativeModel({ model: "text-embedding-004" });
        const embeddingResult = await embeddingModel.embedContent(text);
        const vector = embeddingResult.embedding.values;

        // 4. Save to DB (Transaction)
        const memory = await prisma.memoryChunk.create({
            data: {
                content: text,
                userId: user.id,
            },
        });

        // Update vector using raw SQL
        const vectorString = `[${vector.join(',')}]`;
        await prisma.$executeRaw`UPDATE "MemoryChunk" SET embedding = ${vectorString}::vector WHERE id = ${memory.id}`;

        // Process Nodes
        const createdNodes = [];
        for (const node of nodes) {
            let dbNode = await prisma.node.findFirst({
                where: { label: node.label, userId: user.id },
            });

            if (!dbNode) {
                const nodeEmbRes = await embeddingModel.embedContent(node.label);
                const nodeVector = `[${nodeEmbRes.embedding.values.join(',')}]`;

                dbNode = await prisma.node.create({
                    data: {
                        label: node.label,
                        type: node.type,
                        userId: user.id,
                        memoryChunkId: memory.id,
                    },
                });

                await prisma.$executeRaw`UPDATE "Node" SET embedding = ${nodeVector}::vector WHERE id = ${dbNode.id}`;
            }
            createdNodes.push(dbNode);
        }

        // Process Edges
        for (const edge of edges) {
            const sourceNode = createdNodes.find(n => n.label === edge.source) || await prisma.node.findFirst({ where: { label: edge.source, userId: user.id } });
            const targetNode = createdNodes.find(n => n.label === edge.target) || await prisma.node.findFirst({ where: { label: edge.target, userId: user.id } });

            if (sourceNode && targetNode) {
                await prisma.edge.create({
                    data: {
                        relationship: edge.relationship,
                        sourceId: sourceNode.id,
                        targetId: targetNode.id,
                        userId: user.id,
                    },
                });
            }
        }

        return NextResponse.json({ success: true, memoryId: memory.id, nodes: createdNodes.length, edges: edges.length });

    } catch (error) {
        console.error('Ingest Error:', error);
        return NextResponse.json({ success: false, error: 'Failed to ingest memory' }, { status: 500 });
    }
}
