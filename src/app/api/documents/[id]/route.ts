import { NextResponse } from 'next/server';
import { buildErrorResponse } from '@/lib/db/queries/helpers';
import {
  getDocumentById,
  deleteDocument,
} from '@/lib/db/queries/documents';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const doc = await getDocumentById(id);

    if (!doc) {
      return NextResponse.json(buildErrorResponse('Document not found'), {
        status: 404,
      });
    }

    return NextResponse.json({ data: doc, meta: null, error: null });
  } catch (error) {
    console.error('GET /api/documents/[id] error:', error);
    return NextResponse.json(
      buildErrorResponse('Failed to fetch document'),
      { status: 500 },
    );
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    await deleteDocument(id);

    return NextResponse.json({ data: { deleted: true }, meta: null, error: null });
  } catch (error) {
    console.error('DELETE /api/documents/[id] error:', error);
    return NextResponse.json(
      buildErrorResponse('Failed to delete document'),
      { status: 500 },
    );
  }
}
