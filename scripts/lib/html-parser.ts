/**
 * Track A: HTML parser using cheerio.
 * Strips boilerplate, extracts content by heading hierarchy, preserves tables.
 * Outputs standardized ParsedChunk shape compatible with Track B (Unstructured).
 */

import * as cheerio from 'cheerio';

export interface ParsedChunk {
  text: string;
  textAsHtml: string | null;
  heading: string | null;
  pageNumber: number | null;
  chunkIndex: number;
  chunkType: 'text' | 'table' | 'list';
  emphasizedText: string[];
}

interface ChunkOptions {
  maxChunkSize?: number;
  minChunkSize?: number;
  overlap?: number;
}

const DEFAULTS: Required<ChunkOptions> = {
  maxChunkSize: 1500,
  minChunkSize: 80,
  overlap: 200,
};

// Selectors to strip as boilerplate
const STRIP_SELECTORS = [
  'script',
  'style',
  'noscript',
  'iframe',
  'svg',
  'nav',
  'header',
  'footer',
  '.sidebar',
  '.nav',
  '.navigation',
  '.menu',
  '.breadcrumb',
  '.breadcrumbs',
  '.cookie',
  '.cookie-notice',
  '.cookie-banner',
  '.banner',
  '.skip-link',
  '.site-header',
  '.site-footer',
  '.site-nav',
  '.topbar',
  '.toolbar',
  '[role="navigation"]',
  '[role="banner"]',
  '[role="contentinfo"]',
  // BC gov specific
  '.header__hide',
  '.header__container',
  '.header-menu',
  '.slide-out',
  '#cmf-ui-header',
  '#cmf-ui-site-notifications',
  '.topicPageBreadCrumb__container',
  '.find-information-menu',
  '.more-menu',
  // Hypertension Canada specific
  '.guidelines-sidebar-menu',
  '.ul-side-menu',
  '.event-banner-section',
  '.w-nav-icon',
  '.w-nav-options',
  '.l-subheader',
  // Diabetes Canada specific
  '#head script',
  '.aspNetHidden',
  // Generic footer/bottom
  '.footer',
  '.bottom-nav',
  '.back-to-top',
  '.social-share',
  '.print-button',
  '.feedback',
  '#loader',
];

// Content area selectors, in priority order
const CONTENT_SELECTORS = [
  'main',
  'article',
  '[role="main"]',
  '#page-content',
  '#content',
  '#main-content',
  '.content',
  '.main-content',
  '.article-content',
  '.post-content',
  '.entry-content',
  '.page-content',
  // BC Gov
  '.topicPageLayout__container',
  '#cmf-ui-topic-page-layout',
  // Hypertension/Diabetes Canada
  '.wpb_text_column',
  '.vc_column-inner',
  // Generic fallback — widest content column
  '.vc_col-sm-6',
  '.vc_col-sm-9',
  '.vc_col-sm-8',
];

/**
 * Parse an HTML file into standardized chunks.
 */
