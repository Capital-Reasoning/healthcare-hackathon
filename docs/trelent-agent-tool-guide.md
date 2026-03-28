# Trelent Agent Tools — Complete Builder's Guide

> **Audience:** AI agents and developers building automated pipelines with Trelent Agents.
> **Source:** https://docs.trelent.com/agents · https://github.com/Trelent/agents-demo

---

## Table of Contents

1. [What is Trelent Agents?](#1-what-is-trelent-agents)
2. [Core Architecture](#2-core-architecture)
3. [Prerequisites & Installation](#3-prerequisites--installation)
4. [Building a Sandbox](#4-building-a-sandbox)
5. [Registering & Listing Sandboxes](#5-registering--listing-sandboxes)
6. [Creating and Managing Runs](#6-creating-and-managing-runs)
7. [Supported Models](#7-supported-models)
8. [Imports & Exports](#8-imports--exports)
9. [Forking Runs](#9-forking-runs)
10. [Full End-to-End Example](#10-full-end-to-end-example)
11. [Demo Repo Reference (agents-demo)](#11-demo-repo-reference-agents-demo)
12. [Local Testing Workflow](#12-local-testing-workflow)
13. [Key Patterns & Best Practices](#13-key-patterns--best-practices)

---

## 1. What is Trelent Agents?

Trelent Agents is a platform for building and running AI agents inside **Docker sandboxes**. It solves the core friction points of agent development:

- **Tools are just CLI programs.** You don't define tools via function schemas — you install programs into a Docker image. The agent invokes them through its built-in `bash` tool.
- **Sandboxes are portable.** The same Docker image runs in Trelent's cloud *and* locally, so testing is exact — no environment drift between dev and prod.
- **Runs are the execution unit.** A run = one prompt execution inside one sandbox using one model. Runs are async and pollable.
- **Forking enables branching.** Any completed run can be forked into a child run that inherits the parent's sandbox and model, letting you branch work without re-running setup.

The design philosophy: **your sandbox defines capabilities, your prompt defines intent.**

---

## 2. Core Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Trelent Platform                      │
│                                                         │
│  ┌──────────────┐    ┌──────────────┐                   │
│  │   Sandbox    │    │     Run      │                   │
│  │ (Docker img) │───▶│  (execution) │                   │
│  │              │    │              │                   │
│  │  /skills/    │    │  sandbox     │                   │
│  │  CLI tools   │    │  model       │                   │
│  │              │    │  prompt      │                   │
│  └──────────────┘    │  imports     │                   │
│                      │  exports     │                   │
│                      └──────────────┘                   │
│                             │                           │
│                             ▼                           │
│                     ┌──────────────┐                    │
│                     │  Fork (child │                    │
│                     │    run)      │                    │
│                     └──────────────┘                    │
└─────────────────────────────────────────────────────────┘
```

### Concept Glossary

| Concept     | Description                                                                                               |
| ----------- | --------------------------------------------------------------------------------------------------------- |
| **Sandbox** | A Docker image pushed to `agents.trelent.com`. Defines what tools the agent can use.                      |
| **Skills**  | Markdown files at `/skills/` inside the sandbox. The agent reads them at runtime to learn what it can do. |
| **Run**     | One async execution of a prompt inside a sandbox. Has a status and a result.                              |
| **Imports** | Data moved *into* the run environment at `/mnt/` before execution.                                        |
| **Exports** | Data moved *out* of the run environment after execution.                                                  |
| **Fork**    | A child run that inherits a parent run's sandbox and model, with a new prompt.                            |

### Built-in Agent Tools

The agent has three tools built in regardless of sandbox contents:

| Tool         | Purpose                                                              |
| ------------ | -------------------------------------------------------------------- |
| `read_file`  | Read any file in the sandbox filesystem                              |
| `write_file` | Write any file in the sandbox filesystem                             |
| `bash`       | Execute any shell command — this is how CLI tools become agent tools |

Everything you install into the sandbox becomes an agent capability via `bash`.

---

## 3. Prerequisites & Installation

```bash
# Install Docker: https://docs.docker.com/get-docker/

# Install the Trelent SDK
pip install trelent-agents

# For the demo repo (uses uv)
uv sync
```

**Python version:** 3.11+

You'll also need Docker running locally to build and push sandbox images.

---

## 4. Building a Sandbox

A sandbox is a Docker image with:
- CLI tools installed (these become agent capabilities)
- A `/skills/` directory containing markdown files that teach the agent what it can do

### Step 1 — Create the project folder

```bash
mkdir my-agent
cd my-agent
mkdir skills
```

### Step 2 — Write a Skill

Skills are markdown files that explain available tools with usage examples. The agent reads these at runtime.

**`skills/my-skill.md`**
```markdown
# My Skill Name

Brief description of what this skill enables.

## Examples

# Example command invocations
my-cli-tool --flag value "input"
my-cli-tool --other-flag "another input"

## Notes

Any caveats, supported options, or relevant details.
```

**Good skills include:**
- The exact CLI command syntax
- Concrete usage examples
- Notes on supported options/formats

### Step 3 — Write the Dockerfile

Install your CLI tools and copy skills in:

```dockerfile
FROM python:3.12-slim

# Install whatever CLI tools your agent needs
RUN apt-get update \
    && apt-get install -y your-cli-tool another-tool

# Copy skills into the standard location
COPY skills/ /skills/

# Keep-alive loop — Trelent terminates gracefully via /shutdown/terminate
CMD ["sh", "-c", "while true; do \
    if [ -f /shutdown/terminate ]; then exit 0; fi; \
    sleep 1; \
done"]
```

**Important:** The `CMD` keep-alive pattern is required. Trelent signals shutdown by creating `/shutdown/terminate`.

### Step 4 — Build and Push

Images are pushed to the Trelent registry at `agents.trelent.com`:

```bash
export IMAGE=agents.trelent.com/my-agent:latest

docker build -t $IMAGE .
docker push $IMAGE
```

### Complete Dockerfile Example (Translator)

```dockerfile
FROM python:3.12-slim

RUN apt-get update \
    && apt-get install -y translate-shell

COPY skills/ /skills/

CMD ["sh", "-c", "while true; do \
    if [ -f /shutdown/terminate ]; then exit 0; fi; \
    sleep 1; \
done"]
```

**`skills/translate.md`**
```markdown
# Translate

You can translate text using the `trans` CLI.

## Examples

trans -b en:es "Hello, world"
trans -b es:en "Hola, mundo"

Supported languages: en, es, fr, de, it, pt, ru, zh, ja, ko.
```

---

## 5. Registering & Listing Sandboxes

After pushing an image, register it with Trelent before creating runs:

```python
from trelent_agents import Client

client = Client()

# Register the sandbox (first time only)
client.sandboxes.register("my-agent:latest")

# List all registered sandboxes
sandboxes = client.sandboxes.list()
print(sandboxes)
# => ["my-agent:latest", "translator:latest", ...]
```

Registration is a one-time operation per image tag. Subsequent pushes of the same tag don't require re-registration.

---

## 6. Creating and Managing Runs

### Create a Run

```python
from trelent_agents import Client

client = Client()

run = client.runs.create(
    sandbox="translator:latest",
    model="claude-sonnet-4-5",
    prompt="""
Read /skills/translate.md to learn what tools you have.
Translate "The weather is nice today." to Spanish.
""",
)

print(run.id, run.status)
# => run_1234567890  pending
```

### Get a Run by ID

```python
run = client.runs.get("run_1234567890")
print(run.status)
```

### Poll Until Complete

Runs are async. Poll `run.status` until it equals `"complete"`:

```python
while run.status != "complete":
    run.refresh()

print(run.result)
# => "El clima está agradable hoy."
```

**Tip from the demo repo:** Poll every 2 seconds to avoid rate limits:
```python
import time

while run.status != "complete":
    run.refresh()
    time.sleep(2)
    print(f"Status: {run.status}")

print("Result:", run.result)
```

### Run Properties

| Property     | Description                                                  |
| ------------ | ------------------------------------------------------------ |
| `run.id`     | Unique run identifier (e.g. `run_1234567890`)                |
| `run.status` | Current status: `pending`, `running`, `complete`             |
| `run.result` | Final agent response (available when `status == "complete"`) |

---

## 7. Supported Models

Specify the model when creating a run. Trelent routes to the correct provider automatically.

| Model string        | Provider  |
| ------------------- | --------- |
| `claude-sonnet-4-5` | Anthropic |
| `claude-haiku-4-5`  | Anthropic |
| `gpt-5.4`           | OpenAI    |

```python
run = client.runs.create(
    sandbox="my-agent:latest",
    model="claude-sonnet-4-5",  # or "claude-haiku-4-5" or "gpt-5.4"
    prompt="...",
)
```

**Guidance:**
- Use `claude-sonnet-4-5` for most tasks (best balance of speed and capability)
- Use `claude-haiku-4-5` for high-volume, low-complexity tasks where cost matters
- Use `gpt-5.4` for OpenAI-specific use cases

---

## 8. Imports & Exports

### Imports — Moving Data In

Imports bring data into the run environment *before* execution. Imported files appear at `/mnt/` inside the sandbox.

#### LocalImporter

Uploads a local directory into the run:

```python
from trelent_agents import Client, LocalImporter

client = Client()

run = client.runs.create(
    sandbox="translator:latest",
    model="claude-sonnet-4-5",
    prompt="Translate all files in /mnt/ to Spanish.",
    imports=[
        LocalImporter(path="./documents"),
    ],
)
```

The SDK tarballs and uploads the directory. Contents appear at `/mnt/` in the sandbox at runtime.

**Multiple imports** can be provided in the list:
```python
imports=[
    LocalImporter(path="./input-docs"),
    LocalImporter(path="./config"),
]
```

### Exports — Moving Data Out

Exports persist outputs *after* execution.

#### S3Exporter

Exports to an S3 bucket:

```python
from trelent_agents import Client, S3Exporter

run = client.runs.create(
    sandbox="translator:latest",
    model="claude-sonnet-4-5",
    prompt="Translate files to Spanish. Save output to /output/.",
    exports=[
        S3Exporter(),
    ],
)
```

**Pattern:** Have the agent write output files to `/output/` via the prompt, then configure the exporter to pick them up.

### Combining Imports + Exports

```python
run = client.runs.create(
    sandbox="translator:latest",
    model="claude-sonnet-4-5",
    prompt="""
Read /skills/translate.md to learn your tools.
Translate all files in /mnt/ to Spanish.
Save translations to /output/.
""",
    imports=[
        LocalImporter(path="./input"),
    ],
    exports=[
        S3Exporter(),
    ],
)
```

---

## 9. Forking Runs

Forking creates a child run that **inherits the parent's sandbox and model**, but runs a new prompt. This is useful for:
- Branching to try multiple variations (e.g. translate to different languages)
- Continuing work from a checkpoint
- Building multi-step pipelines where each step forks from the previous

### Fork from a run object

```python
child_run = run.fork(
    prompt="Now translate that to French instead.",
    imports=[
        LocalImporter(path="./documents"),
    ],
)
```

### Fork from a stored run ID

```python
from trelent_agents import Client

client = Client()

parent_run = client.runs.get("run_1234567890")

sibling_run = parent_run.fork(
    prompt="Translate the same text to German.",
    imports=[
        LocalImporter(path="./documents"),
    ],
)
```

### Fork semantics

- The fork inherits `sandbox` and `model` from the parent
- The fork gets its own `run.id` and runs independently
- Imports are re-provided at fork time (not automatically inherited)
- Exports can be configured independently per fork

---

## 10. Full End-to-End Example

This example combines sandbox, imports, exports, and forking to translate files to Spanish, then fork to French.

### Sandbox (Dockerfile)

```dockerfile
FROM python:3.12-slim

RUN apt-get update \
    && apt-get install -y translate-shell

COPY skills/ /skills/

CMD ["sh", "-c", "while true; do \
    if [ -f /shutdown/terminate ]; then exit 0; fi; \
    sleep 1; \
done"]
```

### Build & Push

```bash
export IMAGE=agents.trelent.com/translator:latest
docker build -t $IMAGE .
docker push $IMAGE
```

### Python Script

```python
from trelent_agents import Client, LocalImporter, S3Exporter

client = Client()

sandbox = "translator:latest"

# Register (first time only)
client.sandboxes.register(sandbox)

# Create a run that translates files to Spanish
run = client.runs.create(
    sandbox=sandbox,
    model="claude-sonnet-4-5",
    prompt="""
Read /skills/translate.md to learn your tools.
Translate all files in /mnt/ to Spanish.
Save translations to /output/.
""",
    imports=[
        LocalImporter(path="./input"),
    ],
    exports=[
        S3Exporter(),
    ],
)

print(f"Run ID: {run.id}")

# Poll until complete
while run.status != "complete":
    run.refresh()

print("Spanish translations:", run.result)

# Fork to translate the same files to French
french_run = run.fork(
    prompt="Now translate the same files to French.",
    imports=[
        LocalImporter(path="./input"),
    ],
    exports=[
        S3Exporter(),
    ],
)

while french_run.status != "complete":
    french_run.refresh()

print("French translations:", french_run.result)
```

### What happens step by step

1. Files from `./input/` are uploaded and appear at `/mnt/` inside the sandbox
2. The agent reads `/skills/translate.md` to learn the `trans` CLI syntax
3. The agent translates each file to Spanish using bash
4. Results are written to `/output/` and exported to S3
5. The fork inherits the sandbox (`translator:latest`) and model (`claude-sonnet-4-5`)
6. The fork re-imports `./input/` files and translates them to French
7. French results are also exported to S3

---

## 11. Demo Repo Reference (agents-demo)

The [agents-demo repo](https://github.com/Trelent/agents-demo) includes two pre-built sandboxes and a complete set of helper scripts.

### Pre-built Sandboxes

| Sandbox        | Tools installed               | Use case                  |
| -------------- | ----------------------------- | ------------------------- |
| `translator`   | `trans` (translate-shell CLI) | Text translation          |
| `data-handler` | `csvkit`                      | CSV processing & analysis |

### Build & Push Both Sandboxes

```bash
# Translator
docker build -t agents.trelent.com/translator:latest translator-agent/
docker push agents.trelent.com/translator:latest

# Data handler
docker build -t agents.trelent.com/data-handler:latest data-handler/
docker push agents.trelent.com/data-handler:latest
```

### Scripts Reference

| Script                              | What it does                                    |
| ----------------------------------- | ----------------------------------------------- |
| `src/register_agent.py`             | List sandboxes; pass `--register` to register   |
| `src/create_run.py`                 | Create a simple translation run; outputs Run ID |
| `src/create_run_with_import.py`     | Create run with `./input/` files imported       |
| `src/create_run_with_export.py`     | Create run with imports + S3 export             |
| `src/track_run.py <run_id>`         | Poll run status every 2s until complete         |
| `src/fork_run.py <run_id> "prompt"` | Fork an existing run with a new prompt          |

### Sample Input Files (`input/`)

| File               | Contents                  |
| ------------------ | ------------------------- |
| `greeting.txt`     | Welcome message           |
| `menu.txt`         | Restaurant menu           |
| `instructions.txt` | Assembly instructions     |
| `sales.csv`        | Sales transaction records |
| `customers.csv`    | Customer records          |
| `inventory.csv`    | Inventory levels          |

### Example Workflow Using Demo Scripts

```bash
# 1. Register sandboxes
python src/register_agent.py --register

# 2. Create a run with imports
python src/create_run_with_import.py
# Output: Run ID: run_abc123

# 3. Track the run
python src/track_run.py run_abc123

# 4. Fork to another language
python src/fork_run.py run_abc123 "Translate to German"
# Output: Child Run ID: run_def456

# 5. Track the fork
python src/track_run.py run_def456
```

---

## 12. Local Testing Workflow

One of Trelent's key design choices: **local testing uses the exact same environment as production.**

To test your sandbox locally:

```bash
# Run the container interactively
docker run -it --rm \
  -v ./input:/mnt \
  -v ./skills:/skills \
  agents.trelent.com/translator:latest \
  bash

# Now you're inside the sandbox — install your preferred coding agent
# e.g. Claude Code, Aider, etc.
# Give it the same prompt you'd use in a Run
```

Because the local container is identical to what Trelent runs, any prompt that works locally will work in a production run — same tools, same filesystem paths, same skill files.

---

## 13. Key Patterns & Best Practices

### 1. Always instruct the agent to read its skills

The agent doesn't automatically know what's in `/skills/`. Explicitly instruct it:

```python
prompt="""
Read /skills/translate.md to learn what tools you have.
Then translate all files in /mnt/ to Spanish.
"""
```

### 2. Be explicit about output paths

Tell the agent exactly where to write results, especially when using exports:

```python
prompt="...Save all output files to /output/."
```

### 3. Skills should include working examples

Vague descriptions don't help. Include real, copy-pasteable CLI invocations:

```markdown
# Good skill
## Examples
trans -b en:fr "Hello"          # Output: Bonjour
csvstat --csv sales.csv         # Prints column stats as CSV

# Bad skill
## Description
You can translate text and analyze CSV files.
```

### 4. Use forking instead of creating new runs for variations

```python
# Instead of this:
es_run = client.runs.create(sandbox=..., model=..., prompt="...Spanish...")
fr_run = client.runs.create(sandbox=..., model=..., prompt="...French...")

# Do this (cheaper, inherits context):
es_run = client.runs.create(sandbox=..., model=..., prompt="...Spanish...")
fr_run = es_run.fork(prompt="...French...")
```

### 5. Keep skills focused and single-purpose

One skill per capability. Multiple small skill files are easier for the agent to reason about than one large file:

```
skills/
  translate.md     # trans CLI
  csv-analyze.md   # csvkit stats
  csv-convert.md   # csvkit format conversion
```

### 6. Poll with a delay

The Trelent API is async. Add a sleep in your polling loop:

```python
import time

while run.status != "complete":
    run.refresh()
    time.sleep(2)
```

### 7. Structure multi-step pipelines with forking

For workflows that need sequential phases:

```python
# Phase 1: collect data
phase1 = client.runs.create(sandbox="data-handler:latest", model="claude-sonnet-4-5",
    prompt="Analyze /mnt/sales.csv and output a summary to /output/summary.json",
    imports=[LocalImporter(path="./data")],
    exports=[S3Exporter()])

while phase1.status != "complete":
    phase1.refresh()

# Phase 2: fork and act on phase 1's result
phase2 = phase1.fork(
    prompt=f"Based on this summary: {phase1.result}, generate a report...",
    exports=[S3Exporter()])
```

### 8. The CMD keep-alive is required

Always include the shutdown-aware keep-alive in your Dockerfile CMD. Without it, the container will exit immediately and your run will fail:

```dockerfile
CMD ["sh", "-c", "while true; do \
    if [ -f /shutdown/terminate ]; then exit 0; fi; \
    sleep 1; \
done"]
```

---

## Quick Reference

### Minimum viable run

```python
from trelent_agents import Client

client = Client()
client.sandboxes.register("my-sandbox:latest")

run = client.runs.create(
    sandbox="my-sandbox:latest",
    model="claude-sonnet-4-5",
    prompt="Your instruction here.",
)

while run.status != "complete":
    run.refresh()

print(run.result)
```

### Minimum viable Dockerfile

```dockerfile
FROM python:3.12-slim

RUN apt-get update && apt-get install -y your-tool

COPY skills/ /skills/

CMD ["sh", "-c", "while true; do if [ -f /shutdown/terminate ]; then exit 0; fi; sleep 1; done"]
```

### All imports/exports available

```python
from trelent_agents import (
    Client,
    LocalImporter,   # Upload local directory to /mnt/
    S3Exporter,      # Export /output/ contents to S3
)
```

### SDK method summary

| Method                                                         | Description                           |
| -------------------------------------------------------------- | ------------------------------------- |
| `client.sandboxes.register(name)`                              | Register a pushed image               |
| `client.sandboxes.list()`                                      | List all registered sandboxes         |
| `client.runs.create(sandbox, model, prompt, imports, exports)` | Create a new run                      |
| `client.runs.get(run_id)`                                      | Fetch a run by ID                     |
| `run.refresh()`                                                | Update run status and result in place |
| `run.fork(prompt, imports, exports)`                           | Create a child run from this run      |

---

*Sources: https://docs.trelent.com/agents · https://github.com/Trelent/agents-demo*