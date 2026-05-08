export interface MetricCardProps {
  label: string
  value: string | number
  subtitle?: string
  loading?: boolean
}

export default function MetricCard({
  label,
  value,
  subtitle,
  loading = false,
}: MetricCardProps) {
  if (loading) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="h-4 w-24 animate-pulse rounded bg-gray-200" />
        <div className="mt-3 h-9 w-16 animate-pulse rounded bg-gray-200" />
        {subtitle !== undefined && (
          <div className="mt-2 h-3 w-32 animate-pulse rounded bg-gray-200" />
        )}
      </div>
    )
  }

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
      <p className="text-sm font-medium text-gray-500">{label}</p>
      <p className="mt-1 text-3xl font-bold text-foreground">{value}</p>
      {subtitle && (
        <p className="mt-1 text-xs text-gray-400">{subtitle}</p>
      )}
    </div>
  )
}
