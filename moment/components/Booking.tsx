"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

const makes = ["Porsche", "BMW M", "Mercedes-AMG", "Audi RS", "Другая марка"];
const issues = ["Плановое ТО", "Тормоза", "Стук в подвеске", "Ошибка на панели", "Детейлинг", "Шины"];
const slots = ["Сегодня 15:00", "Завтра 09:30", "Завтра 13:00", "Пт 10:00"];

type Form = { make: string; issues: string[]; slot: string; name: string; phone: string };

function Chip({ active, children, onClick }: { active: boolean; children: string; onClick: () => void }) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileTap={{ scale: 0.94 }}
      aria-pressed={active}
      className={`rounded-full px-5 py-3 text-sm transition-colors ${active ? "bg-gold text-carbon" : "bg-white/5 text-paper ring-1 ring-white/15 hover:ring-gold"}`}
    >
      {children}
    </motion.button>
  );
}

export default function Booking() {
  const [step, setStep] = useState(0);
  const [dir, setDir] = useState(1);
  const [form, setForm] = useState<Form>({ make: "", issues: [], slot: "", name: "", phone: "" });
  const [error, setError] = useState("");

  const go = (n: number) => {
    setError("");
    setDir(n > step ? 1 : -1);
    setStep(n);
  };

  const next = () => {
    if (step === 0 && !form.make) return setError("Выберите марку, чтобы мы подготовили сканер.");
    if (step === 1 && form.issues.length === 0) return setError("Отметьте хотя бы одну задачу.");
    if (step === 2) {
      if (!form.slot) return setError("Выберите время приёмки.");
      if (form.name.trim().length < 2) return setError("Напишите имя, как к вам обращаться.");
      if (form.phone.replace(/\D/g, "").length < 11) return setError("Телефон должен содержать 11 цифр, например +7 916 123-45-67.");
    }
    go(step + 1);
  };

  const steps = [
    {
      title: "Какая машина?",
      body: (
        <div className="flex flex-wrap gap-3">
          {makes.map((m) => (
            <Chip key={m} active={form.make === m} onClick={() => setForm({ ...form, make: m })}>{m}</Chip>
          ))}
        </div>
      ),
    },
    {
      title: "Что беспокоит?",
      body: (
        <div className="flex flex-wrap gap-3">
          {issues.map((m) => (
            <Chip
              key={m}
              active={form.issues.includes(m)}
              onClick={() => setForm({ ...form, issues: form.issues.includes(m) ? form.issues.filter((x) => x !== m) : [...form.issues, m] })}
            >
              {m}
            </Chip>
          ))}
        </div>
      ),
    },
    {
      title: "Когда удобно?",
      body: (
        <div className="space-y-6">
          <div className="flex flex-wrap gap-3">
            {slots.map((m) => (
              <Chip key={m} active={form.slot === m} onClick={() => setForm({ ...form, slot: m })}>{m}</Chip>
            ))}
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="eyebrow text-steel">Имя</span>
              <input id="bk-name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="mt-2 w-full border-b border-white/20 bg-transparent py-3 text-lg outline-none transition-colors focus:border-gold" placeholder="Алексей" autoComplete="name" />
            </label>
            <label className="block">
              <span className="eyebrow text-steel">Телефон</span>
              <input id="bk-phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="tabular mt-2 w-full border-b border-white/20 bg-transparent py-3 text-lg outline-none transition-colors focus:border-gold" placeholder="+7 916 123-45-67" inputMode="tel" autoComplete="tel" />
            </label>
          </div>
        </div>
      ),
    },
  ];

  return (
    <section id="booking" className="relative overflow-hidden bg-graphite px-4 py-[clamp(80px,12vw,160px)] sm:px-8 lg:px-14">
      <div className="grid gap-12 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:gap-20">
        <div>
          <p className="eyebrow text-gold">Запись</p>
          <h2 className="font-display mt-3 text-[clamp(2.2rem,5.6vw,5rem)] font-[800] uppercase leading-[0.92]">Бокс ждёт. Ключ откалиброван.</h2>
          <p className="mt-6 max-w-[38ch] text-fog">Три вопроса, и мастер-приёмщик напишет в Telegram за 10 минут. Подменный автомобиль на время работ дольше одного дня бесплатно.</p>
          <div className="mt-10 space-y-1 text-sm text-fog">
            <p>Москва, 2-й Сервисный проезд, 7 · ежедневно 8:00–22:00</p>
            <p className="tabular">+7 495 000-00-00</p>
          </div>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            next();
          }}
          className="relative min-w-0 rounded-3xl border border-white/10 bg-carbon/60 p-6 sm:p-10"
          noValidate
        >
          {step < 3 && (
            <div className="mb-8 flex gap-2" aria-hidden>
              {[0, 1, 2].map((i) => (
                <div key={i} className="h-1 flex-1 overflow-hidden rounded-full bg-white/10">
                  <motion.div className="h-full bg-gold" initial={false} animate={{ width: i <= step ? "100%" : "0%" }} transition={{ duration: 0.5 }} />
                </div>
              ))}
            </div>
          )}

          <div className="relative min-h-[300px]">
            <AnimatePresence mode="wait" custom={dir} initial={false}>
              <motion.div
                key={step}
                custom={dir}
                initial={{ opacity: 0, x: dir * 60 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: dir * -60 }}
                transition={{ duration: 0.35, ease: [0.2, 0.8, 0.2, 1] }}
              >
                {step < 3 ? (
                  <>
                    <p className="font-mono text-xs text-steel">Вопрос {step + 1} из 3</p>
                    <h3 className="font-display mb-8 mt-2 text-3xl font-[700] uppercase">{steps[step].title}</h3>
                    {steps[step].body}
                  </>
                ) : (
                  <div className="flex flex-col items-start">
                    <motion.svg viewBox="0 0 52 52" className="h-16 w-16" initial="a" animate="b">
                      <motion.circle cx="26" cy="26" r="24" fill="none" stroke="#d4a649" strokeWidth="2" variants={{ a: { pathLength: 0 }, b: { pathLength: 1 } }} transition={{ duration: 0.6 }} />
                      <motion.path d="M15 27 l7 7 l15 -16" fill="none" stroke="#d4a649" strokeWidth="3" strokeLinecap="round" variants={{ a: { pathLength: 0 }, b: { pathLength: 1 } }} transition={{ duration: 0.4, delay: 0.5 }} />
                    </motion.svg>
                    <h3 className="font-display mt-6 text-3xl font-[700] uppercase">Заявка готова, {form.name.trim()}</h3>
                    <p className="mt-4 text-fog">
                      {form.make} · {form.issues.join(", ")} · {form.slot}
                    </p>
                    <p className="mt-6 rounded-xl bg-white/5 p-4 text-sm text-fog">Это концепт сайта: заявка никуда не отправляется. В рабочей версии она уйдёт в CRM и в Telegram мастеру-приёмщику.</p>
                    <button type="button" onClick={() => { setForm({ make: "", issues: [], slot: "", name: "", phone: "" }); go(0); }} className="mt-6 text-sm text-gold underline-offset-4 hover:underline">
                      Заполнить заново
                    </button>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>

          {step < 3 && (
            <div className="mt-8 flex flex-wrap items-center justify-between gap-4">
              <p role="alert" className="min-h-5 text-sm text-bad">{error}</p>
              <div className="flex gap-3">
                {step > 0 && (
                  <button type="button" onClick={() => go(step - 1)} className="rounded-full px-5 py-3 text-sm ring-1 ring-white/20 transition hover:ring-paper">
                    Назад
                  </button>
                )}
                <motion.button type="submit" whileTap={{ scale: 0.96 }} className="rounded-full bg-gold px-6 py-3 text-sm font-medium text-carbon transition-colors hover:bg-paper">
                  {step === 2 ? "Отправить заявку" : "Дальше"}
                </motion.button>
              </div>
            </div>
          )}
        </form>
      </div>
    </section>
  );
}
