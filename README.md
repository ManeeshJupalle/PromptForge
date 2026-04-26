<div align="center">

# 🔥 PromptForge CLI

**Jest for prompts.**

Test-driven prompting for teams shipping LLM features. Local-first. Multi-provider. Self-hostable dashboard.

[![npm](https://img.shields.io/npm/v/promptforge-cli.svg?color=3B82F6)](https://www.npmjs.com/package/promptforge-cli)
[![license](https://img.shields.io/npm/l/promptforge-cli.svg?color=3B82F6)](./LICENSE)
[![node](https://img.shields.io/node/v/promptforge-cli.svg?color=3B82F6)](https://nodejs.org)
![TypeScript](https://img.shields.io/badge/TypeScript-strict-3B82F6)

<!-- Demo GIF goes here once recorded (see scripts/demo.tape). -->

</div>

---

## Why PromptForge CLI

- **Test-driven prompting.** Write assertions before you ship a prompt.
  Catch regressions the moment a model update or a prompt tweak silently
  breaks an answer.
- **Local-first.** Your tests, your machine, your data. `ollama/llama3.2`
  is a first-class citizen — iterate for free, hit paid models only when
  you need them.
- **Multi-provider.** The same test file runs against Anthropic, OpenAI,
  Gemini, and Ollama. Compare answers side-by-side in the dashboard.
- **Self-hostable dashboard.** Run history, compare view, trend charts.
  Binds to `127.0.0.1` — no third-party in the loop, no SaaS lock-in.

## 30-second quick start

```bash
npm install -g promptforge-cli

cd my-llm-project
promptforge-cli init              # interactive scaffolder
promptforge-cli run               # execute tests
promptforge-cli ui                # open the dashboard
```

## A realistic test file

```yaml
# prompts/triage.test.yaml
prompt: ./triage.md
providers:
  - anthropic/claude-sonnet-4-6
  - openai/gpt-4o-mini
  - ollama/llama3.2

tests:
  - name: classifies billing complaint
    vars:
      message: "I was charged twice for my subscription"
    assert:
      - type: jsonSchema
        schema:
          type: object
          required: [category, urgency, suggested_reply]
          properties:
            category: { enum: [billing, technical, account, other] }
            urgency: { enum: [low, medium, high] }
      - type: contains
        value: billing
      - type: semanticSimilarity
        expected: "I'll escalate this for a refund review"
        threshold: 0.75
      - type: llmJudge
        criteria: "Response is empathetic and offers next steps"
        threshold: 4
      - type: cost
        max: 0.002
      - type: latency
        maxMs: 3000
```

Run it:

```
$ promptforge-cli run

🧪 PromptForge CLI v0.1.0

→ prompts/triage.test.yaml
  ✓ classifies billing complaint (anthropic/claude-sonnet-4-6) 412ms $0.0008
  ✓ classifies billing complaint (openai/gpt-4o-mini) 298ms $0.0001
  ✗ classifies billing complaint (ollama/llama3.2) 189ms

────────────────────────────────────────────
FAIL SUMMARY
────────────────────────────────────────────

prompts/triage.test.yaml

  ╭─ ✗ classifies billing complaint · ollama/llama3.2 ─╮
  │                                                    │
  │  semanticSimilarity — similarity 0.68 below 0.75  │
  │    expected     "I'll escalate this for a refund  │
  │                  review"                           │
  │    similarity   0.680                              │
  │    threshold    0.750                              │
  │    received     "What's up? How can I help?"       │
  │                                                    │
  ╰────────────────────────────────────────────────────╯

Tests     1 failed, 2 passed, 3 total
Providers anthropic, openai, ollama
Cost
  anthropic/claude-sonnet-4-6  $0.0008
  openai/gpt-4o-mini           $0.0001
Duration  1.2s
Run       kf8c-Qx2Vm

Run `promptforge-cli ui` to investigate →
```

## What's in the box

### Providers

| Provider | Models | Env var |
|----------|--------|---------|
| Anthropic | `anthropic/claude-opus-4-7`, `claude-sonnet-4-6`, `claude-haiku-4-5` | `ANTHROPIC_API_KEY` |
| OpenAI | `openai/gpt-4o`, `gpt-4o-mini`, `gpt-4-turbo` | `OPENAI_API_KEY` |
| Google | `gemini/gemini-1.5-pro`, `gemini-1.5-flash`, `gemini-2.0-flash` | `GOOGLE_API_KEY` |
| Ollama | `ollama/<any-local-model>` | `OLLAMA_HOST` *(optional)* |
| Mock | `mock` | — |

### Assertions

| Assertion | What it checks |
|-----------|---------------|
| `contains` / `notContains` | Substring match |
| `regex` | Pattern match |
| `jsonSchema` | Ajv-validated structured output |
| `semanticSimilarity` | Cosine similarity to a reference string (local embeddings) |
| `llmJudge` | Scored rubric from a configurable judge model |
| `snapshot` | Drift detection against the first passing run |
| `cost` / `latency` | Budget guardrails |
| `custom` | TypeScript function assertions (in `.test.ts` files) |

### Reporters

| Flag | Output |
|------|--------|
| *(default)* | Colorized CLI with spinner + boxed failure diagnostics |
| `--reporter json` | Machine-readable JSON to stdout |
| `--reporter junit` | JUnit XML to `promptforge-cli-results.xml` (or `--output <path>`) |

### Commands

```
promptforge-cli run [paths...]       Execute tests
promptforge-cli watch [paths...]     Re-run on change (a/f/p/↵/q)
promptforge-cli init                 Interactive scaffolder
promptforge-cli ui                   Launch the dashboard (127.0.0.1:3939)
promptforge-cli compare <a> <b>      Diff two runs - run IDs, 'latest', 'previous', and 'previous:<runId>' work
promptforge-cli snapshot --update    Accept current outputs as golden
promptforge-cli snapshot --clear     Delete snapshots by pattern
promptforge-cli list                 Show discovered tests
```

## Dashboard

A local, read-only web UI over `.promptforge/db.sqlite`. Runs list,
expandable run detail, side-by-side compare, trend charts, test
explorer with pass-history sparklines.

<!-- Dashboard screenshots (runs view + compare view) go here once captured
     per scripts/capture-screenshots.md. Keeping the markdown out until the
     assets exist so GitHub and npm don't render broken-image placeholders. -->

## Documentation

- [Getting Started](docs/getting-started.md)
- [Test Files](docs/test-files.md) — YAML and TypeScript
- [Assertions Reference](docs/assertions.md)
- [Providers Reference](docs/providers.md)
- [CLI Reference](docs/cli.md)
- [Dashboard Guide](docs/dashboard.md)
- [CI Integration](docs/ci.md)
- [How PromptForge CLI Compares](docs/comparison.md)
- [Known Issues](docs/known-issues.md)

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                           CLI                                │
│  run · watch · init · snapshot · compare · ui · list         │
└──────────────┬──────────────────────────────────────────────┘
               │
       ┌───────▼─────────┐         ┌──────────────────┐
       │  Config Loader  │────────▶│  YAML + TS       │
       │  + discovery    │         │  test discovery  │
       └───────┬─────────┘         └──────────────────┘
               │
       ┌───────▼─────────┐  ┌──────────────────────┐
       │   Test Runner   │──│ Events: onTestStart, │
       │                 │  │ onTestFinish, …       │
       └───────┬─────────┘  └──────────────────────┘
               │
   ┌───────────┼────────────────────────────┐
   │           │                            │
┌──▼────────┐┌─▼────────┐┌──────────┐┌─────▼──────┐
│ Providers ││Assertions││ Reporters ││  Storage   │
├───────────┤├──────────┤├──────────┤│ (SQLite)   │
│ anthropic ││ contains │ │ cli      ││ runs       │
│ openai    ││ regex    │ │ json     ││ results    │
│ gemini    ││ jsonSchema│ │ junit    ││ snapshots  │
│ ollama    ││ semSim   │ └──────────┘└─────┬──────┘
│ mock      ││ llmJudge │                    │
└───────────┘│ snapshot │              ┌────▼────────┐
             │ cost     │              │ Dashboard   │
             │ latency  │              │ (Vite+React)│
             │ custom   │              │ + Hono API  │
             └──────────┘              └─────────────┘
```

## Examples

- [`examples/customer-support/`](examples/customer-support/) — triage
  classifier with `jsonSchema` + `contains` + `semanticSimilarity` +
  cost/latency budgets.
- [`examples/code-review/`](examples/code-review/) — reviewer prompt
  graded on `semanticSimilarity` with cost guardrails.
- [`examples/extraction/`](examples/extraction/) — resume parser with
  strict `jsonSchema` + `snapshot` drift detection.

## Known Issues

See [docs/known-issues.md](docs/known-issues.md) for the full list. Summary:

- **Transitive vulnerability in `protobufjs`** reached via
  `@xenova/transformers`. Mitigated at the resolution level via an
  `overrides` pin to `^7.5.5`; `npm audit --omit=dev` reports zero
  production vulnerabilities. Impact on non-mitigated installs is
  limited to loading untrusted ONNX models (PromptForge CLI only loads from
  pinned HuggingFace repositories).
- **Node 20 `tsx/esm/api.register()`** emits a one-time
  `ExperimentalWarning`. Silence via `NODE_OPTIONS="--no-warnings=ExperimentalWarning"`.
  Clean on Node 22+.
- **Windows programmatic SIGINT** bypasses user signal handlers (Node
  platform quirk). Real-terminal `Ctrl-C` works correctly.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md). TL;DR: clone, `npm install`,
`npm run typecheck`, ship a PR for one concern at a time.

## Roadmap

See [ROADMAP.md](ROADMAP.md). Parallel execution, live-updating
dashboard, dataset fixtures, provider plugins, cost-budget bail — in
roughly that order.

## License

[MIT](./LICENSE)
