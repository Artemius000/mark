import type { EngineInterface, Register } from 'claude-code'

import { classifierPrompt, CLASSIFIER_SYSTEM, parseLevel, readByRules, readTags, type Reading } from './classify'
import {
  contextOf,
  decide,
  EFFORTS,
  FAMILIES,
  LEVEL_RU,
  retarget,
  routeFor,
  routeLabel,
  routeOf,
  sameRoute,
  usageCost,
  type Effort,
  type Family,
  type Level,
  type Route,
  type Usage,
} from './policy'

// The route chosen for one turn; `route` undefined leaves the engine's own model and effort.
type Plan = { route?: Route; level?: Level; why: string; switched: boolean }
type Pin = { family?: Family; effort?: Effort }
type Totals = { turns: number; switches: number; actual: number; baseline: number; classifier: number; byFamily: Record<string, number> }

const blankTotals = (): Totals => ({ turns: 0, switches: 0, actual: 0, baseline: 0, classifier: 0, byFamily: {} })
const usd = (x: number) => `$${x < 0.01 ? x.toFixed(4) : x.toFixed(2)}`
const asFamily = (x: unknown, fallback: Family): Family => ((FAMILIES as readonly unknown[]).includes(x) ? (x as Family) : fallback)
const USER_ORIGINS = new Set(['composer', 'bridge', 'sdk'])

// The router's memory for this load of the module (a reload starts it over; settings and
// lifetime totals come back from $.store).
const S = {
  ttlMs: 5 * 60_000,
  enabled: true,
  pin: undefined as Pin | undefined,
  current: undefined as Route | undefined, // what the main loop last ran on
  ctx: 20_000, // prompt size of the last request; a fresh session's system prompt and tools
  warm: new Map<string, { at: number; ctx: number }>(), // per route: when it last ran, over how much context
  session: blankTotals(),
  lifetime: blankTotals(),
}

function cachedFor(route: Route, now: number) {
  const w = S.warm.get(routeLabel(route))
  return w && now - w.at < S.ttlMs ? w.ctx : 0
}

function showStatus($: EngineInterface, plan?: Plan) {
  if (!S.enabled) return $.ui.status('router: выкл')
  const r = plan?.route ?? S.current
  if (!r) return $.ui.status('router: авто')
  const lvl = plan?.level ? ` · ${LEVEL_RU[plan.level]}` : ''
  $.ui.status(`router: ${routeLabel(r)}${lvl}${S.pin ? ' · закреплено' : ''}`)
}

function save($: EngineInterface) {
  return Promise.all([$.store.set('settings', { enabled: S.enabled, pin: S.pin ?? null }), $.store.set('lifetime', S.lifetime)])
}

