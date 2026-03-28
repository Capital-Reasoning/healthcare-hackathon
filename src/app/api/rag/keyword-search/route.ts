import { NextResponse } from 'next/server';
import { buildErrorResponse } from '@/lib/db/queries/helpers';
import { retrieve } from '@/lib/rag/retrieve';

export async function POST(request: Request) {
  try {
    const { terms, limit = 10, documentId } = await request.json();

    if (!terms) {
      return NextResponse.json(buildErrorResponse('Missing terms'), {
        status: 400,
      });
    }

    const results = await retrieve(terms, {
      mode: 'keyword',
      topK: limit,
      documentId,
    });

    return NextResponse.json({
      data: results,
      meta: { total: results.length },
      error: null,
    });
  } catch (error) {
    console.error('POST /api/rag/keyword-search error:', error);
    return NextResponse.json(
      buildErrorResponse('Keyword search failed'),
      { status: 500 },
    );
  }
}
