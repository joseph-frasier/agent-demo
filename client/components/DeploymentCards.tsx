import { EnrichedData } from "@/lib/types";

// ── Internal helpers ──────────────────────────────────────────────────────────

function Card({
  title,
  status,
  children,
}: {
  title: string;
  status?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-frasier-card border border-frasier-border rounded-xl p-6 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h3 className="text-white font-semibold text-base">{title}</h3>
        {status && (
          <span className="text-frasier-green text-xs font-semibold uppercase tracking-widest">
            {status}
          </span>
        )}
      </div>
      {children}
    </div>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between border-b border-white/5 pb-1.5">
      <span className="text-white/50 text-sm">{label}</span>
      <span className="text-white text-sm font-medium text-right">{value}</span>
    </div>
  );
}

function Divider() {
  return <hr className="border-white/5" />;
}

function Note({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-white/40 text-xs italic">{children}</p>
  );
}

// ── Domain helper ─────────────────────────────────────────────────────────────

function toDomain(businessName: string): string {
  return (
    businessName
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .trim()
      .replace(/\s+/g, "-") + ".com"
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function DeploymentCards({
  enriched,
  startTime,
}: {
  enriched: EnrichedData;
  startTime: number;
}) {
  const domain = toDomain(enriched.client.businessName);
  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);

  return (
    <div className="flex flex-col gap-6 animate-fade-in-up">
      {/* ── Vercel Deployment ── */}
      <Card title="Vercel Deployment" status="Ready">
        <div className="flex flex-col gap-2">
          <Row
            label="Project Slug"
            value={enriched.client.businessName
              .toLowerCase()
              .replace(/\s+/g, "-")}
          />
          <Row label="Framework" value="Next.js 14 (App Router)" />
          <Row
            label="Source Repo"
            value={`github.com/frasier-digital/${enriched.client.businessName
              .toLowerCase()
              .replace(/\s+/g, "-")}`}
          />
          <Row label="Branch" value="main" />
          <Row label="Node Version" value="20.x" />
        </div>
        <Divider />
        <div className="flex flex-col gap-1.5">
          <span className="text-white/40 text-xs uppercase tracking-widest">
            Environment Variables
          </span>
          {[
            "NEXT_PUBLIC_SITE_URL",
            "NEXT_PUBLIC_BUSINESS_NAME",
            "NEXT_PUBLIC_GA_ID",
          ].map((v) => (
            <span
              key={v}
              className="font-mono text-frasier-green text-xs bg-black/30 px-2 py-1 rounded"
            >
              {v}
            </span>
          ))}
        </div>
        <Note>
          In production, this fires automatically after approval.
        </Note>
      </Card>

      {/* ── Domain Registration ── */}
      <Card title="Domain Registration" status="Javelina">
        <div className="flex flex-col gap-2">
          <Row
            label="Domain"
            value={
              <span className="flex items-center gap-2">
                {domain}
                <span className="text-frasier-green text-xs font-semibold">
                  ✓ Available
                </span>
              </span>
            }
          />
          <Row label="Registrar" value="OpenSRS via Javelina" />
          <Row label="Registration Period" value="1 year" />
        </div>
        <Divider />
        <div className="flex flex-col gap-2">
          <span className="text-white/40 text-xs uppercase tracking-widest">
            Registrant
          </span>
          <Row label="Name" value={enriched.client.name} />
          <Row label="Business" value={enriched.client.businessName} />
          <Row label="Email" value={enriched.client.email} />
          <Row label="Phone" value={enriched.client.phone} />
          <Row label="Location" value={enriched.client.location} />
        </div>
        <Divider />
        <div className="flex flex-col gap-2">
          <span className="text-white/40 text-xs uppercase tracking-widest">
            Nameservers
          </span>
          <Row label="NS1" value="ns1.javelina.cloud" />
          <Row label="NS2" value="ns2.javelina.cloud" />
        </div>
      </Card>

      {/* ── DNS Zone ── */}
      <Card title="DNS Zone" status="Javelina MCP">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-white/40 text-xs uppercase tracking-widest">
                <th className="text-left pb-2 pr-4">Type</th>
                <th className="text-left pb-2 pr-4">Name</th>
                <th className="text-left pb-2 pr-4">Value</th>
                <th className="text-left pb-2 pr-4">Priority</th>
                <th className="text-left pb-2">TTL</th>
              </tr>
            </thead>
            <tbody className="text-white divide-y divide-white/5">
              {[
                {
                  type: "A",
                  name: "@",
                  value: "76.76.21.21",
                  priority: "—",
                  ttl: "300",
                },
                {
                  type: "CNAME",
                  name: "www",
                  value: "cname.vercel-dns.com",
                  priority: "—",
                  ttl: "300",
                },
                {
                  type: "MX",
                  name: "@",
                  value: "mx1.improvmx.com",
                  priority: "10",
                  ttl: "3600",
                },
                {
                  type: "TXT",
                  name: "@",
                  value: "v=spf1 include:spf.improvmx.com ~all",
                  priority: "—",
                  ttl: "3600",
                },
              ].map((rec) => (
                <tr key={`${rec.type}-${rec.name}-${rec.value}`}>
                  <td className="py-1.5 pr-4 font-mono text-frasier-green text-xs">
                    {rec.type}
                  </td>
                  <td className="py-1.5 pr-4 font-mono text-xs">{rec.name}</td>
                  <td className="py-1.5 pr-4 font-mono text-xs break-all">
                    {rec.value}
                  </td>
                  <td className="py-1.5 pr-4 text-xs text-white/60">
                    {rec.priority}
                  </td>
                  <td className="py-1.5 text-xs text-white/60">{rec.ttl}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Note>
          Records provisioned automatically via the Javelina MCP integration.
        </Note>
      </Card>

      {/* ── Pipeline Complete ── */}
      <div className="bg-frasier-card border border-frasier-green rounded-xl p-8 flex flex-col items-center gap-4 text-center">
        <span className="text-frasier-green text-3xl font-bold">✓</span>
        <h3 className="text-white font-bold text-xl">Pipeline Complete</h3>
        <div className="flex flex-col gap-1">
          <p className="text-white/70 text-sm">
            Total time elapsed:{" "}
            <span className="text-white font-semibold">{elapsed}s</span>
          </p>
          <p className="text-white/50 text-sm">
            Traditional timeline:{" "}
            <span className="text-white/70 line-through">2–4 weeks</span>
          </p>
        </div>
        <p className="text-white/60 text-sm italic max-w-md">
          "From intake to a deployed, SEO-optimized website with domain and DNS
          — fully automated, fully integrated."
        </p>
        <p className="text-frasier-green font-semibold text-sm">
          This is what Frasier Digital builds for you.
        </p>
      </div>
    </div>
  );
}