export function parseHtml(
  html: string,
  options?: ChunkOptions,
): ParsedChunk[] {
  const opts = { ...DEFAULTS, ...options };
  const $ = cheerio.load(html);

  // Strip boilerplate
  for (const sel of STRIP_SELECTORS) {
    $(sel).remove();
  }

  // Find main content area
  let $content: cheerio.Cheerio<any> | null = null;
  for (const sel of CONTENT_SELECTORS) {
    const found = $(sel);
    if (found.length > 0 && found.text().trim().length > 200) {
      $content = found.first();
      break;
    }
  }

  // Fallback: use body
  if (!$content) {
    $content = $('body');
  }

  if (!$content || $content.text().trim().length < 50) {
    return [];
  }

  // Walk the content and split into sections by headings
  const sections = extractSections($, $content);

  // Convert sections to chunks with size limits
  const chunks: ParsedChunk[] = [];
  let chunkIndex = 0;

  for (const section of sections) {
    if (section.type === 'table') {
      const text = section.text.trim();
      if (text.length < opts.minChunkSize) continue;

      if (text.length <= opts.maxChunkSize) {
        // Table fits in one chunk
        chunks.push({
          text,
          textAsHtml: section.html,
          heading: section.heading,
          pageNumber: null,
          chunkIndex: chunkIndex++,
          chunkType: 'table',
          emphasizedText: section.emphasized,
        });
      } else {
        // Table too large — split by rows, preserving header row in each part
        const tableParts = splitTable(
          text,
          section.html,
          opts.maxChunkSize,
        );
        for (let p = 0; p < tableParts.length; p++) {
          const part = tableParts[p]!;
          if (part.text.trim().length >= opts.minChunkSize) {
            const partLabel =
              tableParts.length > 1
                ? `[Table part ${p + 1} of ${tableParts.length}] `
                : '';
            chunks.push({
              text: partLabel + part.text,
              textAsHtml: part.html,
              heading: section.heading,
              pageNumber: null,
              chunkIndex: chunkIndex++,
              chunkType: 'table',
              emphasizedText: section.emphasized,
            });
          }
        }
      }
    } else {
      // Text sections — split if too large
      const text = section.text.trim();
      if (text.length < opts.minChunkSize) continue;

      if (text.length <= opts.maxChunkSize) {
        chunks.push({
          text,
          textAsHtml: null,
          heading: section.heading,
          pageNumber: null,
          chunkIndex: chunkIndex++,
          chunkType: section.type === 'list' ? 'list' : 'text',
          emphasizedText: section.emphasized,
        });
      } else {
        // Split large sections at paragraph boundaries
        const subChunks = splitText(text, opts.maxChunkSize);
        for (const sub of subChunks) {
          if (sub.trim().length >= opts.minChunkSize) {
            chunks.push({
              text: sub.trim(),
              textAsHtml: null,
              heading: section.heading,
              pageNumber: null,
              chunkIndex: chunkIndex++,
              chunkType: 'text',
              emphasizedText: section.emphasized,
            });
          }
        }
      }
    }
  }

  // Apply overlap
  if (opts.overlap > 0 && chunks.length > 1) {
    applyOverlap(chunks, opts.overlap);
  }

  return chunks;
}

interface Section {
  type: 'text' | 'table' | 'list';
  heading: string | null;
  text: string;
  html: string | null;
  emphasized: string[];
}

function extractSections(
  $: cheerio.CheerioAPI,
  $content: cheerio.Cheerio<any>,
): Section[] {
  const sections: Section[] = [];
  let currentHeading: string | null = null;
  let currentTextParts: string[] = [];
  let currentEmphasized: string[] = [];

  function flushText() {
    const text = currentTextParts.join('\n').trim();
    if (text) {
      sections.push({
        type: 'text',
        heading: currentHeading,
        text,
        html: null,
        emphasized: [...currentEmphasized],
      });
    }
    currentTextParts = [];
    currentEmphasized = [];
  }

  // Process children recursively but at the top content level
  $content.find('*').each((_i, el) => {
    const $el = $(el);
    const tag = el.type === 'tag' ? (el as any).name?.toLowerCase() : '';

    // Skip if this element is inside a table (handled separately)
    if ($el.parents('table').length > 0) return;

    // Heading — start new section
    if (/^h[1-3]$/.test(tag)) {
      flushText();
      currentHeading = $el.text().trim();
      return;
    }

    // Table — extract as separate chunk
    if (tag === 'table') {
      flushText();
      const tableText = extractTableText($, $el);
      const tableHtml = $.html($el);
      if (tableText.trim().length > 20) {
        // Collect emphasized text from table
        const tableEmph: string[] = [];
        $el.find('strong, b, em, th').each((_j, emphEl) => {
          const t = $(emphEl).text().trim();
          if (t && t.length > 2) tableEmph.push(t);
        });

        sections.push({
          type: 'table',
          heading: currentHeading,
          text: tableText,
          html: tableHtml,
          emphasized: tableEmph,
        });
      }
      return;
    }

    // Paragraph, list item, div with direct text
    if (/^(p|li|dd|dt|blockquote)$/.test(tag)) {
      const text = $el.text().trim();
      if (text) {
        currentTextParts.push(text);

        // Track emphasized text
        $el
          .find('strong, b, em')
          .each((_j, emphEl) => {
            const t = $(emphEl).text().trim();
            if (t && t.length > 2) currentEmphasized.push(t);
          });
      }
    }
  });

  flushText();
  return sections;
}

