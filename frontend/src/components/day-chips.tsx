import type { ClassScheduleEntry } from '../types/class'

export interface DayChipsProps {
  schedules: ClassScheduleEntry[]
}

/** Labels shown in chips — position matches dayOfWeek (0=Sunday…6=Saturday) */
const CHIP_LABELS = ['D', 'L', 'M', 'X', 'J', 'V', 'S'] as const

/** Day abbreviations used in the schedule list below the chips */
const DAY_ABBR: Record<number, string> = {
  0: 'Dom',
  1: 'Lun',
  2: 'Mar',
  3: 'Mié',
  4: 'Jue',
  5: 'Vie',
  6: 'Sáb',
}

export default function DayChips({ schedules }: DayChipsProps) {
  // Build a map of dayOfWeek → schedule for quick lookup
  const activeMap = new Map<number, ClassScheduleEntry>()
  for (const s of schedules) {
    activeMap.set(s.dayOfWeek, s)
  }

  // Active schedules sorted ascending by dayOfWeek for the list below chips
  const activeSchedules = [...activeMap.values()].sort(
    (a, b) => a.dayOfWeek - b.dayOfWeek
  )

  return (
    <div>
      {/* 7 chips row */}
      <div className="flex gap-1">
        {CHIP_LABELS.map((label, index) => {
          const isActive = activeMap.has(index)
          return (
            <span
              key={index}
              className={`inline-flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold ${
                isActive
                  ? 'bg-primary-600 text-white opacity-100'
                  : 'bg-gray-100 text-gray-400 opacity-60'
              }`}
            >
              {label}
            </span>
          )
        })}
      </div>

      {/* Schedule list for active days */}
      {activeSchedules.length > 0 && (
        <ul className="mt-2 space-y-0.5">
          {activeSchedules.map((s) => (
            <li key={s.id} className="text-xs text-gray-600">
              {DAY_ABBR[s.dayOfWeek]} {s.startTime}–{s.endTime}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
