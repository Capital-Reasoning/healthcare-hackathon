import { NextResponse } from 'next/server';
import { buildErrorResponse } from '@/lib/db/queries/helpers';
import { retrieve } from '@/lib/rag/retrieve';

export async function POST(request: Request) {
  try {
    const { query, topK = 5, documentId } = await request.json();

    if (!query) {
      return NextResponse.json(buildErrorResponse('Missing query'), {
        status: 400,
      });
    }

    const results = await retrieve(query, {
      mode: 'vector',
      topK,
      documentId,
    });

    return NextResponse.json({
      data: results,
      meta: { page: 1, pageSize: topK, total: results.length, totalPages: 1 },
      error: null,
    });
  } catch (error) {
    console.error('POST /api/rag/vector-search error:', error);
    return NextResponse.json(
      buildErrorResponse('Vector search failed'),
      { status: 500 },
    );
  }
}