function extractTableText(
  $: cheerio.CheerioAPI,
  $table: cheerio.Cheerio<any>,
): string {
  const rows: string[] = [];
  $table.find('tr').each((_i, tr) => {
    const cells: string[] = [];
    $(tr)
      .find('th, td')
      .each((_j, cell) => {
        cells.push($(cell).text().trim().replace(/\s+/g, ' '));
      });
    if (cells.some((c) => c)) {
      rows.push(cells.join(' | '));
    }
  });
  return rows.join('\n');
}

/**
 * Split an oversized table into parts, preserving the header row in each part.
 * Returns [{text, html}] where html is a reconstructed <table> per part.
 */
function splitTable(
  text: string,
  html: string | null,
  maxSize: number,
): { text: string; html: string | null }[] {
  const rows = text.split('\n').filter((r) => r.trim());
  if (rows.length <= 1) return [{ text, html }];

  // First row is the header
  const headerRow = rows[0]!;
  const dataRows = rows.slice(1);

  // Also extract HTML header if available
  let htmlHeader = '';
  if (html) {
    const theadMatch = html.match(/<thead[\s\S]*?<\/thead>/i);
    const firstTrMatch = html.match(/<tr[\s\S]*?<\/tr>/i);
    htmlHeader = theadMatch?.[0] || firstTrMatch?.[0] || '';
  }

  // Group data rows into chunks that fit within maxSize (including header)
  const parts: { text: string; html: string | null }[] = [];
  let currentTextRows: string[] = [];
  let currentSize = headerRow.length + 1; // +1 for newline

  for (const row of dataRows) {
    if (currentSize + row.length + 1 > maxSize && currentTextRows.length > 0) {
      // Flush current part
      parts.push({
        text: headerRow + '\n' + currentTextRows.join('\n'),
        html: html
          ? `<table>${htmlHeader}<tbody>${currentTextRows.map((r) => `<tr><td>${r}</td></tr>`).join('')}</tbody></table>`
          : null,
      });
      currentTextRows = [];
      currentSize = headerRow.length + 1;
    }
    currentTextRows.push(row);
    currentSize += row.length + 1;
  }

  // Flush remaining
  if (currentTextRows.length > 0) {
    parts.push({
      text: headerRow + '\n' + currentTextRows.join('\n'),
      html: html
        ? `<table>${htmlHeader}<tbody>${currentTextRows.map((r) => `<tr><td>${r}</td></tr>`).join('')}</tbody></table>`
        : null,
    });
  }

  return parts.length > 0 ? parts : [{ text, html }];
}

function splitText(text: string, maxSize: number): string[] {
  if (text.length <= maxSize) return [text];

  const separators = ['\n\n', '\n', '. '];

  for (const sep of separators) {
    const parts = text.split(sep);
    if (parts.length <= 1) continue;

    const chunks: string[] = [];
    let current = '';

    for (const part of parts) {
      const candidate = current ? current + sep + part : part;
      if (candidate.length <= maxSize) {
        current = candidate;
      } else {
        if (current) chunks.push(current);
        if (part.length > maxSize) {
          chunks.push(...splitText(part, maxSize));
          current = '';
        } else {
          current = part;
        }
      }
    }
    if (current) chunks.push(current);
    if (chunks.length > 1) return chunks;
  }

  // Hard split
  const chunks: string[] = [];
  for (let i = 0; i < text.length; i += maxSize) {
    chunks.push(text.slice(i, i + maxSize));
  }
  return chunks;
}

function applyOverlap(chunks: ParsedChunk[], overlapSize: number): void {
  for (let i = 1; i < chunks.length; i++) {
    const prev = chunks[i - 1]!;
    const curr = chunks[i]!;

    if (prev.text.length <= overlapSize) continue;

    const overlap = prev.text.slice(-overlapSize);
    const breakIdx = Math.max(
      overlap.lastIndexOf('. '),
      overlap.lastIndexOf('\n'),
    );
    const clean =
      breakIdx > 0 ? overlap.slice(breakIdx + 1).trim() : overlap.trim();

    if (clean.length > 0) {
      curr.text = `${clean}\n\n${curr.text}`;
    }
  }
}

/**
 * Extract the document title from HTML.
 */
export function extractTitle(html: string): string {
  const $ = cheerio.load(html);
  return (
    $('title').text().trim() ||
    $('h1').first().text().trim() ||
    'Untitled'
  );
}
