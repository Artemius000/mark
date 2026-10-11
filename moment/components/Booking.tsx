"use client";

import Image from "next/image";
import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import RollButton from "./RollButton";

const makes = ["Porsche", "BMW M", "Mercedes-AMG", "Audi RS", "Другая марка"];
const issues = ["Плановое ТО", "Тормоза", "Стук в подвеске", "Ошибка на панели", "Детейлинг", "Шины"];
const slots = ["Сегодня 15:00", "Завтра 09:30", "Завтра 13:00", "Пт 10:00"];
const ease = [0.16, 1, 0.3, 1] as const;

type Form = { make: string; issues: string[]; slot: string; name: string; phone: string };
const empty: Form = { make: "", issues: [], slot: "", name: "", phone: "" };

function Chip({ active, children, onClick }: { active: boolean; children: string; onClick: () => void }) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileTap={{ scale: 0.95 }}
      aria-pressed={active}
      className={`relative overflow-hidden rounded-full px-5 py-3 text-sm transition-colors duration-500 ${active ? "text-carbon" : "text-paper ring-1 ring-inset ring-white/15 hover:ring-white/40"}`}
    >
      {active && <motion.span className="absolute inset-0 rounded-full bg-brass" initial={{ scale: 0.4, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.5, ease }} />}
      <span className="relative">{children}</span>
    </motion.button>
  );
}

function Field({ id, label, ...props }: { id: string; label: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label htmlFor={id} className="group relative block">
      <span className="eyebrow text-[10px] text-steel">{label}</span>
      <input id={id} {...props} className="mt-2 w-full bg-transparent py-3 text-lg outline-none placeholder:text-white/20" />
      <span className="absolute inset-x-0 bottom-0 h-px bg-white/15" />
      <span className="absolute inset-x-0 bottom-0 h-px origin-left scale-x-0 bg-brass transition-transform duration-700 ease-[cubic-bezier(.16,1,.3,1)] group-focus-within:scale-x-100" />
    </label>
  );
}

