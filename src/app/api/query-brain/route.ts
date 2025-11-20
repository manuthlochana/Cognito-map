import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { z } from 'zod';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

const QuerySchema = z.object({
    question: z.string().min(1),
    userId: z.string().optional().default('default-user'),
});

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { question, userId } = QuerySchema.parse(body);

        // 1. Embed the question
        const embeddingModel = genAI.getGenerativeModel({ model: "text-embedding-004" });
        const embeddingResult = await embeddingModel.embedContent(question);
        const vector = embeddingResult.embedding.values;
        const vectorString = `[${vector.join(',')}]`;

        // 2. Vector Search
        const memories = await prisma.$queryRaw`
      SELECT id, content, 1 - (embedding <=> ${vectorString}::vector) as similarity
      FROM "MemoryChunk"
      WHERE "userId" = ${userId}
      ORDER BY similarity DESC
      LIMIT 5;
    ` as any[];

        const nodes = await prisma.$queryRaw`
      SELECT id, label, type, 1 - (embedding <=> ${vectorString}::vector) as similarity
      FROM "Node"
      WHERE "userId" = ${userId}
      ORDER BY similarity DESC
      LIMIT 5;
    ` as any[];

        const contextText = memories.map((m: any) => `- ${m.content}`).join('\n');
        const contextNodes = nodes.map((n: any) => `${n.label} (${n.type})`).join(', ');

        // 3. Generate Answer with Gemini
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

        const systemPrompt = `
      You are a Personal Knowledge Assistant. Answer the user's question strictly based on the provided context.
      If the answer is not in the context, say "I don't have enough information in my memory to answer that."
      
      Context from Memories:
      ${contextText}
      
      Relevant Concepts:
      ${contextNodes}
      
      Question: ${question}
    `;

        const result = await model.generateContent(systemPrompt);
        const answer = result.response.text();
        const sourceNodeIds = nodes.map((n: any) => n.id);

        return NextResponse.json({
            answer,
            sourceNodeIds,
            contextUsed: memories.length
        });

    } catch (error) {
        console.error('Query Error:', error);
        return NextResponse.json({ success: false, error: 'Failed to query brain' }, { status: 500 });
    }
}
