"use client";

import { motion } from "framer-motion";
import { versus, versusText } from "@/lib/content";

const ease = [0.16, 1, 0.3, 1] as const;

export default function Versus() {
  return (
    <section id="versus" className="relative z-10 -mt-10 rounded-t-[36px] bg-paper px-4 py-[clamp(90px,12vw,170px)] text-carbon sm:px-8 lg:rounded-t-[56px] lg:px-14">
      <div className="flex flex-wrap items-end justify-between gap-6">
        <div>
          <p className="eyebrow text-brass-deep">Сравнение · Porsche Cayenne, Москва</p>
          <h2 data-reveal className="display mt-5 text-[clamp(2.4rem,6.4vw,6.6rem)]">
            Дилер <span className="serif-accent text-brass-deep">против</span> Момента
          </h2>
        </div>
        <p data-fade className="max-w-[34ch] text-[15px] text-carbon/65">
          Те же сканеры и те же допуски. Разница в цене часа, сроках и в том, сколько вы видите своими глазами.
        </p>
      </div>

      <div className="mt-16 grid gap-14 lg:mt-24 lg:grid-cols-2 lg:gap-20">
        <div className="space-y-12">
          {versus.map((v, i) => (
            <div key={v.label}>
              <div className="flex items-baseline justify-between border-b border-carbon/15 pb-3">
                <span className="eyebrow text-carbon/55">{v.label}</span>
                <span className="font-mono text-xs text-carbon/40">0{i + 1}</span>
              </div>
              <div className="mt-6 space-y-5">
                {[
                  { who: "Дилер", value: v.dealer, w: v.dealerBar, bar: "bg-carbon/25", text: "text-carbon/50" },
                  { who: "Момент", value: v.us, w: v.usBar, bar: "bg-carbon", text: "text-carbon" },
                ].map((row, ri) => (
                  <div key={row.who} className="grid grid-cols-[76px_minmax(0,1fr)] items-center gap-4 sm:grid-cols-[96px_minmax(0,1fr)]">
                    <span className={`text-sm ${row.text}`}>{row.who}</span>
                    <div>
                      <span className={`display tabular block text-[clamp(1.4rem,2.6vw,2.2rem)] leading-none ${row.text}`}>{row.value}</span>
                      <div className="mt-3 h-[3px] bg-carbon/8">
                        <motion.div
                          className={`h-full origin-left ${row.bar}`}
                          style={{ width: `${Math.max(row.w * 100, 6)}%` }}
                          initial={{ scaleX: 0 }}
                          whileInView={{ scaleX: 1 }}
                          viewport={{ once: true, amount: 0.8 }}
                          transition={{ duration: 1.4, delay: ri * 0.15, ease }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div>
          {versusText.map((v, i) => (
            <motion.div
              key={v.label}
              className="grid gap-4 border-t border-carbon/15 py-8 sm:grid-cols-[120px_minmax(0,1fr)]"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.5 }}
              transition={{ duration: 1, delay: i * 0.08, ease }}
            >
              <span className="eyebrow pt-1.5 text-carbon/55">{v.label}</span>
              <div>
                <p className="text-carbon/40 line-through decoration-carbon/25">{v.dealer}</p>
                <p className="display mt-3 text-[clamp(1.2rem,1.8vw,1.55rem)] leading-tight">{v.us}</p>
              </div>
            </motion.div>
          ))}
          <p className="border-t border-carbon/15 pt-6 text-xs text-carbon/50">Средние цены дилеров по Москве, октябрь 2026. Данные концепта, ориентировочно.</p>
        </div>
      </div>
    </section>
  );
}
