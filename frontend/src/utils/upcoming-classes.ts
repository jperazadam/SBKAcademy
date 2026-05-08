import type { DanceClass, ClassScheduleEntry } from '../types/class'

export interface UpcomingOccurrence {
  class: DanceClass
  schedule: ClassScheduleEntry
  nextDate: Date
}

/**
 * Calculates the next future occurrence of a schedule starting from `from`.
 *
 * Rules:
 * - If today is the schedule's dayOfWeek AND the time hasn't passed yet → today at startTime.
 * - If today is the schedule's dayOfWeek AND the time already passed → 7 days from today.
 * - Otherwise → advance days until the next matching dayOfWeek.
 */
export function nextOccurrence(
  schedule: ClassScheduleEntry,
  from: Date
): Date {
  const [hh, mm] = schedule.startTime.split(':').map(Number)

  const fromDay = from.getDay() // 0=Sun ... 6=Sat
  let daysUntil = (schedule.dayOfWeek - fromDay + 7) % 7

  // If daysUntil === 0 we're on the right weekday — check if time already passed
  if (daysUntil === 0) {
    const fromMinutes = from.getHours() * 60 + from.getMinutes()
    const scheduleMinutes = hh * 60 + mm
    if (scheduleMinutes <= fromMinutes) {
      // Time already passed (or exactly now) → next week
      daysUntil = 7
    }
  }

  const result = new Date(from)
  result.setDate(result.getDate() + daysUntil)
  result.setHours(hh, mm, 0, 0)
  return result
}

/**
 * Returns all upcoming occurrences across all active classes within
 * `withinDays` days from `from`, sorted chronologically.
 */
export function upcomingOccurrences(
  classes: DanceClass[],
  from: Date,
  withinDays: number
): UpcomingOccurrence[] {
  const cutoff = new Date(from.getTime() + withinDays * 24 * 60 * 60 * 1000)

  const results: UpcomingOccurrence[] = []

  for (const cls of classes) {
    if (!cls.active) continue
    for (const schedule of cls.schedules) {
      const nextDate = nextOccurrence(schedule, from)
      if (nextDate <= cutoff) {
        results.push({ class: cls, schedule, nextDate })
      }
    }
  }

  results.sort((a, b) => a.nextDate.getTime() - b.nextDate.getTime())
  return results
}
