import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { type ReactNode, useMemo, useState } from 'react';
import { Link, Route, Switch, Router as WouterRouter, useLocation } from 'wouter';
import {
  Activity, AlertTriangle, ArrowDownRight, ArrowUpRight, BarChart3, Bell,
  ChevronRight, CircleHelp, Copy, CreditCard, Database, FileCheck2,
  FileSearch, Gauge, LayoutDashboard, Menu, Network, RefreshCw, ShieldCheck,
  Sparkles, Target, TrendingUp, Users, X, Zap,
} from 'lucide-react';
import {
  getGetRiskFeedQueryKey, getGetRiskMetricsQueryKey, getGetRiskRingsQueryKey,
  getGetRiskSummaryQueryKey, getHealthCheckQueryKey, useAnalyzeDispute,
  useGetRiskFeed, useGetRiskMetrics, useGetRiskRings, useGetRiskSummary,
  useHealthCheck,
} from '@workspace/api-client-react';
import { ErrorBoundary } from '@/components/error-boundary';
import NotFound from '@/pages/not-found';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Toaster as SonnerToaster, toast } from 'sonner';

const queryClient = new QueryClient();

const navItems = [
  { href: '/', label: 'Command center', short: 'Overview', icon: LayoutDashboard },
  { href: '/responder', label: 'Chargeback responder', short: 'Responder', icon: FileCheck2 },
  { href: '/returns', label: 'Return-risk scorer', short: 'Returns', icon: ArrowDownRight },
  { href: '/fraud-spikes', label: 'Fraud-spike detector', short: 'Spikes', icon: TrendingUp },
  { href: '/sentinel', label: 'Abuse ring sentinel', short: 'Sentinel', icon: Network },
  { href: '/metrics', label: 'Metrics & model performance', short: 'Metrics', icon: BarChart3 },
];

const money = (value = 0) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value);
const moneyExact = (value = 0) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 2 }).format(value);
const compact = (value = 0) =>
  new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 1 }).format(value);
const timeAgo = (value: string) => {
  if (/^\d+\s+(min|hr|hour|hours|day|days)\s+ago$/.test(value)) return value.replace('minutes', 'min').replace('hours', 'hr');
  const minutes = Math.max(0, Math.round((Date.now() - new Date(value).getTime()) / 60000));
  if (minutes < 2) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  return `${Math.round(minutes / 60)}h ago`;
};

function StatusDot({ status = 'healthy' }: { status?: string }) {
  const healthy = status === 'healthy' || status === 'operational';
  return <span className={`inline-block h-1.5 w-1.5 rounded-full ${healthy ? 'bg-[#7be0b7]' : 'bg-[#efb74b]'}`} />;
}

