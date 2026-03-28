/**
 * Test script for Unstructured API integration.
 * Sends a single HTML file through the partition endpoint with chunking.
 *
 * Usage: npx tsx scripts/test-unstructured.ts
 */

import { UnstructuredClient } from "unstructured-client";
import { Strategy } from "unstructured-client/sdk/models/shared";
import * as fs from "fs";
import * as path from "path";

const API_KEY = process.env.UNSTRUCTURED_API_KEY || "mptD5xOOLBOw0RtGRHG8NxtgL2qz3y";
const SERVER_URL = "https://api.unstructuredapp.io/general/v0/general";

// Pick a test file — using the "about the guidelines" page as it should be a good representative sample
// Try a clinical guideline file for better content quality assessment
const TEST_FILE = path.resolve(
  process.argv[2] ||
  "/Users/petersalmon/Downloads/health-info-date/next-best-pathway-corpus/01_sources/bc_guidelines_core/ana-testing-2cb6d2829b-2cb6d2829bc1.html"
);

async function main() {
  console.log("=== Unstructured API Test ===\n");
  console.log(`File: ${path.basename(TEST_FILE)}`);

  const fileData = fs.readFileSync(TEST_FILE);
  console.log(`File size: ${(fileData.length / 1024).toFixed(1)} KB\n`);

  const client = new UnstructuredClient({
    serverURL: SERVER_URL,
    security: {
      apiKeyAuth: API_KEY,
    },
  });

  console.log("Sending to Unstructured API...");
  console.log("  strategy: hi_res");
  console.log("  chunking_strategy: by_title");
  console.log("  max_characters: 1500");
  console.log("  new_after_n_chars: 1000\n");

  const startTime = Date.now();

  try {
    const res = await client.general.partition({
      partitionParameters: {
        files: {
          content: fileData,
          fileName: path.basename(TEST_FILE),
        },
        strategy: Strategy.HiRes,
        chunkingStrategy: "by_title" as any,
        maxCharacters: 1500,
        newAfterNChars: 1000,
      },
    });

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`API call completed in ${elapsed}s\n`);

    // The SDK response structure may vary by version — inspect what we got
    console.log("Response top-level keys:", Object.keys(res));

    // Try multiple ways to access elements
    const elements: any[] = (res as any).elements
      || (res as any).data
      || (res as any).partitionResponse?.elements
      || (Array.isArray(res) ? res : null)
      || [];

    if (elements.length > 0) {
      console.log(`Total elements/chunks returned: ${elements.length}\n`);

      // Analyze element types
      const typeCounts: Record<string, number> = {};
      let totalTextLen = 0;
      let hasTableHtml = 0;
      const chunkSizes: number[] = [];

      for (const el of elements) {
        const t = el.type || "unknown";
        typeCounts[t] = (typeCounts[t] || 0) + 1;
        const text = el.text || "";
        totalTextLen += text.length;
        chunkSizes.push(text.length);
        if (el.metadata?.text_as_html) {
          hasTableHtml++;
        }
      }

      console.log("--- Element Type Distribution ---");
      for (const [type, count] of Object.entries(typeCounts).sort((a, b) => b[1] - a[1])) {
        console.log(`  ${type}: ${count}`);
      }

      console.log(`\n--- Chunk Size Stats ---`);
      console.log(`  Total text length: ${totalTextLen} chars`);
      console.log(`  Avg chunk size: ${(totalTextLen / elements.length).toFixed(0)} chars`);
      console.log(`  Min chunk size: ${Math.min(...chunkSizes)} chars`);
      console.log(`  Max chunk size: ${Math.max(...chunkSizes)} chars`);
      console.log(`  Elements with text_as_html: ${hasTableHtml}`);

      // Show first 3 chunks as samples
      console.log(`\n--- Sample Chunks ---`);
      for (let i = 0; i < Math.min(3, elements.length); i++) {
        const el = elements[i];
        console.log(`\n[Chunk ${i + 1}] type=${el.type}, ${el.text?.length || 0} chars`);
        console.log(`  metadata keys: ${Object.keys(el.metadata || {}).join(", ")}`);
        if (el.metadata?.parent_id) {
          console.log(`  parent_id: ${el.metadata.parent_id}`);
        }
        if (el.metadata?.orig_elements) {
          console.log(`  orig_elements count: ${el.metadata.orig_elements.length || "N/A"}`);
        }
        console.log(`  text preview: "${(el.text || "").substring(0, 200)}..."`);
        if (el.metadata?.text_as_html) {
          console.log(`  text_as_html preview: "${el.metadata.text_as_html.substring(0, 200)}..."`);
        }
      }

      // Show a middle chunk too
      const midIdx = Math.floor(elements.length / 2);
      if (midIdx >= 3) {
        const el = elements[midIdx];
        console.log(`\n[Chunk ${midIdx + 1} (middle)] type=${el.type}, ${el.text?.length || 0} chars`);
        console.log(`  text preview: "${(el.text || "").substring(0, 200)}..."`);
      }

      // Show chunk with text_as_html if any
      const htmlChunk = elements.find((el: any) => el.metadata?.text_as_html);
      if (htmlChunk) {
        console.log(`\n--- Chunk with text_as_html ---`);
        console.log(`  type: ${htmlChunk.type}`);
        console.log(`  text (${htmlChunk.text?.length} chars): "${htmlChunk.text?.substring(0, 500)}"`);
        console.log(`  text_as_html (${htmlChunk.metadata.text_as_html.length} chars): "${htmlChunk.metadata.text_as_html.substring(0, 500)}"`);
      }

      // Show full text of chunk 2 (usually the first real content chunk, after nav)
      if (elements.length > 1) {
        console.log(`\n--- Full Text of Chunk 2 (first content chunk) ---`);
        console.log(elements[1].text);
      }

      // Show full text of chunk 3 if it exists
      if (elements.length > 2) {
        console.log(`\n--- Full Text of Chunk 3 ---`);
        console.log(elements[2].text);
      }

      // Show chunk size distribution
      console.log(`\n--- Chunk Size Distribution ---`);
      const buckets = [0, 250, 500, 750, 1000, 1250, 1500];
      for (let i = 0; i < buckets.length - 1; i++) {
        const count = chunkSizes.filter(s => s >= buckets[i] && s < buckets[i+1]).length;
        if (count > 0) console.log(`  ${buckets[i]}-${buckets[i+1]}: ${count} chunks`);
      }
      const over1500 = chunkSizes.filter(s => s >= 1500).length;
      if (over1500 > 0) console.log(`  1500+: ${over1500} chunks`);

    } else {
      console.log(`No elements found in response.`);
      console.log("Response preview:", JSON.stringify(res, null, 2).substring(0, 2000));
    }
  } catch (err: any) {
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    console.error(`Error after ${elapsed}s:`, err.message || err);
    if (err.body) {
      console.error("Response body:", JSON.stringify(err.body, null, 2).substring(0, 1000));
    }
    if (err.statusCode) {
      console.error("Status code:", err.statusCode);
    }
  }
}

main();
