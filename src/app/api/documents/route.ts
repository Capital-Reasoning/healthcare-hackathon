import { NextResponse } from 'next/server';
import {
  parsePaginationParams,
  buildPaginatedResponse,
  buildErrorResponse,
} from '@/lib/db/queries/helpers';
import { getDocuments } from '@/lib/db/queries/documents';
import { db } from '@/lib/db/client';
import { documents } from '@/lib/db/schema';
import { ingestDocument } from '@/lib/rag/ingest';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const pagination = parsePaginationParams(searchParams);

    const { data, total } = await getDocuments(pagination);
    return NextResponse.json(buildPaginatedResponse(data, total, pagination));
  } catch (error) {
    console.error('GET /api/documents error:', error);
    return NextResponse.json(
      buildErrorResponse('Failed to fetch documents'),
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const contentType = request.headers.get('content-type') ?? '';

    // File upload — triggers full ingestion pipeline
    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      const file = formData.get('file') as File | null;

      if (!file) {
        return NextResponse.json(
          buildErrorResponse('No file provided'),
          { status: 400 },
        );
      }

      const title =
        (formData.get('title') as string) ||
        file.name.replace(/\.\w+$/, '');
      const tagsRaw = formData.get('tags') as string | null;
      const tags = tagsRaw ? JSON.parse(tagsRaw) : undefined;

      const result = await ingestDocument(
        file,
        file.name,
        file.type || 'application/octet-stream',
        file.size,
        { title, tags },
      );

      return NextResponse.json(
        { data: result, meta: null, error: null },
        { status: 201 },
      );
    }

    // JSON body — metadata-only document create (existing path)
    const body = await request.json();

    const [created] = await db
      .insert(documents)
      .values({
        title: body.title,
        filename: body.filename,
        mimeType: body.mimeType,
        fileSize: body.fileSize,
        pageCount: body.pageCount,
        tags: body.tags,
        metadata: body.metadata,
      })
      .returning();

    return NextResponse.json(
      { data: created, meta: null, error: null },
      { status: 201 },
    );
  } catch (error) {
    console.error('POST /api/documents error:', error);
    return NextResponse.json(
      buildErrorResponse('Failed to create document'),
      { status: 500 },
    );
  }
}