export const register: Register = (on, options) => {
  const maxModel = asFamily(options.maxModel, 'opus')
  const minModel = asFamily(options.minModel, 'haiku')
  const useModel = options.classifier !== 'rules'
  S.ttlMs = Math.max(1, Number(options.cacheTtlMinutes) || 5) * 60_000

  let pending: Plan | undefined
  const plans = new Map<string, Plan>()
  let lastLevel: Level | undefined
  let engineModel: string | undefined // the session's own model, as the engine names it

  on('session.start', async ($, e, next) => {
    const settings = (await $.store.get('settings')) as { enabled?: boolean; pin?: Pin | null } | undefined
    if (settings) {
      S.enabled = settings.enabled !== false
      S.pin = settings.pin ?? undefined
    }
    S.lifetime = { ...blankTotals(), ...((await $.store.get('lifetime')) as Totals | undefined) }
    await $.command.register({
      name: 'router',
      description: 'Автовыбор модели и усилия: статус, вкл/выкл, закрепить модель',
      argumentHint: '[on|off|auto|pin <model> [effort]|reset]',
      immediate: true,
    })
    showStatus($)
    return next(e)
  })

  // Read the prompt and choose the next turn's route before the prompt enters.
  on('prompt.submit', async ($, e, next) => {
    // A prompt folded into a running turn, or one a notification or plugin raised, keeps that turn's route.
    if (e.turnId !== undefined || !USER_ORIGINS.has(e.origin.kind)) return next(e)
    const tags = readTags(e.text)
    const passOn = tags.text !== e.text ? { ...e, text: tags.text } : e
    if (!S.enabled) {
      pending = { why: 'роутер выключен', switched: false }
      return next(passOn)
    }

    let reading: Reading = readByRules(tags.text, lastLevel)
    if (!reading.confident && useModel && !tags.family) {
      const r = await $.model.complete({
        model: 'haiku',
        system: CLASSIFIER_SYSTEM,
        prompt: classifierPrompt(tags.text, lastLevel),
        effort: 'low',
        maxTokens: 300,
        timeoutMs: 5000,
      })
      S.session.classifier += usageCost('haiku', r.usage)
      S.lifetime.classifier += usageCost('haiku', r.usage)
      const level = r.isAnswered ? parseLevel(r.text) : undefined
      if (level) reading = { level, confident: true, reason: 'оценка Haiku' }
    }

    const now = await $.clock.now()
    const forced: Pin | undefined = tags.family || tags.effort ? { family: tags.family ?? S.pin?.family, effort: tags.effort ?? S.pin?.effort } : S.pin
    let plan: Plan
    if (forced) {
      const base = routeFor(reading.level, minModel, maxModel)
      const route = { family: forced.family ?? base.family, effort: forced.effort ?? base.effort }
      plan = { route, level: reading.level, why: tags.family || tags.effort ? 'указано в промпте' : 'закреплено', switched: !sameRoute(route, S.current) }
    } else if (reading.continuation && S.current) {
      plan = { route: S.current, level: lastLevel ?? reading.level, why: reading.reason, switched: false }
    } else {
      const target = routeFor(reading.level, minModel, maxModel)
      const d = decide({ level: reading.level, current: S.current, ctx: S.ctx, cachedCtx: cachedFor(target, now), min: minModel, max: maxModel })
      plan = { route: d.route, level: reading.level, why: d.switched ? `${reading.reason}; ${d.reason}` : d.reason, switched: d.switched && !!S.current }
    }
    pending = plan
    return next(passOn)
  }).catch(($, e, next) => next(e)) // never block a prompt: on any failure it goes through as typed

  on('turn.start', ($, e, next) => {
    // A turn with no new prompt (a continuation, a notification) stays where it was.
    const plan = pending ?? { route: S.enabled ? S.current : undefined, level: lastLevel, why: 'без нового промпта', switched: false }
    pending = undefined
    plans.set(e.turnId, plan)
    showStatus($, plan)
    if (plan.switched && plan.route) $.ui.toast(`router → ${routeLabel(plan.route)}: ${plan.why}`)
    return next(e)
  })

  on('turn.step', async function* ($, e, next) {
    if (e.agentId !== undefined) return yield* next(e) // subagents keep their own setup

    // The person switching /model by hand wins: pin that model until /router auto.
    if (e.index === 0 && engineModel !== undefined && e.model !== engineModel && !S.pin) {
      const own = routeOf(e.model, e.effort)
      if (own) {
        S.pin = { family: own.family }
        await save($)
        $.ui.toast(`router: модель сменили вручную, закрепил ${own.family}. /router auto вернёт автовыбор`)
      }
    }
    engineModel = e.model
    const own = routeOf(e.model, e.effort)

    const plan = plans.get(e.turnId)
    const route = S.enabled ? plan?.route : undefined
    const sent = route ? { ...e, model: retarget(e.model, route.family), effort: route.effort } : e
    const ran = route ?? own

    const stream = next(sent)
    for await (const chunk of stream) {
      if (chunk.kind === 'stop' && chunk.usage && ran) {
        try {
          const u = chunk.usage as Usage
          S.ctx = contextOf(u)
          S.warm.set(routeLabel(ran), { at: await $.clock.now(), ctx: S.ctx })
          const actual = usageCost(ran.family, u)
          const baseline = usageCost(own?.family ?? ran.family, u)
          for (const t of [S.session, S.lifetime]) {
            t.actual += actual
            t.baseline += baseline
            t.byFamily[ran.family] = (t.byFamily[ran.family] ?? 0) + 1
          }
          S.current = ran
        } catch {
          // Accounting is best effort; the response always passes through.
        }
      }
      yield chunk
    }
    return await stream.result
  })

  on('turn.complete', async ($, e, next) => {
    if (e.agentId === undefined) {
      const plan = plans.get(e.turnId)
      plans.delete(e.turnId)
      if (plan?.level) lastLevel = plan.level
      for (const t of [S.session, S.lifetime]) {
        t.turns += 1
        if (plan?.switched) t.switches += 1
      }
      await save($)
    }
    return next(e)
  })

  on('command.run', { command: 'router' }, async ($, e) => {
    const [cmd = '', a, b] = e.args.trim().toLowerCase().split(/\s+/)
    if (cmd === 'off' || cmd === 'on') {
      S.enabled = cmd === 'on'
      await save($)
      showStatus($)
      return { text: S.enabled ? 'Роутер включён: модель и усилие выбираются под каждую задачу.' : 'Роутер выключен: работает модель сессии.' }
    }
    if (cmd === 'auto') {
      S.pin = undefined
      await save($)
      showStatus($)
      return { text: 'Закрепление снято, модель снова выбирается автоматически.' }
    }
    if (cmd === 'pin') {
      const next: Pin = {}
      for (const w of [a, b]) {
        if ((FAMILIES as readonly string[]).includes(w ?? '')) next.family = w as Family
        else if ((EFFORTS as readonly string[]).includes(w ?? '')) next.effort = w as Effort
      }
      if (!next.family && !next.effort) return { text: 'Укажите модель и/или усилие: /router pin opus high' }
      S.pin = next
      await save($)
      showStatus($)
      return { text: `Закреплено: ${[next.family, next.effort].filter(Boolean).join(' · ')}. /router auto снимет закрепление.` }
    }
    if (cmd === 'reset') {
      S.session = blankTotals()
      S.lifetime = blankTotals()
      await save($)
      return { text: 'Статистика обнулена.' }
    }
    if (cmd !== '' && cmd !== 'status') {
      return { text: 'Команды: /router, /router on, /router off, /router auto, /router pin <haiku|sonnet|opus|fable> [low|medium|high|xhigh|max], /router reset' }
    }
    const line = (t: Totals) => {
      const saved = t.baseline - t.actual - t.classifier
      const pct = t.baseline > 0 ? Math.round((saved / t.baseline) * 100) : 0
      const mix = Object.entries(t.byFamily).map(([k, v]) => `${k} ${v}`).join(', ') || 'нет данных'
      return `${t.turns} ходов, ${t.switches} переключений · запросы: ${mix}\n  по ценам API: ${usd(t.actual)} против ${usd(t.baseline)} на модели сессии · экономия ≈ ${usd(saved)} (${pct}%), классификатор ${usd(t.classifier)}`
    }
    return {
      text: [
        `Роутер: ${S.enabled ? 'включён' : 'выключен'}${S.pin ? `, закреплено ${[S.pin.family, S.pin.effort].filter(Boolean).join(' · ')}` : ''}`,
        `Сейчас: ${S.current ? routeLabel(S.current) : 'ещё не было хода'} · контекст ≈ ${Math.round(S.ctx / 1000)}k токенов`,
        `Эта сессия: ${line(S.session)}`,
        `Всего: ${line(S.lifetime)}`,
        'Оценка: те же токены, посчитанные по цене модели сессии.',
      ].join('\n'),
    }
  })
}
