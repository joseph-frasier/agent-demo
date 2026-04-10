import { IntakeData, EnrichedData } from "@/lib/types";

interface EnrichedPayloadProps {
  raw: IntakeData;
  enriched: EnrichedData;
}

export default function EnrichedPayload({ raw, enriched }: EnrichedPayloadProps) {
  const allKeywords = [
    ...enriched.seo.primaryKeywords,
    ...enriched.seo.secondaryKeywords,
  ];

  return (
    <div className="animate-fade-in-up grid grid-cols-1 gap-6 lg:grid-cols-2">
      {/* Left: raw input */}
      <div className="rounded-xl bg-white/5 p-6">
        <h3 className="mb-4 text-sm font-semibold uppercase tracking-widest text-white/50">
          What you typed
        </h3>
        <dl className="space-y-3">
          <Row label="Business" value={raw.businessName} />
          <Row label="Services" value={raw.services} />
          <Row label="Tagline" value={raw.tagline} />
          <Row label="Tone" value={raw.tone} />
        </dl>
      </div>

      {/* Right: AI-enriched output */}
      <div className="rounded-xl bg-frasier-card p-6">
        <h3 className="mb-4 text-sm font-semibold uppercase tracking-widest text-white/50">
          What AI structured
        </h3>

        {/* Voice guidelines */}
        <div className="mb-4">
          <span className="mb-1 block text-xs font-medium text-white/40">
            Voice Guidelines
          </span>
          <p className="text-sm text-white/80">{enriched.brand.voiceGuidelines}</p>
        </div>

        {/* Expanded services */}
        <div className="mb-4">
          <span className="mb-1 block text-xs font-medium text-white/40">
            Services
          </span>
          <ul className="space-y-2">
            {enriched.services.map((service) => (
              <li key={service.name}>
                <span className="text-sm font-medium text-white/90">
                  {service.name}
                </span>
                <p className="text-xs text-white/50">{service.description}</p>
              </li>
            ))}
          </ul>
        </div>

        {/* SEO keywords */}
        {allKeywords.length > 0 && (
          <div className="mb-4">
            <span className="mb-2 block text-xs font-medium text-white/40">
              SEO Keywords
            </span>
            <div className="flex flex-wrap gap-2">
              {allKeywords.map((kw) => (
                <span
                  key={kw}
                  className="rounded-full bg-green-500/20 px-2 py-0.5 text-xs font-medium text-green-400"
                >
                  {kw}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Unique selling points */}
        {enriched.businessDetails.uniqueSellingPoints.length > 0 && (
          <div>
            <span className="mb-1 block text-xs font-medium text-white/40">
              Unique Selling Points
            </span>
            <ul className="list-disc list-inside space-y-1">
              {enriched.businessDetails.uniqueSellingPoints.map((usp) => (
                <li key={usp} className="text-sm text-white/80">
                  {usp}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-medium text-white/40">{label}</dt>
      <dd className="mt-0.5 text-sm text-white/80">{value}</dd>
    </div>
  );
}
