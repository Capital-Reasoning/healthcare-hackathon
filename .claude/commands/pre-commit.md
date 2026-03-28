# Pre-Commit Quality Check

Run quality checks and commit if everything passes.

## Steps

### 1. Type checking
Run `npm run typecheck` (tsc --noEmit). If it fails, show the errors and suggest fixes.

### 2. Linting
Run `npm run lint` (eslint + typecheck). Warnings are OK, errors are not. If errors, show them and suggest fixes.

### 3. Console.log check
Search staged files for `console.log` statements that shouldn't be committed. Ignore:
- Files in `src/lib/db/seed.ts` (seed script logging is fine)
- Files in `src/lib/db/setup-indexes.ts`
- Lines with `// eslint-disable` comments
- `console.error` (intentional error logging)

If found, warn the user and list them.

### 4. Build check (optional)
If the user says "full check" or "with build", also run `npm run build`.

### 5. Report results
Show a summary:
```
Typecheck: PASS/FAIL
Lint:      PASS/FAIL (N warnings)
Console:   CLEAN / N console.logs found
Build:     PASS/FAIL/SKIPPED
```

### 6. Commit
If all checks pass (or only warnings):
- Stage the relevant changed files (use `git add` with specific file paths, not `-A`)
- Generate a concise commit message based on the changes
- Create the commit
- Show the commit hash and message

If checks fail:
- Show the errors
- Ask the user if they want to fix and retry, or commit anyway
