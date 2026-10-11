"use client";

import { motion } from "framer-motion";

const letters = "МОМЕНТ".split("");

export default function Footer() {
  return (
    <footer className="overflow-hidden bg-carbon px-4 pb-8 pt-20 sm:px-8 lg:px-14">
      <div className="flex flex-wrap justify-between gap-8 text-sm text-fog">
        <div className="space-y-1">
          <p className="eyebrow text-steel">Адрес</p>
          <p>Москва, 2-й Сервисный проезд, 7</p>
          <p>Ежедневно 8:00–22:00</p>
        </div>
        <div className="space-y-1">
          <p className="eyebrow text-steel">Связь</p>
          <p className="tabular">+7 495 000-00-00</p>
          <p>Telegram: @moment_atelier</p>
        </div>
        <div className="space-y-1">
          <p className="eyebrow text-steel">Стандарт</p>
          <p>Момент затяжки 160 Н·м.</p>
          <p>Всегда динамометрическим ключом.</p>
        </div>
      </div>

      <div className="mt-16 flex select-none justify-between font-display text-[clamp(4rem,19vw,22rem)] font-[800] leading-[0.8]" aria-label="Момент">
        {letters.map((l, i) => (
          <motion.span
            key={i}
            aria-hidden
            className="inline-block text-paper transition-colors hover:text-gold"
            initial={{ y: "60%", opacity: 0 }}
            whileInView={{ y: "0%", opacity: 1 }}
            viewport={{ once: true, amount: 0.4 }}
            transition={{ duration: 0.9, delay: i * 0.06, ease: [0.2, 0.9, 0.2, 1] }}
            whileHover={{ y: "-8%", skewX: -8 }}
          >
            {l}
          </motion.span>
        ))}
      </div>

      <p className="mt-8 text-xs text-steel">Концепт-сайт. Компания, адрес, цены и статистика вымышлены. Марки автомобилей принадлежат их владельцам.</p>
    </footer>
  );
}
