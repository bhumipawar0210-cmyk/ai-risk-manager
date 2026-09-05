# AI Risk Manager

AI Risk Manager is a defense-only merchant operations dashboard for reducing losses from chargebacks, returns abuse, and coordinated fraud patterns.

## What is included

- Chargeback Evidence Responder with explainable rules-based scoring
- Structured evidence response packet generated from merchant-supplied facts
- Honest held-out metrics: precision, recall, F1, accuracy, confusion matrix, and cost asymmetry
- Live synthetic transaction feed with review, protected, and escalate decisions
- Abuse Ring Sentinel showing related-account clusters and shared defensive signals
- Responsive dark fintech dashboard with model-health and operational trend views

## Run locally

```bash
pnpm install
pnpm --filter @workspace/api-server run dev
```

In a second terminal:

```bash
PORT=5173 BASE_PATH=/ pnpm --filter @workspace/ai-risk-manager run dev
```

The app uses the shared Express API at `/api`. The scoring engine is intentionally synthetic and defense-only: it organizes and evaluates merchant-supplied evidence, but does not create or spoof evidence.