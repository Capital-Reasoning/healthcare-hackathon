import 'dotenv/config';
import { runBatch } from '../src/lib/engine/batch';
import type { ModelTier } from '../src/lib/engine/model-provider';

const args = process.argv.slice(2);
function getArg(name: string): string | undefined {
  const idx = args.indexOf(`--${name}`);
  return idx >= 0 ? args[idx + 1] : undefined;
}

const limit = parseInt(getArg('limit') ?? '10', 10);
const concurrency = parseInt(getArg('concurrency') ?? '3', 10);
const tier = (getArg('tier') ?? 'production') as ModelTier;
const force = args.includes('--force');

console.log(`\nBestPath Batch Runner`);
console.log(`  Limit: ${limit}`);
console.log(`  Concurrency: ${concurrency}`);
console.log(`  Model tier: ${tier}`);
console.log(`  Force: ${force}\n`);

runBatch({
  limit,
  concurrency,
  force,
  modelTier: tier,
  onProgress: (completed, total, current) => {
    console.log(`  [${completed}/${total}] Processing ${current}...`);
  },
})
  .then((result) => {
    console.log(`\nBatch complete:`);
    console.log(`  Total: ${result.total}`);
    console.log(`  Completed: ${result.completed}`);
    console.log(`  Failed: ${result.failed}`);
    console.log(`  Skipped: ${result.skipped}`);
    if (result.errors.length > 0) {
      console.log(`\nErrors:`);
      for (const err of result.errors) {
        console.log(`  ${err.patientId}: ${err.error}`);
      }
    }
    process.exit(0);
  })
  .catch((err) => {
    console.error('Batch failed:', err);
    process.exit(1);
  });
