import { describe, expect, mock, test, type Engine } from 'claude-code/testing'
import type { On, TurnStepInput, TurnUsage } from 'claude-code'

import { readByRules, readTags } from '../hooks/classify'
import { decide, retarget, routeFor } from '../hooks/policy'

describe('reading a prompt', () => {
  test('small talk is trivial, a follow-up keeps the last level', () => {
    expect(readByRules('спасибо!').level).toBe('trivial')
    const go = readByRules('да давай', 'complex')
    expect(go.level).toBe('complex')
    expect(go.continuation).toBe(true)
  })

  test('a rename is simple, an architecture rework is hard', () => {
    expect(readByRules('переименуй переменную foo в bar').level).toBe('simple')
    expect(readByRules('спроектируй архитектуру и мигрируй весь проект с REST на gRPC, учти race condition в воркерах').level).toBe('hard')
  })

  test('building a site reads as development work', () => {
    const r = readByRules('сделай лендинг на Next.js с анимациями GSAP и 3D на three.js, с формой записи и тестами')
    expect(['moderate', 'complex']).toContain(r.level)
  })

  test('@tags override and leave the prompt clean', () => {
    const t = readTags('@opus @max почини баг в оплате')
    expect(t.family).toBe('opus')
    expect(t.effort).toBe('max')
    expect(t.text).toBe('почини баг в оплате')
  })
})

describe('deciding a route', () => {
  test('an upgrade always goes through', () => {
    const d = decide({ level: 'hard', current: { family: 'haiku', effort: 'low' }, ctx: 500_000, cachedCtx: 0, min: 'haiku', max: 'opus' })
    expect(d.route).toEqual({ family: 'opus', effort: 'xhigh' })
    expect(d.switched).toBe(true)
  })

  test('a trivial question drops from Opus to Haiku when the context is small', () => {
    const d = decide({ level: 'trivial', current: { family: 'opus', effort: 'high' }, ctx: 20_000, cachedCtx: 0, min: 'haiku', max: 'opus' })
    expect(d.route.family).toBe('haiku')
    expect(d.switched).toBe(true)
  })

  test('an effort-only step down holds when rewriting a big cache costs more', () => {
    const d = decide({ level: 'complex', current: { family: 'opus', effort: 'xhigh' }, ctx: 400_000, cachedCtx: 0, min: 'haiku', max: 'opus' })
    expect(d.switched).toBe(false)
    expect(d.route).toEqual({ family: 'opus', effort: 'xhigh' })
  })

  test('the strongest-model cap trades model for effort', () => {
    expect(routeFor('hard', 'haiku', 'sonnet')).toEqual({ family: 'sonnet', effort: 'max' })
    expect(routeFor('hard', 'haiku', 'fable')).toEqual({ family: 'fable', effort: 'high' })
    expect(routeFor('trivial', 'sonnet', 'opus').family).toBe('sonnet')
  })

  test('model ids keep their provider prefix', () => {
    expect(retarget('claude-opus-5-5', 'haiku')).toBe('claude-haiku-5-5')
    expect(retarget('us.anthropic.claude-opus-5-5-v1:0', 'sonnet')).toBe('us.anthropic.claude-sonnet-5-5-v1:0')
    expect(retarget('claude-opus-5-5[1m]', 'haiku')).toBe('claude-haiku-5-5')
  })
})

// The engine beneath the plugin: it records each model request the plugin lets through.
function engine(on: On, classifierSays: string) {
  const sent: TurnStepInput[] = []
  const toasts: string[] = []
  mock.store(on)
  mock.clock(on)
  on('session.start', ($, e) => ({ cwd: e.cwd }))
  on('command.register', ($, e) => ({ value: { command: e.name } }))
  on('ui.status', () => ({ value: undefined }))
  on('ui.toast', ($, e) => {
    toasts.push(e.text)
    return { value: undefined }
  })
  on('model.complete', () => ({
    value: { isAnswered: true as const, text: classifierSays, usage: { input_tokens: 300, output_tokens: 2, cache_read_input_tokens: 0, cache_creation_input_tokens: 0 } },
  }))
  on('prompt.submit', ($, e) => ({ text: e.text }))
  on('turn.start', ($, e) => ({ turnId: e.turnId }))
  on('turn.complete', () => ({ text: '' }))
  on('turn.step', async function* ($, e) {
    sent.push(e)
    const usage: TurnUsage = { model: e.model, input_tokens: 50, output_tokens: 200, cache_read_input_tokens: 18_000, cache_creation_input_tokens: 0 }
    yield { kind: 'stop', stopReason: 'end_turn', usage }
    return { turnId: e.turnId, index: e.index, answer: 'ok', toolUses: [], stopReason: 'end_turn', usage }
  })
  return { sent, toasts }
}

async function turn($: Engine, text: string, id: string) {
  await $.prompt.submit({ text, wait: false, origin: { kind: 'composer' } })
  await $.turn.start({ text, turnId: id })
  const stream = $.turn.step({ turnId: id, index: 0, model: 'claude-opus-5-5', effort: 'high', messageCount: 3 })
  for await (const _ of stream) {
    // drain
  }
  await $.turn.complete({ answer: 'ok', durationMs: 10, isAborted: false, turnId: id, reason: 'answer' })
}

test('a thank-you runs on Haiku, a hard task goes back to Opus', async ($, on) => {
  const { sent } = engine(on, 'hard')
  await $.session.start({ cwd: '/tmp', surface: 'terminal', isInteractive: true })

  await turn($, 'спасибо!', 't1')
  expect(sent[0]?.model).toBe('claude-haiku-5-5')
  expect(sent[0]?.effort).toBe('low')

  await turn($, 'нужно разобраться, почему воркеры иногда теряют задачи под нагрузкой', 't2')
  expect(sent[1]?.model).toBe('claude-opus-5-5')
  expect(sent[1]?.effort).toBe('xhigh')
})

test('@sonnet in the prompt wins for that turn', async ($, on) => {
  const { sent } = engine(on, 'trivial')
  await $.session.start({ cwd: '/tmp', surface: 'terminal', isInteractive: true })
  await turn($, '@sonnet @low объясни этот регэксп', 't1')
  expect(sent[0]?.model).toBe('claude-sonnet-5-5')
  expect(sent[0]?.effort).toBe('low')
})

test('/router off leaves the session model alone', async ($, on) => {
  const { sent } = engine(on, 'trivial')
  await $.session.start({ cwd: '/tmp', surface: 'terminal', isInteractive: true })
  const r = await $.command.run({ command: 'router', args: 'off', origin: { kind: 'composer' }, presentation: { isFullscreen: false, columns: 80 } })
  expect(r.text).toContain('выключен')
  await turn($, 'спасибо', 't1')
  expect(sent[0]?.model).toBe('claude-opus-5-5')
  expect(sent[0]?.effort).toBe('high')
})

test('subagent requests pass untouched', async ($, on) => {
  const { sent } = engine(on, 'trivial')
  await $.session.start({ cwd: '/tmp', surface: 'terminal', isInteractive: true })
  await $.prompt.submit({ text: 'спасибо', wait: false, origin: { kind: 'composer' } })
  await $.turn.start({ text: 'спасибо', turnId: 't1' })
  for await (const _ of $.turn.step({ turnId: 't1', index: 0, model: 'claude-opus-5-5', effort: 'high', messageCount: 3, agentId: 'a1' })) {
    // drain
  }
  expect(sent[0]?.model).toBe('claude-opus-5-5')
})