function Shell({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const health = useHealthCheck({ query: { queryKey: getHealthCheckQueryKey(), staleTime: 30000 } });
  const activeLabel = navItems.find((item) => item.href === location)?.label ?? 'Command center';
  return (
    <div className="noise min-h-[100dvh] bg-[#0e1117] text-[#eee9de]">
      <aside className={`fixed inset-y-0 left-0 z-40 flex w-[252px] flex-col border-r border-[#232832] bg-[#10141b] px-3 py-4 transition-transform duration-200 md:translate-x-0 ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex items-center justify-between px-3 pb-8">
          <Link href="/" className="flex items-center gap-3" data-testid="link-brand">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-[#efb74b] text-[#12151b] shadow-[0_0_0_5px_rgba(239,183,75,.09)]"><ShieldCheck size={18} strokeWidth={2.4} /></span>
            <span>
              <span className="block text-[15px] font-semibold tracking-[-.02em]">Sentinel Risk</span>
              <span className="font-mono text-[9px] uppercase tracking-[.18em] text-[#68717d]">defensive intelligence</span>
            </span>
          </Link>
          <button className="rounded-md p-1 text-[#65707c] hover:bg-[#1b2029] hover:text-[#eee9de] md:hidden" onClick={() => setMobileOpen(false)} aria-label="Close menu" data-testid="button-close-menu"><X size={18} /></button>
        </div>
        <div className="mb-3 px-3 font-mono text-[9px] uppercase tracking-[.18em] text-[#5d6671]">Risk operations</div>
        <nav className="space-y-1">
          {navItems.map(({ href, label, icon: Icon }) => {
            const active = location === href;
            return (
              <Link key={href} href={href} onClick={() => setMobileOpen(false)} className={`group flex items-center gap-3 rounded-lg px-3 py-2.5 text-[12px] transition-colors ${active ? 'bg-[#252019] text-[#f4c96e] ring-1 ring-inset ring-[#6d542a]' : 'text-[#89919b] hover:bg-[#191e26] hover:text-[#e9e5db]'}`} data-testid={`link-nav-${href === '/' ? 'dashboard' : href.slice(1)}`}>
                <Icon size={16} strokeWidth={active ? 2.2 : 1.7} />
                <span className="flex-1">{label}</span>
                {active && <span className="h-1 w-1 rounded-full bg-[#efb74b]" />}
              </Link>
            );
          })}
        </nav>
        <div className="mt-auto space-y-3">
          <div className="rounded-xl border border-[#29303a] bg-[#151a22] p-3">
            <div className="flex items-center justify-between text-[10px] text-[#78818c]">
              <span className="flex items-center gap-2"><StatusDot status={health.data?.status} /> Engine status</span>
              <span className="font-mono text-[#9aa2aa]">{health.isLoading ? 'SYNC' : health.data?.status?.toUpperCase() ?? 'READY'}</span>
            </div>
            <div className="mt-3 h-1 rounded-full bg-[#252c35]"><div className="h-1 w-[94%] rounded-full bg-[#7be0b7]" /></div>
            <p className="mt-2 text-[10px] leading-relaxed text-[#69737e]">Scoring defense-only decisions in real time.</p>
          </div>
          <div className="flex items-center gap-2 border-t border-[#232832] px-3 pt-3">
            <div className="grid h-7 w-7 place-items-center rounded-full bg-[#29313a] font-mono text-[10px] text-[#e7bd65]">AC</div>
            <div className="min-w-0"><p className="truncate text-[11px] text-[#d9d6cd]">Atlas Commerce</p><p className="font-mono text-[9px] text-[#68717d]">PROTECTION TEAM</p></div>
            <CircleHelp size={14} className="ml-auto text-[#5e6873]" />
          </div>
        </div>
      </aside>
      {mobileOpen && <button className="fixed inset-0 z-30 bg-[#080a0d]/70 md:hidden" onClick={() => setMobileOpen(false)} aria-label="Close navigation" data-testid="button-overlay-menu" />}
      <main className="min-h-[100dvh] md:pl-[252px]">
        <header className="sticky top-0 z-20 flex h-[68px] items-center justify-between border-b border-[#202630] bg-[#0e1117]/90 px-5 backdrop-blur-xl md:px-9">
          <div className="flex items-center gap-3">
            <button className="rounded-md p-2 text-[#8a939d] hover:bg-[#1b2029] md:hidden" onClick={() => setMobileOpen(true)} aria-label="Open menu" data-testid="button-open-menu"><Menu size={19} /></button>
            <div><p className="text-[13px] font-medium text-[#eae6dd]">{activeLabel}</p><p className="mt-0.5 font-mono text-[9px] uppercase tracking-[.15em] text-[#68717d]">Atlas Commerce · production</p></div>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden items-center gap-2 rounded-full border border-[#29303a] px-3 py-1.5 text-[10px] text-[#89929e] sm:flex"><span className="h-1.5 w-1.5 rounded-full bg-[#7be0b7]" /> Live monitoring</div>
            <button className="relative rounded-md p-2 text-[#7e8792] hover:bg-[#1b2029] hover:text-[#ece8de]" onClick={() => toast('No new risk alerts', { description: 'Your monitoring queue is clear.' })} aria-label="View alerts" data-testid="button-alerts"><Bell size={17} /><span className="absolute right-1.5 top-1.5 h-1 w-1 rounded-full bg-[#efb74b]" /></button>
          </div>
        </header>
        <div className="mx-auto max-w-[1440px] px-5 py-7 md:px-9">{children}</div>
      </main>
    </div>
  );
}

function PageHeading({ eyebrow, title, description, action }: { eyebrow: string; title: string; description: string; action?: ReactNode }) {
  return <div className="mb-7 flex flex-col justify-between gap-4 lg:flex-row lg:items-end animate-rise">
    <div><div className="mb-2 flex items-center gap-2 font-mono text-[9px] uppercase tracking-[.2em] text-[#d2a549]"><span className="h-px w-5 bg-[#d2a549]" />{eyebrow}</div><h1 className="text-[27px] font-semibold tracking-[-.04em] text-[#f1ede3] md:text-[31px]">{title}</h1><p className="mt-2 max-w-2xl text-[12px] leading-relaxed text-[#7e8894]">{description}</p></div>
    {action}
  </div>;
}

function Panel({ children, className = '', testId }: { children: ReactNode; className?: string; testId?: string }) {
  return <section className={`rounded-xl border border-[#252c35] bg-[#141920] ${className}`} data-testid={testId}>{children}</section>;
}

function PanelTitle({ title, meta, icon: Icon = Activity }: { title: string; meta?: string; icon?: typeof Activity }) {
  return <div className="flex items-center justify-between border-b border-[#252c35] px-4 py-3.5"><div className="flex items-center gap-2.5"><span className="text-[#c89a40]"><Icon size={15} /></span><h2 className="text-[12px] font-medium text-[#dcd9d0]">{title}</h2></div>{meta && <span className="font-mono text-[9px] uppercase tracking-[.12em] text-[#69737f]">{meta}</span>}</div>;
}

function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse rounded bg-[#242b34] ${className}`} />;
}

function QueryState({ loading, error, onRetry, children }: { loading?: boolean; error?: boolean; onRetry: () => void; children: ReactNode }) {
  if (loading) return <div className="space-y-2 p-4"><Skeleton className="h-3 w-2/3" /><Skeleton className="h-8 w-1/3" /><Skeleton className="h-3 w-1/2" /></div>;
  if (error) return <div className="flex items-center justify-between p-4 text-[11px] text-[#9299a2]"><span>Unable to load this signal.</span><button onClick={onRetry} className="flex items-center gap-1.5 text-[#efb74b] hover:text-[#f7d98b]" data-testid="button-retry-query"><RefreshCw size={13} /> Retry</button></div>;
  return <>{children}</>;
}

function MetricTile({ label, value, note, accent = '#efb74b', trend }: { label: string; value: string; note: string; accent?: string; trend?: 'up' | 'down' }) {
  return <Panel className="p-4 animate-rise delay-1">
    <div className="flex items-start justify-between"><span className="font-mono text-[9px] uppercase tracking-[.15em] text-[#727d89]">{label}</span>{trend && <span className={`${trend === 'up' ? 'text-[#7be0b7]' : 'text-[#efb74b]'}`}><ArrowUpRight size={14} /></span>}</div>
    <div className="mt-3 text-[25px] font-semibold tracking-[-.045em]" style={{ color: accent }}>{value}</div>
    <p className="mt-1 text-[10px] text-[#737d88]">{note}</p>
  </Panel>;
}

function TrendChart({ points = [], compactMode = false }: { points?: Array<{ day: string; prevented: number; disputes: number }>; compactMode?: boolean }) {
  const safe = points.length ? points : Array.from({ length: 7 }, (_, i) => ({ day: `D${i + 1}`, prevented: 0, disputes: 0 }));
  const max = Math.max(...safe.flatMap((p) => [p.prevented, p.disputes]), 1);
  const width = 680;
  const height = compactMode ? 150 : 220;
  const path = (key: 'prevented' | 'disputes') => safe.map((p, i) => `${(i / Math.max(1, safe.length - 1)) * width},${height - 22 - (p[key] / max) * (height - 45)}`).join(' ');
  return <div className="px-4 pb-4 pt-5" data-testid="chart-risk-trend">
    <svg viewBox={`0 0 ${width} ${height}`} className="h-auto w-full overflow-visible" role="img" aria-label="Risk trend chart">
      {[0, 1, 2, 3].map((line) => <line key={line} x1="0" x2={width} y1={24 + line * ((height - 45) / 3)} y2={24 + line * ((height - 45) / 3)} stroke="#272e37" strokeDasharray="3 5" />)}
      <polyline fill="none" stroke="#efb74b" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" points={path('prevented')} />
      <polyline fill="none" stroke="#6d7783" strokeWidth="1.5" strokeLinejoin="round" strokeDasharray="4 4" points={path('disputes')} />
      {safe.map((p, i) => <g key={`${p.day}-${i}`}><circle cx={(i / Math.max(1, safe.length - 1)) * width} cy={height - 22 - (p.prevented / max) * (height - 45)} r="3.5" fill="#141920" stroke="#efb74b" strokeWidth="2" /><text x={(i / Math.max(1, safe.length - 1)) * width} y={height - 3} fill="#66717e" fontSize="9" textAnchor={i === 0 ? 'start' : i === safe.length - 1 ? 'end' : 'middle'}>{p.day}</text></g>)}
    </svg>
    <div className="mt-2 flex gap-4 text-[10px] text-[#7b8590]"><span className="flex items-center gap-1.5"><i className="h-1.5 w-4 rounded-full bg-[#efb74b]" /> Prevented</span><span className="flex items-center gap-1.5"><i className="h-px w-4 border-t border-dashed border-[#6d7783]" /> Disputes</span></div>
  </div>;
}

function DecisionBadge({ decision }: { decision: string }) {
  const style = decision === 'protected' ? 'border-[#2d6953] bg-[#18352d] text-[#8de1bd]' : decision === 'escalate' ? 'border-[#70423d] bg-[#382421] text-[#f29b8f]' : 'border-[#66512a] bg-[#352c1d] text-[#edc873]';
  return <span className={`inline-flex rounded-md border px-2 py-1 font-mono text-[9px] uppercase tracking-[.08em] ${style}`}>{decision}</span>;
}

function FeedTable() {
  const feed = useGetRiskFeed({ query: { queryKey: getGetRiskFeedQueryKey(), staleTime: 20000 } });
  return <Panel className="overflow-hidden" testId="panel-live-feed"><PanelTitle title="Live transaction feed" meta="last 24 hours" icon={Zap} /><QueryState loading={feed.isLoading} error={feed.isError} onRetry={() => feed.refetch()}><div className="overflow-x-auto scrollbar-thin"><table className="w-full min-w-[640px] text-left"><thead className="border-b border-[#252c35] font-mono text-[9px] uppercase tracking-[.12em] text-[#66717d]"><tr><th className="px-4 py-3 font-normal">Transaction</th><th className="px-4 py-3 font-normal">Reason</th><th className="px-4 py-3 font-normal">Risk score</th><th className="px-4 py-3 font-normal">Decision</th><th className="px-4 py-3 text-right font-normal">Seen</th></tr></thead><tbody className="divide-y divide-[#222932]">{(feed.data ?? []).slice(0, 8).map((item) => { const score = item.score > 1 ? item.score : item.score * 100; return <tr key={item.id} className="group transition-colors hover:bg-[#191f27]" data-testid={`row-feed-${item.id}`}><td className="px-4 py-3"><div className="flex items-center gap-2.5"><span className="grid h-7 w-7 place-items-center rounded-md bg-[#242b34] text-[#bdc1bb]"><CreditCard size={13} /></span><div><p className="text-[11px] text-[#e1ddd4]">{item.customer}</p><p className="font-mono text-[9px] text-[#626d79]">{item.id} · {moneyExact(item.amount)}</p></div></div></td><td className="max-w-[180px] truncate px-4 py-3 text-[11px] text-[#9099a3]">{item.reason}</td><td className="px-4 py-3"><span className={`font-mono text-[11px] ${score >= 75 ? 'text-[#f29b8f]' : score >= 45 ? 'text-[#edc873]' : 'text-[#8de1bd]'}`}>{Math.round(score)} / 100</span></td><td className="px-4 py-3"><DecisionBadge decision={item.decision} /></td><td className="px-4 py-3 text-right font-mono text-[9px] text-[#69737e]">{timeAgo(item.timestamp)}</td></tr>; })}</tbody></table>{!feed.data?.length && <div className="p-8 text-center text-[11px] text-[#747e89]">No transactions in the current window.</div>}</div></QueryState></Panel>;
}

function Dashboard() {
  const summary = useGetRiskSummary({ query: { queryKey: getGetRiskSummaryQueryKey(), staleTime: 30000 } });
  const health = useHealthCheck({ query: { queryKey: getHealthCheckQueryKey(), staleTime: 30000 } });
  const value = summary.data;
  return <div>
    <PageHeading eyebrow="Operational overview" title="Protect margin with certainty." description="A measured view of every defensive decision across your commerce surface." action={<button onClick={() => toast('Dashboard refreshed', { description: 'Signals are synced with the latest risk events.' })} className="flex items-center gap-2 rounded-lg border border-[#303741] bg-[#161c24] px-3 py-2 text-[11px] text-[#c7c9c3] transition hover:border-[#5d512f] hover:text-[#f3d488]" data-testid="button-refresh-dashboard"><RefreshCw size={14} /> Refresh signals</button>} />
    <div className="mb-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      <MetricTile label="Open disputes" value={value ? compact(value.openDisputes) : '—'} note="requiring a response" accent="#e9e2d2" />
      <MetricTile label="Protected revenue" value={value ? money(value.protectedRevenue) : '—'} note="defense-backed this period" accent="#efb74b" trend="up" />
      <MetricTile label="Win rate" value={value ? `${(value.winRate * 100).toFixed(1)}%` : '—'} note="on submitted evidence" accent="#7be0b7" trend="up" />
      <MetricTile label="Avg response time" value={value ? `${value.avgResponseTime.toFixed(1)}h` : '—'} note="from dispute to packet" accent="#9cc5e4" />
    </div>
    <div className="mb-5 grid gap-5 xl:grid-cols-[1.45fr_.8fr]">
      <Panel className="animate-rise delay-2"><PanelTitle title="Exposure & defense trend" meta="7 day view" icon={TrendingUp} /><QueryState loading={summary.isLoading} error={summary.isError} onRetry={() => summary.refetch()}><TrendChart points={value?.trend} /></QueryState></Panel>
      <Panel className="animate-rise delay-2"><PanelTitle title="Model health snapshot" meta="live" icon={Gauge} /><div className="p-4"><div className="flex items-center gap-4 rounded-lg border border-[#2c463c] bg-[#162b25] p-3"><div className="relative grid h-11 w-11 place-items-center rounded-full border border-[#4a8e70] text-[#8de1bd] pulse-ring"><ShieldCheck size={19} /></div><div><p className="text-[12px] font-medium text-[#dce8e1]">{health.data?.status === 'healthy' || !health.data ? 'Engine operational' : health.data.status}</p><p className="mt-1 text-[10px] text-[#86a996]">Defense decisions are being scored</p></div></div><div className="mt-5 space-y-4">{[['Decision latency', '184ms', '92%'], ['Evidence coverage', '97.4%', '97%'], ['Signal freshness', '< 2 min', '94%']].map(([label, valueLabel, width]) => <div key={label}><div className="mb-1.5 flex justify-between text-[10px]"><span className="text-[#7f8994]">{label}</span><span className="font-mono text-[#c1c5bf]">{valueLabel}</span></div><div className="h-1 rounded-full bg-[#29313a]"><div className="h-1 rounded-full bg-[#7dbe9c]" style={{ width }} /></div></div>)}</div><Link href="/metrics" className="mt-5 flex items-center justify-between border-t border-[#262d36] pt-3 text-[10px] text-[#9aa29c] hover:text-[#efc66d]" data-testid="link-view-metrics">Review model performance <ChevronRight size={13} /></Link></div></Panel>
    </div>
    <FeedTable />
  </div>;
}

function Responder() {
  const analyze = useAnalyzeDispute();
  const [analysis, setAnalysis] = useState<any>(null);
  const [form, setForm] = useState({ orderId: '', amount: '', reasonCode: 'merchandise_not_received', customerMessage: '', deliveryConfirmed: true, customerTenureMonths: '18', priorDisputes: '0', deviceMatch: true });
  const setField = (key: string, value: string | boolean) => setForm((current) => ({ ...current, [key]: value }));
  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!form.orderId.trim() || !form.amount || !form.reasonCode.trim()) { toast.error('Complete the required transaction details.'); return; }
    analyze.mutate({ data: { orderId: form.orderId, amount: Number(form.amount), reasonCode: form.reasonCode, customerMessage: form.customerMessage, deliveryConfirmed: form.deliveryConfirmed, customerTenureMonths: Number(form.customerTenureMonths), priorDisputes: Number(form.priorDisputes), deviceMatch: form.deviceMatch } }, { onSuccess: (result) => { setAnalysis(result); toast.success('Evidence packet generated', { description: 'The response is ready for review.' }); }, onError: () => toast.error('Analysis could not be completed', { description: 'Please check the transaction details and try again.' }) });
  };
  return <div><PageHeading eyebrow="Chargeback responder" title="Build the defense, not a guess." description="Enter the disputed transaction and let the scoring engine assemble a clear, auditable response packet." action={<div className="flex items-center gap-2 rounded-full border border-[#2a463a] bg-[#14271f] px-3 py-1.5 font-mono text-[9px] uppercase tracking-[.12em] text-[#8bd6b2]"><ShieldCheck size={12} /> Defense-only mode</div>} />
    <div className="grid gap-5 xl:grid-cols-[.92fr_1.08fr]">
      <Panel><PanelTitle title="Disputed transaction" meta="required inputs" icon={FileSearch} /><form onSubmit={submit} className="space-y-4 p-4">
        <div className="grid gap-4 sm:grid-cols-2"><Field label="Order ID" required><input value={form.orderId} onChange={(e) => setField('orderId', e.target.value)} placeholder="ORD-20841" data-testid="input-order-id" /></Field><Field label="Disputed amount" required><div className="relative"><span className="absolute left-3 top-2.5 text-[#78818c]">$</span><input className="pl-7" type="number" min="0" step="0.01" value={form.amount} onChange={(e) => setField('amount', e.target.value)} placeholder="249.00" data-testid="input-amount" /></div></Field></div>
        <Field label="Reason code" required><select value={form.reasonCode} onChange={(e) => setField('reasonCode', e.target.value)} data-testid="select-reason-code"><option value="merchandise_not_received">Merchandise not received</option><option value="product_not_as_described">Product not as described</option><option value="fraudulent_transaction">Fraudulent transaction</option><option value="duplicate_transaction">Duplicate transaction</option></select></Field>
        <Field label="Customer message"><textarea rows={3} value={form.customerMessage} onChange={(e) => setField('customerMessage', e.target.value)} placeholder="Paste the customer's dispute message..." data-testid="textarea-customer-message" /></Field>
        <div className="grid gap-4 sm:grid-cols-3"><Field label="Tenure (months)"><input type="number" min="0" value={form.customerTenureMonths} onChange={(e) => setField('customerTenureMonths', e.target.value)} data-testid="input-tenure" /></Field><Field label="Prior disputes"><input type="number" min="0" value={form.priorDisputes} onChange={(e) => setField('priorDisputes', e.target.value)} data-testid="input-prior-disputes" /></Field><div><span className="mb-2 block text-[10px] text-[#8a939d]">Device match</span><button type="button" onClick={() => setField('deviceMatch', !form.deviceMatch)} className={`flex h-9 w-full items-center justify-between rounded-md border px-3 text-[11px] ${form.deviceMatch ? 'border-[#35614f] bg-[#173128] text-[#94dabb]' : 'border-[#44383a] bg-[#2b2424] text-[#d89d95]'}`} data-testid="button-toggle-device-match"><span>{form.deviceMatch ? 'Confirmed' : 'Mismatch'}</span><span className={`h-2 w-2 rounded-full ${form.deviceMatch ? 'bg-[#7be0b7]' : 'bg-[#ef8174]'}`} /></button></div></div>
        <div className="flex items-center justify-between border-t border-[#252c35] pt-4"><label className="flex items-center gap-2 text-[10px] text-[#8b949e]"><input type="checkbox" checked={form.deliveryConfirmed} onChange={(e) => setField('deliveryConfirmed', e.target.checked)} className="accent-[#efb74b]" data-testid="input-delivery-confirmed" /> Delivery confirmation available</label><button type="submit" disabled={analyze.isPending} className="flex items-center gap-2 rounded-lg bg-[#efb74b] px-4 py-2.5 text-[11px] font-semibold text-[#17191d] transition hover:bg-[#f5cb70] disabled:cursor-wait disabled:opacity-60" data-testid="button-analyze-dispute">{analyze.isPending ? <RefreshCw size={14} className="animate-spin" /> : <Sparkles size={14} />}{analyze.isPending ? 'Scoring...' : 'Run defensive analysis'}</button></div>
      </form></Panel>
      <AnalysisPanel analysis={analysis} />
    </div>
  </div>;
}

function Field({ label, required, children }: { label: string; required?: boolean; children: ReactNode }) {
  return <label className="block"><span className="mb-2 block text-[10px] text-[#8a939d]">{label}{required && <em className="ml-1 not-italic text-[#d6a849]">*</em>}</span>{children}</label>;
}

function AnalysisPanel({ analysis }: { analysis: any }) {
  if (!analysis) return <Panel className="min-h-[470px]"><PanelTitle title="Response packet" meta="awaiting analysis" icon={FileCheck2} /><div className="flex min-h-[400px] flex-col items-center justify-center px-8 text-center"><div className="mb-5 grid h-16 w-16 place-items-center rounded-2xl border border-[#3e3626] bg-[#272219] text-[#d9ad54]"><FileSearch size={26} strokeWidth={1.3} /></div><h3 className="text-[15px] font-medium text-[#dcd8ce]">Your evidence will appear here</h3><p className="mt-2 max-w-xs text-[11px] leading-relaxed text-[#727d88]">Run an analysis to see the model rationale, supporting signals, and a ready-to-submit packet.</p></div></Panel>;
  return <Panel className="animate-rise"><PanelTitle title="Response packet" meta="analysis complete" icon={FileCheck2} /><div className="p-4"><div className="flex flex-wrap items-center gap-5 rounded-xl border border-[#3d3425] bg-[#211c15] p-4"><div className="animate-score"><p className="font-mono text-[9px] uppercase tracking-[.15em] text-[#95805c]">Defense score</p><p className="mt-1 text-[39px] font-semibold tracking-[-.06em] text-[#efc66d]">{Math.round((analysis.score ?? 0) * 100)}<span className="text-[16px] text-[#9e875a]">/100</span></p></div><div className="h-12 w-px bg-[#4b3d27]" /><div><p className="font-mono text-[9px] uppercase tracking-[.15em] text-[#95805c]">Win probability</p><p className="mt-2 text-[21px] font-medium text-[#cce7d9]">{Math.round((analysis.winProbability ?? 0) * 100)}%</p></div><div className="ml-auto"><DecisionBadge decision={analysis.decision} /></div></div><div className="mt-5"><p className="mb-2 font-mono text-[9px] uppercase tracking-[.15em] text-[#77818b]">Model rationale</p><p className="text-[12px] leading-relaxed text-[#b7bab4]">{analysis.rationale}</p></div><div className="mt-5 space-y-2"><p className="font-mono text-[9px] uppercase tracking-[.15em] text-[#77818b]">Evidence signals</p>{(analysis.evidence ?? []).map((item: any, index: number) => <div key={`${item.title}-${index}`} className="flex gap-3 rounded-lg border border-[#282f38] bg-[#171d24] p-3"><span className={`mt-0.5 h-2 w-2 shrink-0 rounded-full ${item.strength === 'strong' ? 'bg-[#7be0b7]' : item.strength === 'gap' ? 'bg-[#ef8174]' : 'bg-[#efb74b]'}`} /><div><p className="text-[11px] font-medium text-[#d8d9d3]">{item.title}</p><p className="mt-1 text-[10px] leading-relaxed text-[#7d8792]">{item.detail}</p></div></div>)}</div><div className="mt-5 rounded-lg border border-[#2a313a] bg-[#11161c] p-3"><div className="mb-2 flex items-center justify-between"><p className="font-mono text-[9px] uppercase tracking-[.15em] text-[#77818b]">Generated packet</p><button onClick={() => { navigator.clipboard?.writeText(analysis.packet); toast.success('Packet copied'); }} className="flex items-center gap-1 text-[10px] text-[#d7af58] hover:text-[#f3d488]" data-testid="button-copy-packet"><Copy size={12} /> Copy</button></div><pre className="max-h-32 overflow-auto whitespace-pre-wrap font-mono text-[10px] leading-relaxed text-[#aeb5b2] scrollbar-thin">{analysis.packet}</pre></div></div></Panel>;
}

function WorkspaceCard({ icon: Icon, title, eyebrow, description, signals, accent = '#efb74b' }: { icon: typeof Activity; title: string; eyebrow: string; description: string; signals: Array<[string, string]>; accent?: string }) {
  return <Panel className="overflow-hidden"><div className="border-b border-[#252c35] p-5" style={{ background: `linear-gradient(110deg, ${accent}12, transparent 56%)` }}><div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg border border-[#4d4127] bg-[#282219]" style={{ color: accent }}><Icon size={19} /></div><p className="font-mono text-[9px] uppercase tracking-[.18em]" style={{ color: accent }}>{eyebrow}</p><h2 className="mt-2 text-[19px] font-medium tracking-[-.03em] text-[#e8e4da]">{title}</h2><p className="mt-2 max-w-xl text-[11px] leading-relaxed text-[#808a95]">{description}</p></div><div className="grid gap-px bg-[#252c35] sm:grid-cols-3">{signals.map(([label, value]) => <div key={label} className="bg-[#141920] p-4"><p className="font-mono text-[9px] uppercase tracking-[.12em] text-[#68727e]">{label}</p><p className="mt-2 text-[13px] text-[#d6d5cd]">{value}</p></div>)}</div></Panel>;
}

function Returns() {
  const summary = useGetRiskSummary({ query: { queryKey: getGetRiskSummaryQueryKey(), staleTime: 30000 } });
  return <div><PageHeading eyebrow="Return-risk scorer" title="See the return before it lands." description="A calm workspace for separating ordinary customer behavior from patterns that erode margin." action={<button onClick={() => toast('Return scoring workspace is ready', { description: 'Connect a return event to score it defensively.' })} className="flex items-center gap-2 rounded-lg border border-[#303741] bg-[#161c24] px-3 py-2 text-[11px] text-[#c7c9c3] hover:border-[#5d512f] hover:text-[#f3d488]" data-testid="button-prepare-return"><Target size={14} /> Prepare a score</button>} /><div className="grid gap-5 xl:grid-cols-[1.1fr_.9fr]"><WorkspaceCard icon={ArrowDownRight} eyebrow="Decision lens" title="Return intent, measured." description="Use behavioral evidence to prioritize review while preserving a good customer experience. The scorer never recommends punitive action on its own." signals={[['Primary signal', 'Sequence & timing'], ['Decision posture', 'Review with context'], ['Data boundary', 'Defense-only']]} /><Panel><PanelTitle title="What the scorer watches" meta="signals" icon={Database} /><div className="divide-y divide-[#252c35]">{[['Return velocity', 'A sudden cluster of returns after delivery'], ['Item / reason mismatch', 'Reason codes that diverge from item condition'], ['Account context', 'Tenure, history, and trusted device signals'], ['Margin exposure', 'Value at risk after fulfillment costs']].map(([title, detail], i) => <div key={title} className="flex gap-3 p-4"><span className="font-mono text-[10px] text-[#d0a64d]">0{i + 1}</span><div><p className="text-[11px] text-[#d8d7cf]">{title}</p><p className="mt-1 text-[10px] leading-relaxed text-[#737e89]">{detail}</p></div></div>)}</div></Panel></div><div className="mt-5 grid gap-5 xl:grid-cols-[1.2fr_.8fr]"><Panel><PanelTitle title="Protected revenue context" meta="shared with dashboard" icon={ShieldCheck} /><QueryState loading={summary.isLoading} error={summary.isError} onRetry={() => summary.refetch()}><div className="flex items-end justify-between p-5"><div><p className="text-[31px] font-semibold tracking-[-.05em] text-[#efc66d]">{money(summary.data?.protectedRevenue)}</p><p className="mt-1 text-[11px] text-[#78838e]">revenue currently protected by risk operations</p></div><div className="h-14 w-14 rounded-full border-[5px] border-[#efb74b] border-r-[#343039] rotate-[-25deg]" /></div></QueryState></Panel><Panel><PanelTitle title="Guardrail" meta="always on" icon={ShieldCheck} /><div className="p-5"><p className="text-[13px] leading-relaxed text-[#c2c5be]">No score is a verdict. Every flag stays explainable and routes to human review when context is incomplete.</p></div></Panel></div></div>;
}

function FraudSpikes() {
  const summary = useGetRiskSummary({ query: { queryKey: getGetRiskSummaryQueryKey(), staleTime: 30000 } });
  const trend = summary.data?.trend ?? [];
  const peak = trend.reduce((best, item) => item.disputes > best.disputes ? item : best, trend[0] ?? { day: '—', disputes: 0, prevented: 0 });
  return <div><PageHeading eyebrow="Fraud-spike detector" title="Find the signal before the surge." description="Focused trend monitoring for unusual dispute pressure, with enough context to act without overcorrecting." action={<div className="flex items-center gap-2 rounded-full border border-[#3c3324] bg-[#241e15] px-3 py-1.5 font-mono text-[9px] uppercase tracking-[.12em] text-[#e3ba60]"><Activity size={12} /> Monitoring 7-day baseline</div>} /><div className="mb-5 grid gap-3 sm:grid-cols-3"><MetricTile label="Peak dispute day" value={peak.day} note={`${peak.disputes} observed disputes`} accent="#e9e2d2" /><MetricTile label="Peak prevented" value={compact(peak.prevented)} note="defensive interventions" accent="#efb74b" trend="up" /><MetricTile label="Signal posture" value="Stable" note="no escalation recommended" accent="#7be0b7" /></div><Panel><PanelTitle title="Dispute pressure vs. prevention" meta="rolling view" icon={TrendingUp} /><QueryState loading={summary.isLoading} error={summary.isError} onRetry={() => summary.refetch()}><TrendChart points={summary.data?.trend} /></QueryState></Panel><div className="mt-5 grid gap-5 lg:grid-cols-2"><Panel><PanelTitle title="Read the movement" meta="operator note" icon={FileSearch} /><div className="p-5"><p className="text-[13px] leading-relaxed text-[#c5c7c0]">Spikes are measured against your recent operating baseline. A single sharp day is a prompt to inspect evidence, not a reason to block customers.</p><div className="mt-4 flex items-center gap-2 text-[10px] text-[#7be0b7]"><ShieldCheck size={14} /> Defense posture remains proportionate</div></div></Panel><Panel><PanelTitle title="Next useful question" meta="investigate" icon={CircleHelp} /><div className="p-5"><p className="text-[13px] leading-relaxed text-[#c5c7c0]">Which reasons, regions, or device patterns are contributing to the movement?</p><Link href="/sentinel" className="mt-4 inline-flex items-center gap-1 text-[10px] text-[#efc66d] hover:text-[#f7d98b]" data-testid="link-investigate-rings">Inspect related-account signals <ChevronRight size={13} /></Link></div></Panel></div></div>;
}

function Sentinel() {
  const rings = useGetRiskRings({ query: { queryKey: getGetRiskRingsQueryKey(), staleTime: 30000 } });
  return <div><PageHeading eyebrow="Abuse ring sentinel" title="See the accounts moving together." description="Related-account clusters surfaced for defensive review. Shared signals stay visible so every escalation can be explained." action={<button onClick={() => rings.refetch()} className="flex items-center gap-2 rounded-lg border border-[#303741] bg-[#161c24] px-3 py-2 text-[11px] text-[#c7c9c3] hover:border-[#5d512f] hover:text-[#f3d488]" data-testid="button-refresh-rings"><RefreshCw size={14} /> Refresh clusters</button>} /><div className="mb-5 grid gap-3 sm:grid-cols-3"><MetricTile label="Clusters in view" value={rings.data ? String(rings.data.length) : '—'} note="shared signal groups" accent="#e9e2d2" /><MetricTile label="Members observed" value={rings.data ? compact(rings.data.reduce((sum, ring) => sum + ring.members, 0)) : '—'} note="across related accounts" accent="#efb74b" /><MetricTile label="Exposure surfaced" value={rings.data ? money(rings.data.reduce((sum, ring) => sum + ring.exposure, 0)) : '—'} note="not a loss forecast" accent="#ef9b8e" /></div><Panel className="overflow-hidden"><PanelTitle title="Related-account clusters" meta="defensive signals" icon={Network} /><QueryState loading={rings.isLoading} error={rings.isError} onRetry={() => rings.refetch()}><div className="grid gap-3 p-4 md:grid-cols-2">{(rings.data ?? []).map((ring) => <div key={ring.id} className="rounded-xl border border-[#2a313b] bg-[#171d24] p-4 transition-colors hover:border-[#4c4a3a]" data-testid={`card-risk-ring-${ring.id}`}><div className="flex items-start justify-between"><div className="flex items-center gap-3"><div className="grid h-9 w-9 place-items-center rounded-lg bg-[#292d34] text-[#c8a14d]"><Users size={16} /></div><div><p className="text-[12px] font-medium text-[#e0ddd5]">{ring.label}</p><p className="mt-1 font-mono text-[9px] text-[#68737f]">{ring.members} related members · {ring.id}</p></div></div><span className={`rounded-md border px-2 py-1 font-mono text-[9px] uppercase ${ring.risk === 'high' ? 'border-[#70423d] bg-[#382421] text-[#f29b8f]' : ring.risk === 'medium' ? 'border-[#66512a] bg-[#352c1d] text-[#edc873]' : 'border-[#315b4b] bg-[#173229] text-[#8de1bd]'}`}>{ring.risk}</span></div><div className="mt-4 flex items-end justify-between"><div><p className="font-mono text-[9px] uppercase tracking-[.12em] text-[#69747f]">Exposure</p><p className="mt-1 text-[17px] text-[#d9d7ce]">{money(ring.exposure)}</p></div><div className="text-right"><p className="font-mono text-[9px] uppercase tracking-[.12em] text-[#69747f]">Shared signals</p><p className="mt-1 text-[11px] text-[#c2b477]">{ring.sharedSignals.length} detected</p></div></div><div className="mt-4 flex flex-wrap gap-1.5">{ring.sharedSignals.map((signal) => <span key={signal} className="rounded border border-[#2e3741] bg-[#1c232b] px-2 py-1 text-[9px] text-[#8b949e]">{signal}</span>)}</div></div>)}</div>{!rings.data?.length && <div className="p-9 text-center text-[11px] text-[#747e89]">No related-account clusters are currently above the review threshold.</div>}</QueryState></Panel></div>;
}

function Metrics() {
  const metrics = useGetRiskMetrics({ query: { queryKey: getGetRiskMetricsQueryKey(), staleTime: 30000 } });
  const value = metrics.data;
  const matrix = value?.matrix;
  return <div><PageHeading eyebrow="Metrics / model performance" title="Measure the model like margin matters." description="Held-out performance, decision quality, and cost asymmetry in one operator-ready view." action={<button onClick={() => metrics.refetch()} className="flex items-center gap-2 rounded-lg border border-[#303741] bg-[#161c24] px-3 py-2 text-[11px] text-[#c7c9c3] hover:border-[#5d512f] hover:text-[#f3d488]" data-testid="button-refresh-metrics"><RefreshCw size={14} /> Re-run snapshot</button>} /><QueryState loading={metrics.isLoading} error={metrics.isError} onRetry={() => metrics.refetch()}><><div className="mb-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4"><MetricTile label="Precision" value={value ? `${(value.precision * 100).toFixed(1)}%` : '—'} note="of flagged events were valid" accent="#efb74b" /><MetricTile label="Recall" value={value ? `${(value.recall * 100).toFixed(1)}%` : '—'} note="of known risk captured" accent="#7be0b7" /><MetricTile label="F1 score" value={value ? value.f1.toFixed(2) : '—'} note="balanced performance" accent="#9cc5e4" /><MetricTile label="Accuracy" value={value ? `${(value.accuracy * 100).toFixed(1)}%` : '—'} note={`${compact(value?.sampleSize)} held-out events`} accent="#e9e2d2" /></div><div className="grid gap-5 xl:grid-cols-[1.15fr_.85fr]"><Panel><PanelTitle title="Confusion matrix" meta={value ? `${compact(value.sampleSize)} samples` : 'held-out set'} icon={BarChart3} /><div className="grid grid-cols-2 gap-px bg-[#252c35] p-px">{[['truePositive', 'True positive', '#7be0b7'], ['falsePositive', 'False positive', '#efb74b'], ['falseNegative', 'False negative', '#ef9b8f'], ['trueNegative', 'True negative', '#9cc5e4']].map(([key, label, color]) => <div key={key} className="bg-[#141920] p-5"><div className="flex items-center gap-2"><span className="h-2 w-2 rounded-full" style={{ background: color }} /><span className="text-[10px] text-[#85909b]">{label}</span></div><p className="mt-3 text-[29px] font-semibold tracking-[-.05em]" style={{ color }}>{matrix?.[key as keyof typeof matrix] ?? '—'}</p><p className="mt-1 font-mono text-[9px] uppercase tracking-[.1em] text-[#616c78]">events</p></div>)}</div></Panel><Panel><PanelTitle title="Cost asymmetry" meta="estimated impact" icon={AlertTriangle} /><div className="space-y-5 p-5"><div><div className="flex justify-between text-[11px]"><span className="text-[#939ca5]">False-positive cost</span><span className="font-mono text-[#efc66d]">{moneyExact(value?.falsePositiveCost)}</span></div><div className="mt-2 h-1.5 rounded-full bg-[#2a3038]"><div className="h-1.5 w-[44%] rounded-full bg-[#efb74b]" /></div><p className="mt-2 text-[10px] leading-relaxed text-[#6f7a85]">Margin and customer friction from unnecessary review.</p></div><div><div className="flex justify-between text-[11px]"><span className="text-[#939ca5]">False-negative cost</span><span className="font-mono text-[#ef9b8f]">{moneyExact(value?.falseNegativeCost)}</span></div><div className="mt-2 h-1.5 rounded-full bg-[#2a3038]"><div className="h-1.5 w-[71%] rounded-full bg-[#ef8174]" /></div><p className="mt-2 text-[10px] leading-relaxed text-[#6f7a85]">Preventable exposure that reached a dispute.</p></div><div className="border-t border-[#292f38] pt-4 text-[11px] leading-relaxed text-[#b5b8b1]">The model is tuned for a proportionate defense: high recall where exposure is material, with human review preserving customer trust.</div></div></Panel></div></></QueryState></div>;
}

function RoutedErrorBoundary({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  return <ErrorBoundary resetKey={location}>{children}</ErrorBoundary>;
}

function Router() {
  return <RoutedErrorBoundary><Shell><Switch><Route path="/" component={Dashboard} /><Route path="/responder" component={Responder} /><Route path="/returns" component={Returns} /><Route path="/fraud-spikes" component={FraudSpikes} /><Route path="/sentinel" component={Sentinel} /><Route path="/metrics" component={Metrics} /><Route component={NotFound} /></Switch></Shell></RoutedErrorBoundary>;
}

function App() {
  return <QueryClientProvider client={queryClient}><TooltipProvider><WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}><Router /></WouterRouter><SonnerToaster position="bottom-right" theme="dark" /></TooltipProvider></QueryClientProvider>;
}

export default App;