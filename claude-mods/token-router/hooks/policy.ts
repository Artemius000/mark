// What each level of task gets, what it costs, and whether a switch pays for itself.
// Pure functions: no `$`, so the tests exercise them directly.

export type Level = 'trivial' | 'simple' | 'moderate' | 'complex' | 'hard'
export type Family = 'haiku' | 'sonnet' | 'opus' | 'fable'
export type Effort = 'low' | 'medium' | 'high' | 'xhigh' | 'max'
export type Route = { family: Family; effort: Effort }

export const LEVELS: readonly Level[] = ['trivial', 'simple', 'moderate', 'complex', 'hard']
export const FAMILIES: readonly Family[] = ['haiku', 'sonnet', 'opus', 'fable']
export const EFFORTS: readonly Effort[] = ['low', 'medium', 'high', 'xhigh', 'max']

export const LEVEL_RU: Record<Level, string> = {
  trivial: 'тривиальная',
  simple: 'простая',
  moderate: 'средняя',
  complex: 'сложная',
  hard: 'очень сложная',
}

export const MODEL_IDS: Record<Family, string> = {
  haiku: 'claude-haiku-5-5',
  sonnet: 'claude-sonnet-5-5',
  opus: 'claude-opus-5-5',
  fable: 'claude-fable-5-1',
}

// First-party list prices, USD per million tokens (cache write at the 5-minute rate).
export const PRICES: Record<Family, { input: number; output: number; cacheRead: number; cacheWrite: number }> = {
  haiku: { input: 0.1, output: 0.5, cacheRead: 0.01, cacheWrite: 0.125 },
  sonnet: { input: 2, output: 10, cacheRead: 0.2, cacheWrite: 2.5 },
  opus: { input: 4, output: 20, cacheRead: 0.2, cacheWrite: 5 },
  fable: { input: 10, output: 50, cacheRead: 0.25, cacheWrite: 12.5 },
}

const ROUTES: Record<Level, Route> = {
  trivial: { family: 'haiku', effort: 'low' },
  simple: { family: 'haiku', effort: 'medium' },
  moderate: { family: 'sonnet', effort: 'medium' },
  complex: { family: 'opus', effort: 'high' },
  hard: { family: 'opus', effort: 'xhigh' },
}

// Rough size of a turn at each level: model requests made, and output tokens at medium effort.
const WORK: Record<Level, { steps: number; output: number }> = {
  trivial: { steps: 1, output: 400 },
  simple: { steps: 3, output: 2500 },
  moderate: { steps: 8, output: 8000 },
  complex: { steps: 20, output: 25000 },
  hard: { steps: 40, output: 50000 },
}

const EFFORT_OUTPUT: Record<Effort, number> = { low: 0.6, medium: 1, high: 1.5, xhigh: 2, max: 3 }

const rank = <T>(list: readonly T[], x: T) => list.indexOf(x)
const clampIndex = (i: number, len: number) => Math.max(0, Math.min(len - 1, i))

export const sameRoute = (a: Route | undefined, b: Route | undefined) => !!a && !!b && a.family === b.family && a.effort === b.effort

export const routeLabel = (r: Route) => `${r.family}·${r.effort}`

/** The route a level asks for, held between the cheapest and the strongest allowed model. */
export function routeFor(level: Level, min: Family, max: Family): Route {
  const want = { ...ROUTES[level] }
  if (level === 'hard' && max === 'fable') return { family: 'fable', effort: 'high' }
  const lo = rank(FAMILIES, min)
  const hi = Math.max(lo, rank(FAMILIES, max))
  const i = rank(FAMILIES, want.family)
  if (i > hi) {
    // A capped model thinks one step harder to make up for it.
    want.family = FAMILIES[hi] ?? want.family
    want.effort = EFFORTS[clampIndex(rank(EFFORTS, want.effort) + 1, EFFORTS.length)] ?? want.effort
  } else if (i < lo) {
    want.family = FAMILIES[lo] ?? want.family
  }
  return want
}

