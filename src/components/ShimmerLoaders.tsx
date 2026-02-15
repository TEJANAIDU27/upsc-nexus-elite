import { motion } from "framer-motion";

export function ShimmerCard({ className = "" }: { className?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={`shimmer h-32 ${className}`}
    />
  );
}

export function ShimmerHero() {
  return (
    <div className="space-y-4">
      <div className="shimmer h-8 w-1/3 rounded-full" />
      <div className="shimmer h-12 w-3/4" />
      <div className="shimmer h-6 w-full" />
      <div className="shimmer h-6 w-2/3" />
    </div>
  );
}

export function ShimmerQuestion() {
  return (
    <div className="space-y-6 p-6">
      <div className="shimmer h-6 w-full" />
      <div className="shimmer h-6 w-3/4" />
      <div className="space-y-3 mt-8">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="shimmer h-14 w-full" />
        ))}
      </div>
    </div>
  );
}
