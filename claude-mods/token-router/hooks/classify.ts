// Reads how hard a prompt is. Rules first (free, instant); a model call only for prompts the
// rules cannot place. Russian and English cues; pure functions apart from the prompt builder.

import { LEVELS, type Effort, type Family, type Level } from './policy'

export type Reading = {
  level: Level
  confident: boolean
  reason: string
  continuation?: boolean
}

export type Tags = { text: string; family?: Family; effort?: Effort }

const TAG = /(^|\s)@(haiku|sonnet|opus|fable|low|medium|high|xhigh|max)\b/gi

/** Pulls `@opus`, `@low`… out of the prompt: a one-turn override the person typed. */
export function readTags(text: string): Tags {
  let family: Family | undefined
  let effort: Effort | undefined
  const stripped = text.replace(TAG, (_, lead: string, word: string) => {
    const w = word.toLowerCase()
    if (w === 'haiku' || w === 'sonnet' || w === 'opus' || w === 'fable') family = w
    else effort = w as Effort
    return lead
  })
  return { text: family || effort ? stripped.replace(/\s{2,}/g, ' ').trim() : text, family, effort }
}

const CONTINUE = /^(да+|ага|угу|ок(ей)?|окей|хорошо|давай|го+|погнали|продолжай|продолжи|дальше|ещё|еще|делай|сделай|запускай|поехали|yes|yep|yeah|ok(ay)?|sure|go( on| ahead)?|continue|proceed|do it|next|👍|✅)([\s,.!)]*(давай|го|делай|пожалуйста|please|бро|братка))*[\s,.!)]*$/i
// `\b` is ASCII-only in JS, so Cyrillic words end at a non-letter lookahead instead.
const END = '(?![\\p{L}\\p{N}])'
const SMALL_TALK = new RegExp(`^(привет|здравствуй|хай|спасибо|благодарю|пасиб|круто|класс|супер|отлично|понял|понятно|hi|hello|hey|thanks?|thank you|great|cool|nice|got it)${END}`, 'iu')

const HARD = [
  /архитектур|спроектир|с нуля|from scratch|end[- ]to[- ]end/i,
  /мигрир|миграци|migrat/i,
  /race condition|гонк[аи] данных|deadlock|взаимоблокир|утечк[аи] памяти|memory leak/i,
  /уязвим|security audit|аудит безопасн|penetration/i,
  /распределённ|распределенн|distributed|concurren|многопоточ|параллелизм/i,
  /(весь|всего|всю|целиком) (проект|кодов|репозитор|codebase)|whole (codebase|project|repo)|entire (codebase|project|repo)/i,
  /awwwards|production[- ]ready|продакшн|высоконагруж/i,
]
const COMPLEX = [
  /рефактор|refactor/i,
  /отлад|дебаг|debug|почини|исправь (баг|ошибк)|fix (the )?(bug|error|crash)|не работает|падает|crash/i,
  /stack ?trace|traceback|exception|segfault/i,
  /реализуй|имплемент|implement|напиши (функци|модул|класс|сервис|скрипт|бот|парсер)|добавь (функци|фич|поддержк)|feature/i,
  /тест(ы|ов|ами)?(?![а-яё])|unit test|integration test/i,
  /сайт|лендинг|приложени|website|landing|web ?app|\bapp\b|бот(?![а-яё])|\bbot\b|\bmod\b|(^|[^а-яё])мод(?![а-яё])|плагин|plugin/i,
  /\bapi\b|бэкенд|backend|фронтенд|frontend|база данных|database|\bsql\b|схем[аы] данных/i,
  /next\.?js|react|three\.?js|webgl|gsap|анимац|animation|docker|kubernetes|ci\/cd|деплой|deploy/i,
  /оптимиз|optimi[sz]|производительн|performance/i,
]
const SIMPLE = [
  /переименуй|rename|опечатк|typo|поменяй (цвет|текст|шрифт)|измени (цвет|текст)|change the (color|text|label)/i,
  /отформатируй|format (this|the)|переведи|translate|перефразируй|rephrase/i,
  /что такое|what is|what's|кто такой|сколько будет|как называется|в чём разница|difference between/i,
  /коротко|кратко|в двух словах|briefly|tl;?dr|одной строкой/i,
]

