import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { usePortalAuth, usePortalBudget } from '../hooks/usePortal'
import { BudgetBar } from '../components/BudgetBar'
import { LoadingState } from '@/components/shared/LoadingState'
import { formatDate } from '@/lib/formatters'
import { Wallet, Info } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'

export function PortalBudgetPage() {
  const { session } = usePortalAuth()
  const budget = usePortalBudget(session?.participantId)

  if (budget.isLoading) return <LoadingState />

  const data = budget.data

  const totalAllocated = (data?.core.allocated ?? 0) + (data?.capacityBuilding.allocated ?? 0) + (data?.capital.allocated ?? 0)
  const totalUsed = (data?.core.used ?? 0) + (data?.capacityBuilding.used ?? 0) + (data?.capital.used ?? 0)
  const totalPercentage = totalAllocated > 0 ? Math.round((totalUsed / totalAllocated) * 100) : 0

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Wallet className="h-6 w-6" />
          My Budget
        </h1>
        <p className="text-muted-foreground mt-1">Track how your NDIS plan funding is being used.</p>
      </div>

      {/* Plan Period */}
      {data?.planStartDate && data?.planEndDate && (
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            <span className="font-medium">Plan period:</span> {formatDate(data.planStartDate)} to {formatDate(data.planEndDate)}
            {data.fundingType && (
              <span className="ml-2 text-xs bg-muted px-2 py-0.5 rounded">
                {data.fundingType.replace(/_/g, ' ')}
              </span>
            )}
          </AlertDescription>
        </Alert>
      )}

      {/* Total Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Total Plan Budget</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-baseline gap-2 mb-4">
            <span className="text-3xl font-bold">
              ${totalUsed.toLocaleString('en-AU', { minimumFractionDigits: 2 })}
            </span>
            <span className="text-muted-foreground">
              of ${totalAllocated.toLocaleString('en-AU', { minimumFractionDigits: 2 })} ({totalPercentage}% used)
            </span>
          </div>
          <div className="h-4 w-full rounded-full bg-muted overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                totalPercentage >= 90 ? 'bg-destructive' : totalPercentage >= 70 ? 'bg-yellow-500' : 'bg-primary'
              }`}
              style={{ width: `${totalPercentage}%` }}
            />
          </div>
        </CardContent>
      </Card>

      {/* Category Breakdown */}
      <div className="grid gap-4 md:grid-cols-3">
        <BudgetCategoryCard
          title="Core Supports"
          description="Day-to-day support including personal care, transport, and consumables"
          allocated={data?.core.allocated ?? 0}
          used={data?.core.used ?? 0}
          colorClass="bg-blue-500"
        />
        <BudgetCategoryCard
          title="Capacity Building"
          description="Supports to build your skills and independence"
          allocated={data?.capacityBuilding.allocated ?? 0}
          used={data?.capacityBuilding.used ?? 0}
          colorClass="bg-emerald-500"
        />
        <BudgetCategoryCard
          title="Capital"
          description="Assistive technology, equipment, and home modifications"
          allocated={data?.capital.allocated ?? 0}
          used={data?.capital.used ?? 0}
          colorClass="bg-violet-500"
        />
      </div>

      {/* Explanatory Note */}
      <Card className="border-dashed">
        <CardContent className="pt-6 text-sm text-muted-foreground space-y-2">
          <p className="font-medium text-foreground">How to read your budget</p>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>Core Supports</strong> are flexible — you can use them across different core support categories.</li>
            <li><strong>Capacity Building</strong> funds are allocated to specific support categories and cannot be moved between them.</li>
            <li><strong>Capital</strong> funds are for one-off purchases like equipment or technology.</li>
            <li>Budget figures reflect approved, submitted, and paid invoices. Draft invoices are not included.</li>
          </ul>
          <p className="mt-3">
            If you have questions about your budget, contact your Support Coordinator or call us.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

function BudgetCategoryCard({
  title,
  description,
  allocated,
  used,
  colorClass,
}: {
  title: string
  description: string
  allocated: number
  used: number
  colorClass: string
}) {
  const remaining = Math.max(allocated - used, 0)

  return (
    <Card>
      <CardContent className="pt-6 space-y-4">
        <div>
          <h3 className="font-semibold">{title}</h3>
          <p className="text-xs text-muted-foreground mt-1">{description}</p>
        </div>
        <BudgetBar label="" allocated={allocated} used={used} colorClass={colorClass} />
        <div className="grid grid-cols-2 gap-2 text-center">
          <div className="rounded-lg bg-muted p-2">
            <p className="text-lg font-bold">${used.toLocaleString('en-AU', { minimumFractionDigits: 0 })}</p>
            <p className="text-xs text-muted-foreground">Used</p>
          </div>
          <div className="rounded-lg bg-muted p-2">
            <p className="text-lg font-bold">${remaining.toLocaleString('en-AU', { minimumFractionDigits: 0 })}</p>
            <p className="text-xs text-muted-foreground">Remaining</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
