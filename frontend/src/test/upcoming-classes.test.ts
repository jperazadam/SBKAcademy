import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { nextOccurrence, upcomingOccurrences } from '../utils/upcoming-classes'
import type { DanceClass, ClassScheduleEntry } from '../types/class'

// Helpers ──────────────────────────────────────────────────────────────────────

function makeSchedule(
  dayOfWeek: number,
  startTime: string,
  endTime = '20:00'
): ClassScheduleEntry {
  return { id: 1, dayOfWeek, startTime, endTime, classId: 1 }
}

function makeClass(
  id: number,
  active: boolean,
  schedules: ClassScheduleEntry[]
): DanceClass {
  return {
    id,
    name: null,
    type: 'BACHATA',
    level: 'INICIO',
    active,
    displayName: `Clase ${id}`,
    teacherId: 1,
    createdAt: '',
    updatedAt: '',
    schedules,
  }
}

// Tests ────────────────────────────────────────────────────────────────────────

describe('nextOccurrence', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it('returns the correct day when dayOfWeek is in the future of the same week', () => {
    // Monday 2026-05-11 10:00
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-05-11T10:00:00'))
    const now = new Date()

    // Saturday = 6
    const schedule = makeSchedule(6, '19:00')
    const result = nextOccurrence(schedule, now)

    // Should be Saturday 2026-05-16 at 19:00
    expect(result.getDay()).toBe(6)
    expect(result.getHours()).toBe(19)
    expect(result.getMinutes()).toBe(0)
    expect(result.getDate()).toBe(16)
    expect(result.getMonth()).toBe(4) // May = 4
  })

  it('returns today when dayOfWeek matches today and time has not yet passed', () => {
    // Monday 2026-05-11 08:00
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-05-11T08:00:00'))
    const now = new Date()

    // dayOfWeek 1 = Monday; 19:00 is in the future
    const schedule = makeSchedule(1, '19:00')
    const result = nextOccurrence(schedule, now)

    expect(result.getDay()).toBe(1)
    expect(result.getHours()).toBe(19)
    expect(result.getDate()).toBe(11) // same day
  })

  it('returns 7 days later when dayOfWeek matches today but time already passed', () => {
    // Monday 2026-05-11 20:00
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-05-11T20:00:00'))
    const now = new Date()

    // dayOfWeek 1 = Monday; 19:00 already passed
    const schedule = makeSchedule(1, '19:00')
    const result = nextOccurrence(schedule, now)

    expect(result.getDay()).toBe(1)
    expect(result.getHours()).toBe(19)
    expect(result.getDate()).toBe(18) // next Monday
  })

  it('handles exact start time as already-passed (edge: ==)', () => {
    // Monday 2026-05-11 19:00 exactly
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-05-11T19:00:00'))
    const now = new Date()

    const schedule = makeSchedule(1, '19:00')
    const result = nextOccurrence(schedule, now)

    // 19:00 <= 19:00 so it's considered past → next week
    expect(result.getDate()).toBe(18)
  })
})

describe('upcomingOccurrences', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it('sorts results chronologically when multiple classes have different days', () => {
    // Monday 2026-05-11 10:00
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-05-11T10:00:00'))
    const now = new Date()

    // Class A: Saturday (6), Class B: Wednesday (3, closer)
    const classA = makeClass(1, true, [makeSchedule(6, '19:00')])
    const classB = makeClass(2, true, [makeSchedule(3, '18:00')])

    const results = upcomingOccurrences([classA, classB], now, 7)

    expect(results).toHaveLength(2)
    // Wednesday should come first
    expect(results[0].class.id).toBe(2)
    expect(results[1].class.id).toBe(1)
  })

  it('filters out inactive classes', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-05-11T10:00:00'))
    const now = new Date()

    const activeClass = makeClass(1, true, [makeSchedule(3, '19:00')])
    const inactiveClass = makeClass(2, false, [makeSchedule(3, '20:00')])

    const results = upcomingOccurrences([activeClass, inactiveClass], now, 7)

    expect(results).toHaveLength(1)
    expect(results[0].class.id).toBe(1)
  })

  it('returns empty array when no classes are within the window', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-05-11T10:00:00'))
    const now = new Date()

    // Tuesday (2) class, but window is only 1 day from Monday
    const cls = makeClass(1, true, [makeSchedule(2, '19:00')])
    const results = upcomingOccurrences([cls], now, 1)

    expect(results).toHaveLength(0)
  })

  it('includes a class occurring exactly within the cutoff boundary', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-05-11T10:00:00'))
    const now = new Date()

    // Tuesday (2) class at 10:00 — exactly 24h from now = within 1-day window
    const cls = makeClass(1, true, [makeSchedule(2, '10:00')])
    const results = upcomingOccurrences([cls], now, 1)

    // 2026-05-12T10:00 is exactly 86400000ms from now
    // cutoff = now + 1*24h = 2026-05-12T10:00, and nextDate <= cutoff
    expect(results).toHaveLength(1)
  })
})