/** True when `a` is a more capable setup than `b`: a stronger model, or the same one thinking harder. */
export function isUpgrade(a: Route, b: Route) {
  const fa = rank(FAMILIES, a.family)
  const fb = rank(FAMILIES, b.family)
  return fa !== fb ? fa > fb : rank(EFFORTS, a.effort) > rank(EFFORTS, b.effort)
}

/** Estimated USD for one turn of `level` on `route` over a context of `ctx` tokens, cache warm. */
export function turnCost(route: Route, level: Level, ctx: number) {
  const p = PRICES[route.family]
  const w = WORK[level]
  return (w.steps * ctx * p.cacheRead + w.output * EFFORT_OUTPUT[route.effort] * p.output) / 1e6
}

/**
 * What moving to `route` costs up front: its first request writes to the cache whatever
 * part of the context that route has not cached yet (all of it once its cache went cold).
 */
export function switchCost(route: Route, ctx: number, cachedCtx: number) {
  const p = PRICES[route.family]
  const uncached = Math.max(0, ctx - cachedCtx)
  return (uncached * (p.cacheWrite - p.cacheRead)) / 1e6
}

export type Decision = {
  route: Route
  switched: boolean
  reason: string
  saving?: number // estimated USD saved this turn by a downgrade
}

/**
 * Upgrades always go through: a weak model on a hard task costs more in retries than it saves.
 * Downgrades go through only when the cheaper turn, cache rewrite included, saves at least 15%.
 */
export function decide(args: { level: Level; current?: Route; ctx: number; cachedCtx: number; min: Family; max: Family }): Decision {
  const want = routeFor(args.level, args.min, args.max)
  const { current } = args
  if (!current) return { route: want, switched: true, reason: 'первый ход' }
  if (sameRoute(want, current)) return { route: current, switched: false, reason: 'уже подходит' }
  if (isUpgrade(want, current)) return { route: want, switched: true, reason: 'задача сложнее текущей настройки' }

  const stay = turnCost(current, args.level, args.ctx)
  const go = turnCost(want, args.level, args.ctx) + switchCost(want, args.ctx, args.cachedCtx)
  if (go < stay * 0.85) return { route: want, switched: true, reason: 'дешевле даже с перезаписью кэша', saving: stay - go }
  return { route: current, switched: false, reason: 'переключение дороже экономии: кэш контекста' }
}

/** Re-points a model id at another family, keeping a provider prefix such as `us.anthropic.`. */
export function retarget(current: string, family: Family) {
  const id = MODEL_IDS[family]
  const m = /claude-(?:haiku|sonnet|opus|fable|mythos)-\d{1,2}(?:-\d{1,2})?(?!\d)/.exec(current)
  if (!m) return id
  const prefix = current.slice(0, m.index)
  const suffix = current.slice(m.index + m[0].length)
  // Keep a provider version tag (`-v1:0`); drop a date or a `[1m]` context marker.
  const keep = /^-v\d/.test(suffix) ? suffix : ''
  return prefix + id + keep
}

/** The family and effort a model id and effort value stand for, when they are ones the router knows. */
export function routeOf(model: string, effort: unknown): Route | undefined {
  const m = /claude-(haiku|sonnet|opus|fable)-/.exec(model)
  if (!m) return undefined
  const e = typeof effort === 'string' && (EFFORTS as readonly string[]).includes(effort) ? (effort as Effort) : 'medium'
  return { family: m[1] as Family, effort: e }
}

export type Usage = { input_tokens: number; output_tokens: number; cache_read_input_tokens?: number; cache_creation_input_tokens?: number }

/** USD for a request's usage, priced as `family`. */
export function usageCost(family: Family, u: Usage) {
  const p = PRICES[family]
  return (u.input_tokens * p.input + u.output_tokens * p.output + (u.cache_read_input_tokens ?? 0) * p.cacheRead + (u.cache_creation_input_tokens ?? 0) * p.cacheWrite) / 1e6
}

/** Prompt size a request was sent with: what the next request starts from. */
export const contextOf = (u: Usage) => u.input_tokens + (u.cache_read_input_tokens ?? 0) + (u.cache_creation_input_tokens ?? 0)
