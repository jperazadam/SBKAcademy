export interface AvatarInitialsProps {
  firstName: string
  lastName: string
  /** Diameter in pixels. Default: 48 */
  size?: number
}

/**
 * 6-color palette for avatar backgrounds (spec §AvatarInitials).
 * Index is determined by: sum of charCodes of (firstName + " " + lastName) % 6
 */
const AVATAR_COLORS = [
  '#6366f1', // 0 — primary-500 (indigo)
  '#10b981', // 1 — emerald-500
  '#f59e0b', // 2 — amber-500
  '#f43f5e', // 3 — rose-500
  '#0ea5e9', // 4 — sky-500
  '#8b5cf6', // 5 — violet-500
]

function getColorIndex(firstName: string, lastName: string): number {
  const str = `${firstName} ${lastName}`
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash += str.charCodeAt(i)
  }
  return hash % AVATAR_COLORS.length
}

function getInitials(firstName: string, lastName: string): string {
  const first = firstName.trim()[0] ?? '?'
  const last = lastName.trim()[0] ?? '?'
  return (first + last).toUpperCase()
}

export default function AvatarInitials({
  firstName,
  lastName,
  size = 48,
}: AvatarInitialsProps) {
  const initials = getInitials(firstName, lastName)
  const backgroundColor = AVATAR_COLORS[getColorIndex(firstName, lastName)]
  const fontSize = Math.round(size * 0.38)

  return (
    <div
      aria-label={`Avatar de ${firstName} ${lastName}`}
      style={{
        width: size,
        height: size,
        backgroundColor,
        fontSize,
        borderRadius: '50%',
        flexShrink: 0,
      }}
      className="flex items-center justify-center font-bold text-white"
    >
      {initials}
    </div>
  )
}
