import Image from "next/image";
import { gallery } from "@/lib/content";

// Three columns that drift at different speeds on desktop; a plain stack on phones.
const columns = [
  { items: [gallery[0], gallery[3]], drift: 6, offset: "lg:pt-0" },
  { items: [gallery[1], gallery[2]], drift: -9, offset: "lg:pt-40" },
  { items: [gallery[4], gallery[5]], drift: 4, offset: "lg:pt-16" },
];

export default function Gallery() {
  return (
    <section id="bays" className="overflow-hidden px-4 py-[clamp(110px,14vw,200px)] sm:px-8 lg:px-14">
      <div className="flex flex-wrap items-end justify-between gap-6">
        <div>
          <p className="eyebrow text-brass">Журнал работ · 6–11 октября</p>
          <h2 data-reveal className="display mt-5 text-[clamp(2.2rem,5.6vw,5.4rem)]">
            В боксах <span className="serif-accent text-brass">на этой</span> неделе
          </h2>
        </div>
        <p data-fade className="max-w-[32ch] text-[15px] text-fog">
          Что заезжало к нам и что с этим делали. Время указано по факту, а не по нормативу.
        </p>
      </div>

      <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:mt-24 lg:grid-cols-3 lg:gap-8">
        {columns.map((col, ci) => (
          <div key={ci} className={`relative ${col.offset}`}>
            <div data-parallax={col.drift} className="flex flex-col gap-10">
              {col.items.map((g) => (
                <figure key={g.src} className="group" data-cursor="Смотреть">
                  <div data-img-reveal className="relative overflow-hidden rounded-[22px]" style={{ aspectRatio: `${g.w} / ${g.h}` }}>
                    <Image src={g.src} alt={`${g.car}: ${g.job}`} fill sizes="(min-width: 1024px) 30vw, (min-width: 640px) 50vw, 100vw" className="object-cover transition-transform duration-[1.4s] ease-[cubic-bezier(.16,1,.3,1)] group-hover:scale-[1.04]" />
                  </div>
                  <figcaption className="mt-4 flex items-start justify-between gap-4 border-t border-line pt-4">
                    <span>
                      <span className="display block text-lg">{g.car}</span>
                      <span className="mt-1 block text-sm text-fog">{g.job}</span>
                    </span>
                    <span className="shrink-0 font-mono text-xs text-steel">{g.time}</span>
                  </figcaption>
                </figure>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
