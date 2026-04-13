import {
  getGrowthChartData,
  getGrowthMetrics,
} from '@/lib/services/admin.server'
import { GrowthCharts } from '@/components/admin/growth-charts'

export default async function AdminGrowthPage() {
  const [{ data: chartData }, { data: totals }] = await Promise.all([
    getGrowthChartData('30d'),
    getGrowthMetrics('month'),
  ])

  return (
    <div className="mx-auto max-w-5xl">
      <GrowthCharts
        initialData={chartData ?? []}
        initialTotals={totals ?? null}
      />
    </div>
  )
}