const words = (t: string) => t.split(/\s+/).filter(Boolean).length
const hits = (rules: RegExp[], t: string) => rules.reduce((n, r) => n + (r.test(t) ? 1 : 0), 0)

/** Rule-based reading of a prompt. `previous` is the level of the turn before, for follow-ups. */
export function readByRules(text: string, previous?: Level): Reading {
  const t = text.trim()
  const n = words(t)

  if (!t) return { level: previous ?? 'simple', confident: true, reason: 'пустой ход', continuation: true }
  if (n <= 6 && CONTINUE.test(t)) {
    return { level: previous ?? 'moderate', confident: true, reason: 'продолжение прошлой задачи', continuation: true }
  }
  if (n <= 6 && SMALL_TALK.test(t)) return { level: 'trivial', confident: true, reason: 'короткая реплика' }

  const hard = hits(HARD, t)
  const complex = hits(COMPLEX, t)
  const simple = hits(SIMPLE, t)
  const hasCode = /```|^\s{4}\S|[{};]\s*$/m.test(t)
  const asks = (t.match(/^\s*(\d+[.)]|[-*•])\s+/gm) ?? []).length

  let score = 1 // simple by default
  if (n <= 12 && /\?\s*$/.test(t) && !complex && !hard && !hasCode) score = 0
  if (simple) score = Math.max(score, 1)
  if (complex) score = Math.max(score, complex >= 3 ? 3 : 2)
  if (hard) score = Math.max(score, hard >= 2 ? 4 : 3)
  if (hasCode) score = Math.max(score, 2)
  if (n > 150) score += 1
  if (n > 400) score += 1
  if (asks >= 4) score += 1
  if (simple && !complex && !hard && n < 40) score = Math.min(score, 1)
  score = Math.max(0, Math.min(4, score))

  const level = LEVELS[score] ?? 'moderate'
  // Confident at the ends and where several cues agree; the middle goes to the model.
  const confident = hard >= 2 || score === 0 || (simple > 0 && score <= 1 && n < 40) || (complex >= 3 && n > 40) || n > 400
  const reason = hard ? 'признаки большой задачи' : complex ? 'разработка или отладка' : simple ? 'мелкая правка или вопрос' : hasCode ? 'есть код' : 'по объёму'
  return { level, confident, reason }
}

export const CLASSIFIER_SYSTEM = [
  'You grade how much model capability a coding-assistant request needs. Reply with one word:',
  'trivial: chit-chat, thanks, a one-line fact, yes/no.',
  'simple: a small edit, a short explanation, a rename, a quick lookup.',
  'moderate: a feature or fix in one or two files, a focused debugging session, a script.',
  'complex: multi-file work, a full component or site, non-obvious debugging, design with trade-offs.',
  'hard: architecture, migrations, concurrency or security problems, large unfamiliar codebases, open-ended research.',
  'A follow-up like "go on" keeps the previous level.',
].join('\n')

export function classifierPrompt(text: string, previous?: Level) {
  const clipped = text.length > 4000 ? text.slice(0, 4000) + ' […]' : text
  return `Previous level: ${previous ?? 'none'}\nRequest:\n"""\n${clipped}\n"""\nOne word: trivial, simple, moderate, complex or hard.`
}

/** The level named in a classifier reply, if any. */
export function parseLevel(reply: string): Level | undefined {
  const m = /\b(trivial|simple|moderate|complex|hard)\b/i.exec(reply)
  return m?.[1] ? (m[1].toLowerCase() as Level) : undefined
}