export default function Booking() {
  const [step, setStep] = useState(0);
  const [dir, setDir] = useState(1);
  const [form, setForm] = useState<Form>(empty);
  const [error, setError] = useState("");

  const go = (n: number) => {
    setError("");
    setDir(n > step ? 1 : -1);
    setStep(n);
  };

  const next = () => {
    if (step === 0 && !form.make) return setError("Выберите марку, чтобы мы подготовили нужный сканер.");
    if (step === 1 && form.issues.length === 0) return setError("Отметьте хотя бы одну задачу.");
    if (step === 2) {
      if (!form.slot) return setError("Выберите время приёмки.");
      if (form.name.trim().length < 2) return setError("Напишите имя, как к вам обращаться.");
      if (form.phone.replace(/\D/g, "").length < 11) return setError("В телефоне должно быть 11 цифр, например +7 916 123-45-67.");
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
            <Chip key={m} active={form.issues.includes(m)} onClick={() => setForm({ ...form, issues: form.issues.includes(m) ? form.issues.filter((x) => x !== m) : [...form.issues, m] })}>
              {m}
            </Chip>
          ))}
        </div>
      ),
    },
    {
      title: "Когда удобно?",
      body: (
        <div className="space-y-8">
          <div className="flex flex-wrap gap-3">
            {slots.map((m) => (
              <Chip key={m} active={form.slot === m} onClick={() => setForm({ ...form, slot: m })}>{m}</Chip>
            ))}
          </div>
          <div className="grid gap-6 sm:grid-cols-2">
            <Field id="bk-name" label="Имя" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Алексей" autoComplete="name" />
            <Field id="bk-phone" label="Телефон" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+7 916 123-45-67" inputMode="tel" autoComplete="tel" />
          </div>
        </div>
      ),
    },
  ];

  return (
    <section id="booking" className="relative overflow-hidden px-4 py-[clamp(100px,13vw,190px)] sm:px-8 lg:px-14">
      <div className="absolute inset-0 overflow-hidden">
        <div data-parallax="8" className="absolute inset-[-12%_0]">
          <Image src="/photos/workshop-lifts.webp" alt="" fill sizes="100vw" className="object-cover" />
        </div>
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(9,9,10,.95)_0%,rgba(9,9,10,.82)_45%,rgba(9,9,10,.55)_100%)]" />
      </div>

      <div className="relative grid gap-14 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:gap-20">
        <div>
          <p className="eyebrow text-brass">Запись</p>
          <h2 data-reveal className="display mt-5 text-[clamp(2.4rem,5.8vw,5.6rem)]">
            Бокс ждёт. <span className="serif-accent text-brass">Ключ</span> откалиброван
          </h2>
          <p data-fade className="mt-7 max-w-[38ch] text-[15px] leading-relaxed text-fog">
            Три вопроса, и мастер-приёмщик напишет в Telegram за 10 минут. Подменный автомобиль бесплатно, если работы займут больше дня.
          </p>
          <div data-fade className="mt-12 grid max-w-md grid-cols-2 gap-6 border-t border-line pt-6 text-sm text-fog">
            <div>
              <p className="eyebrow text-[10px] text-steel">Адрес</p>
              <p className="mt-2">Москва, 2-й Сервисный проезд, 7</p>
            </div>
            <div>
              <p className="eyebrow text-[10px] text-steel">Часы</p>
              <p className="mt-2">Ежедневно 8:00–22:00</p>
            </div>
          </div>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            next();
          }}
          className="relative min-w-0 rounded-[28px] border border-white/10 bg-carbon/55 p-6 backdrop-blur-2xl sm:p-10"
          noValidate
        >
          {step < 3 && (
            <div className="mb-10 flex items-center gap-4">
              <span className="font-mono text-xs text-steel">0{step + 1} / 03</span>
              <div className="flex flex-1 gap-1.5" aria-hidden>
                {[0, 1, 2].map((i) => (
                  <div key={i} className="h-[2px] flex-1 overflow-hidden bg-white/10">
                    <motion.div className="h-full origin-left bg-brass" initial={false} animate={{ scaleX: i <= step ? 1 : 0 }} transition={{ duration: 0.7, ease }} />
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="relative min-h-[300px] overflow-hidden">
            <AnimatePresence mode="wait" custom={dir} initial={false}>
              <motion.div key={step} initial={{ opacity: 0, x: dir * 70, filter: "blur(6px)" }} animate={{ opacity: 1, x: 0, filter: "blur(0px)" }} exit={{ opacity: 0, x: dir * -70, filter: "blur(6px)" }} transition={{ duration: 0.55, ease }}>
                {step < 3 ? (
                  <>
                    <h3 className="display mb-9 text-[clamp(1.8rem,3vw,2.6rem)]">{steps[step].title}</h3>
                    {steps[step].body}
                  </>
                ) : (
                  <div className="flex flex-col items-start">
                    <motion.svg viewBox="0 0 52 52" className="h-16 w-16" initial="a" animate="b">
                      <motion.circle cx="26" cy="26" r="24" fill="none" stroke="#c6a15b" strokeWidth="1.5" variants={{ a: { pathLength: 0 }, b: { pathLength: 1 } }} transition={{ duration: 0.8, ease }} />
                      <motion.path d="M16 27 l7 7 l14 -15" fill="none" stroke="#c6a15b" strokeWidth="2" strokeLinecap="round" variants={{ a: { pathLength: 0 }, b: { pathLength: 1 } }} transition={{ duration: 0.5, delay: 0.6, ease }} />
                    </motion.svg>
                    <h3 className="display mt-7 text-[clamp(1.8rem,3vw,2.6rem)]">Заявка готова, {form.name.trim()}</h3>
                    <p className="mt-4 text-fog">
                      {form.make} · {form.issues.join(", ")} · {form.slot}
                    </p>
                    <p className="mt-7 rounded-2xl bg-white/5 p-4 text-sm text-fog">Это концепт сайта: заявка никуда не отправляется. В рабочей версии она уйдёт в CRM и в Telegram мастеру-приёмщику.</p>
                    <button type="button" onClick={() => { setForm(empty); go(0); }} className="eyebrow mt-7 text-brass underline-offset-8 hover:underline">
                      Заполнить заново
                    </button>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>

          {step < 3 && (
            <div className="mt-10 flex flex-wrap items-center justify-between gap-4">
              <p role="alert" className="min-h-5 max-w-[30ch] text-sm text-bad">{error}</p>
              <div className="flex items-center gap-3">
                {step > 0 && (
                  <button type="button" onClick={() => go(step - 1)} className="eyebrow px-3 py-3 text-[11px] text-fog transition-colors hover:text-paper">
                    ← Назад
                  </button>
                )}
                <RollButton type="submit">{step === 2 ? "Отправить заявку" : "Дальше"}</RollButton>
              </div>
            </div>
          )}
        </form>
      </div>
    </section>
  );
}
