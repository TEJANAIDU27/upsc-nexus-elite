import { motion } from "framer-motion";
import { Radio, ExternalLink } from "lucide-react";

const digestItems = [
  {
    time: "06:00 AM",
    source: "PIB",
    headline: "Cabinet approves PM-USHA scheme for higher education quality upgrade",
    tag: "GS2: Governance",
  },
  {
    time: "07:15 AM",
    source: "AIR",
    headline: "India's forex reserves cross $650 billion mark for first time",
    tag: "GS3: Economy",
  },
  {
    time: "08:30 AM",
    source: "PIB",
    headline: "National Clean Air Programme: 131 cities show PM2.5 reduction",
    tag: "GS3: Environment",
  },
  {
    time: "09:00 AM",
    source: "AIR",
    headline: "Supreme Court upholds 10% EWS reservation in central institutions",
    tag: "GS2: Polity",
  },
  {
    time: "10:00 AM",
    source: "PIB",
    headline: "India-ASEAN trade in local currencies framework launched",
    tag: "GS2: International Relations",
  },
];

export function MorningDigest() {
  return (
    <div className="py-2">
      <div className="flex items-center gap-2 mb-6">
        <Radio className="w-4 h-4 text-primary" />
        <p className="text-sm text-muted-foreground">
          Top 5 curated points from PIB & AIR — updated daily
        </p>
      </div>

      <div className="relative">
        {/* Timeline line */}
        <div className="absolute left-[5.5rem] top-0 bottom-0 w-px bg-border hidden sm:block" />

        <div className="space-y-0">
          {digestItems.map((item, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1 }}
              className="relative flex gap-4 sm:gap-6 pb-6 last:pb-0"
            >
              {/* Time */}
              <div className="w-20 shrink-0 text-right hidden sm:block pt-1">
                <span className="text-[10px] text-muted-foreground font-mono">{item.time}</span>
              </div>

              {/* Dot */}
              <div className="relative hidden sm:flex items-start pt-1.5">
                <div className="w-3 h-3 rounded-full bg-primary border-2 border-background shadow-[0_0_8px_hsl(var(--gold)/0.4)] -translate-x-1/2" />
              </div>

              {/* Content */}
              <div className="flex-1 glass-card p-4 hover:border-primary/20 transition-colors">
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <span className="px-2 py-0.5 rounded-full bg-secondary text-foreground text-[10px] font-bold uppercase tracking-wider">
                    {item.source}
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-primary/15 text-primary text-[10px] font-semibold">
                    {item.tag}
                  </span>
                  <span className="text-[10px] text-muted-foreground sm:hidden">{item.time}</span>
                </div>
                <p className="text-sm text-foreground font-medium leading-snug">{item.headline}</p>
                <button className="flex items-center gap-1 text-[10px] text-primary hover:underline mt-2">
                  Read full brief <ExternalLink className="w-2.5 h-2.5" />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
