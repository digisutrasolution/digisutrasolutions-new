import { TICKER_ITEMS } from "@/lib/data";

export default function Ticker() {
  const row = [...TICKER_ITEMS, ...TICKER_ITEMS];

  return (
    <div className="overflow-x-clip" aria-hidden>
      <div className="relative z-10 -mx-4 -mt-6 -rotate-[1.6deg] scale-[1.03] overflow-hidden bg-orange-500 py-3">
        <div className="animate-marquee flex w-max items-center gap-8">
          {row.map((item, i) => (
            <span key={i} className="flex items-center gap-8">
              <span
                className={`font-display text-lg font-extrabold tracking-wide ${
                  i % 2 === 0 ? "text-white" : "text-outline-cream"
                }`}
              >
                {item}
              </span>
              <span className="text-orange-900">✦</span>
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
