import { Router, type IRouter } from "express";
import {
  AnalyzeDisputeBody,
  AnalyzeDisputeResponse,
  GetRiskFeedResponse,
  GetRiskMetricsResponse,
  GetRiskRingsResponse,
  GetRiskSummaryResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

const trend = [
  { day: "Aug 30", prevented: 18200, disputes: 34 },
  { day: "Aug 31", prevented: 24100, disputes: 41 },
  { day: "Sep 01", prevented: 21600, disputes: 38 },
  { day: "Sep 02", prevented: 29300, disputes: 47 },
  { day: "Sep 03", prevented: 27800, disputes: 45 },
  { day: "Sep 04", prevented: 32400, disputes: 52 },
  { day: "Sep 05", prevented: 34780, disputes: 49 },
];

const feed = [
  {
    id: "cb_10482",
    customer: "Aarav Mehta",
    amount: 842.5,
    reason: "Merchandise not received",
    score: 88,
    decision: "protected" as const,
    timestamp: "2 min ago",
    signals: ["Delivery confirmed", "Device match", "Tenure 24m"],
  },
  {
    id: "cb_10481",
    customer: "Priya Shah",
    amount: 219.0,
    reason: "Duplicate charge",
    score: 67,
    decision: "review" as const,
    timestamp: "6 min ago",
    signals: ["Same-day retry", "Device match"],
  },
  {
    id: "cb_10480",
    customer: "Rohan Kapoor",
    amount: 1290.0,
    reason: "Product not as described",
    score: 31,
    decision: "escalate" as const,
    timestamp: "11 min ago",
    signals: ["3 prior disputes", "New device", "High amount"],
  },
  {
    id: "cb_10479",
    customer: "Nisha Verma",
    amount: 74.99,
    reason: "Unauthorized transaction",
    score: 79,
    decision: "protected" as const,
    timestamp: "18 min ago",
    signals: ["Delivery confirmed", "Customer tenure 48m"],
  },
  {
    id: "cb_10478",
    customer: "Vikram Rao",
    amount: 456.0,
    reason: "Refund not processed",
    score: 54,
    decision: "review" as const,
    timestamp: "24 min ago",
    signals: ["Partial refund", "Tenure 7m"],
  },
  {
    id: "cb_10477",
    customer: "Meera Iyer",
    amount: 318.0,
    reason: "Merchandise not received",
    score: 93,
    decision: "protected" as const,
    timestamp: "31 min ago",
    signals: ["Signature captured", "Device match", "Tenure 36m"],
  },
];

const metrics = {
  sampleSize: 164,
  precision: 0.86,
  recall: 0.79,
  f1: 0.82,
  accuracy: 0.88,
  falsePositiveCost: 1840,
  falseNegativeCost: 6720,
  matrix: {
    truePositive: 75,
    trueNegative: 69,
    falsePositive: 12,
    falseNegative: 8,
  },
};

const rings = [
  {
    id: "ring_01",
    label: "Cluster A-17",
    risk: "high" as const,
    members: 8,
    exposure: 18420,
    sharedSignals: ["Device fingerprint", "Address overlap", "Refund cadence"],
  },
  {
    id: "ring_02",
    label: "Cluster B-04",
    risk: "medium" as const,
    members: 5,
    exposure: 7280,
    sharedSignals: ["Payment token", "IP neighborhood"],
  },
  {
    id: "ring_03",
    label: "Cluster C-22",
    risk: "watch" as const,
    members: 11,
    exposure: 3120,
    sharedSignals: ["Shipping address", "Account age"],
  },
];

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

router.get("/risk/summary", (_req, res): void => {
  res.json(
    GetRiskSummaryResponse.parse({
      openDisputes: 49,
      protectedRevenue: 198180,
      winRate: 0.84,
      avgResponseTime: 2.4,
      trend,
    }),
  );
});

router.get("/risk/feed", (_req, res): void => {
  res.json(GetRiskFeedResponse.parse(feed));
});

router.get("/risk/metrics", (_req, res): void => {
  res.json(GetRiskMetricsResponse.parse(metrics));
});

router.get("/risk/rings", (_req, res): void => {
  res.json(GetRiskRingsResponse.parse(rings));
});

router.post("/risk/analyze", (req, res): void => {
  const parsed = AnalyzeDisputeBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const input = parsed.data;
  let score = 46;
  if (input.deliveryConfirmed) score += 24;
  else score -= 14;
  if (input.deviceMatch) score += 13;
  else score -= 12;
  if (input.customerTenureMonths >= 12) score += 11;
  else if (input.customerTenureMonths < 3) score -= 8;
  if (input.priorDisputes === 0) score += 8;
  if (input.priorDisputes >= 2) score -= 20;
  if (input.amount > 750) score -= 5;
  score = clamp(score, 6, 96);

  const winProbability = Number((score / 100).toFixed(2));
  const decision =
    score >= 72 ? ("protected" as const) : score < 42 ? ("escalate" as const) : ("review" as const);
  const deliveryDetail = input.deliveryConfirmed
    ? "Carrier delivery confirmation is present for this order."
    : "No delivery confirmation was supplied; request fulfillment documentation before submission.";
  const deviceDetail = input.deviceMatch
    ? "The dispute was raised from a device previously associated with the order."
    : "The dispute was raised from a device that does not match the order history.";
  const evidence = [
    {
      title: "Fulfillment record",
      detail: deliveryDetail,
      strength: input.deliveryConfirmed ? ("strong" as const) : ("gap" as const),
    },
    {
      title: "Account continuity",
      detail: `Customer tenure is ${input.customerTenureMonths} months with ${input.priorDisputes} prior dispute(s).`,
      strength:
        input.customerTenureMonths >= 12 && input.priorDisputes === 0
          ? ("strong" as const)
          : ("supporting" as const),
    },
    {
      title: "Device continuity",
      detail: deviceDetail,
      strength: input.deviceMatch ? ("supporting" as const) : ("gap" as const),
    },
    {
      title: "Dispute context",
      detail: `Reason code: ${input.reasonCode}. Customer message: “${input.customerMessage}”`,
      strength: "supporting" as const,
    },
  ];

  const rationale =
    decision === "protected"
      ? "The supplied records support a defensible response. Submit the packet with the strongest fulfillment and continuity evidence first."
      : decision === "escalate"
        ? "The supplied records leave material gaps or show repeated dispute behavior. Route to a human reviewer and gather missing documentation."
        : "The supplied records are mixed. Keep the packet in review until the highlighted evidence gaps are resolved.";

  const packet = [
    `CHARGEBACK RESPONSE PACKET — ORDER ${input.orderId}`,
    "",
    `Recommended posture: ${decision.toUpperCase()}`,
    `Model support score: ${score}/100`,
    `Estimated win probability: ${Math.round(winProbability * 100)}%`,
    "",
    "FACTS PROVIDED BY MERCHANT",
    `• Dispute reason: ${input.reasonCode}`,
    `• Disputed amount: ₹${input.amount.toFixed(2)}`,
    `• Customer message: ${input.customerMessage}`,
    `• Delivery confirmed: ${input.deliveryConfirmed ? "Yes" : "No"}`,
    `• Device match: ${input.deviceMatch ? "Yes" : "No"}`,
    `• Customer tenure: ${input.customerTenureMonths} months`,
    `• Prior disputes: ${input.priorDisputes}`,
    "",
    "PROCESSOR NOTE",
    "This packet is an organized summary of merchant-supplied facts for defensive review. Verify every attachment and statement before submitting to a bank or processor.",
  ].join("\n");

  res.json(
    AnalyzeDisputeResponse.parse({
      orderId: input.orderId,
      score,
      winProbability,
      decision,
      rationale,
      evidence,
      packet,
    }),
  );
});

export default router;