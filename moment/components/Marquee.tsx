import { brands } from "@/lib/content";

export default function Marquee() {
  const row = [...brands, ...brands];
  return (
    <div className="relative overflow-hidden border-y border-white/10 bg-carbon py-6" aria-label={`Обслуживаем: ${brands.join(", ")}`}>
      <div className="flex w-max [animation:marquee_32s_linear_infinite] hover:[animation-play-state:paused]" aria-hidden>
        {row.map((b, i) => (
          <span key={i} className="font-display flex items-center whitespace-nowrap px-8 text-[clamp(1.6rem,4vw,3.4rem)] font-[700] uppercase text-transparent [-webkit-text-stroke:1px_#8d929a] transition-colors duration-300 hover:text-paper">
            {b}
            <span className="ml-16 inline-block h-2 w-2 rotate-45 bg-gold" />
          </span>
        ))}
      </div>
    </div>
  );
}
