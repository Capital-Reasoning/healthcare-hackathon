import { NextResponse } from 'next/server';
import { getChunkById } from '@/lib/db/queries/documents';
import { buildErrorResponse } from '@/lib/db/queries/helpers';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json(buildErrorResponse('Chunk ID is required'), {
        status: 400,
      });
    }

    const chunk = await getChunkById(id);

    if (!chunk) {
      return NextResponse.json(buildErrorResponse('Chunk not found'), {
        status: 404,
      });
    }

    return NextResponse.json({
      data: chunk,
      meta: null,
      error: null,
    });
  } catch (error) {
    return NextResponse.json(
      buildErrorResponse(
        error instanceof Error ? error.message : 'Failed to fetch chunk',
      ),
      { status: 500 },
    );
  }
}
