"use client";

import { motion } from "framer-motion";
import { versus, versusText } from "@/lib/content";

export default function Versus() {
  return (
    <section id="versus" className="bg-paper px-4 py-[clamp(80px,12vw,160px)] text-carbon sm:px-8 lg:px-14">
      <div className="flex flex-wrap items-end justify-between gap-6">
        <div>
          <p className="eyebrow text-gold-deep">Сравнение</p>
          <h2 className="font-display mt-3 text-[clamp(2.2rem,6vw,5.6rem)] font-[800] uppercase leading-[0.92]">
            Дилер
            <span className="mx-[0.25em] text-gold-deep">vs</span>
            Момент
          </h2>
        </div>
        <p className="max-w-[34ch] text-[15px] text-carbon/70">Те же сканеры и те же допуски. Разница в цене часа, сроках и в том, сколько вы видите своими глазами.</p>
      </div>

      <div className="mt-14 grid gap-10 lg:grid-cols-2 lg:gap-16">
        <div className="space-y-9">
          {versus.map((v, i) => (
            <div key={v.label}>
              <p className="eyebrow text-carbon/60">{v.label}</p>
              <div className="mt-3 space-y-2">
                {[
                  { who: "Дилер", value: v.dealer, w: v.dealerBar, cls: "bg-carbon/20" },
                  { who: "Момент", value: v.us, w: v.usBar, cls: "bg-carbon" },
                ].map((row) => (
                  <div key={row.who} className="grid grid-cols-[72px_minmax(0,1fr)] items-center gap-3 sm:grid-cols-[88px_minmax(0,1fr)]">
                    <span className="text-sm text-carbon/70">{row.who}</span>
                    <div className="relative h-10 overflow-hidden rounded-full bg-carbon/5">
                      <motion.div
                        className={`absolute inset-y-0 left-0 rounded-full ${row.cls}`}
                        initial={{ width: "8%" }}
                        whileInView={{ width: `${Math.max(row.w * 100, 30)}%` }}
                        viewport={{ once: true, amount: 0.6 }}
                        transition={{ duration: 1.1, delay: i * 0.1, ease: [0.2, 0.8, 0.2, 1] }}
                      />
                      <span className={`tabular absolute inset-y-0 left-4 flex items-center whitespace-nowrap text-sm font-medium ${row.who === "Момент" ? "text-paper mix-blend-difference" : "text-carbon"}`}>
                        {row.value}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="divide-y divide-carbon/15 border-y border-carbon/15">
          {versusText.map((v) => (
            <motion.div
              key={v.label}
              className="grid gap-3 py-6 sm:grid-cols-[140px_minmax(0,1fr)_minmax(0,1fr)] sm:gap-6"
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.5 }}
              transition={{ duration: 0.6 }}
            >
              <span className="eyebrow pt-1 text-carbon/60">{v.label}</span>
              <span className="text-carbon/45 line-through decoration-carbon/30">{v.dealer}</span>
              <span className="font-medium">{v.us}</span>
            </motion.div>
          ))}
          <p className="py-5 text-xs text-carbon/55">Цены дилера: средние по Москве для обслуживания Porsche Cayenne, октябрь 2026. Данные концепта, ориентировочно.</p>
        </div>
      </div>
    </section>
  );
}
