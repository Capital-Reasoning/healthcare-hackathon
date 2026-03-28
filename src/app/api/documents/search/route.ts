import { NextResponse } from 'next/server';
import { buildErrorResponse } from '@/lib/db/queries/helpers';
import { retrieve } from '@/lib/rag/retrieve';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('query');

    if (!query) {
      return NextResponse.json(buildErrorResponse('Missing query parameter'), {
        status: 400,
      });
    }

    const mode =
      (searchParams.get('mode') as 'vector' | 'keyword' | 'hybrid') ??
      'hybrid';
    const topK = parseInt(searchParams.get('topK') ?? '5', 10);
    const documentId = searchParams.get('documentId') ?? undefined;

    const results = await retrieve(query, { mode, topK, documentId });

    return NextResponse.json({
      data: results,
      meta: { page: 1, pageSize: topK, total: results.length, totalPages: 1 },
      error: null,
    });
  } catch (error) {
    console.error('GET /api/documents/search error:', error);
    return NextResponse.json(
      buildErrorResponse('Failed to search documents'),
      { status: 500 },
    );
  }
}
