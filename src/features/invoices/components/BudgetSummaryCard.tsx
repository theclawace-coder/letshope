import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatCurrency } from '@/lib/formatters'
import { cn } from '@/lib/utils'

interface BudgetData {
  budget_core: number | null
  budget_capacity_building: number | null
  budget_capital: number | null
  plan_start_date: string | null
  plan_end_date: string | null
  total_budget: number
  total_used: number
  total_remaining: number
  invoice_count: number
}

interface BudgetSummaryCardProps {
  budget: BudgetData
}

function BudgetBar({ label, total, used, color }: { label: string; total: number; used: number; color: string }) {
  if (!total) return null
  const percentage = Math.min(Math.round((used / total) * 100), 100)
  const remaining = total - used
  const isOverBudget = remaining < 0

  return (
    <div className="space-y-1">
      <div className="flex justify-between text-sm">
        <span className="font-medium">{label}</span>
        <span className={cn('text-xs', isOverBudget ? 'text-destructive font-bold' : 'text-muted-foreground')}>
          {formatCurrency(used)} / {formatCurrency(total)}
          {isOverBudget && ' (OVER BUDGET)'}
        </span>
      </div>
      <div className="h-2 bg-muted rounded-full overflow-hidden">
        <div
          className={cn('h-full rounded-full transition-all', isOverBudget ? 'bg-destructive' : color)}
          style={{ width: `${percentage}%` }}
        />
      </div>
      <div className="text-xs text-muted-foreground text-right">
        {formatCurrency(Math.abs(remaining))} {isOverBudget ? 'over' : 'remaining'} ({100 - percentage}%)
      </div>
    </div>
  )
}

export function BudgetSummaryCard({ budget }: BudgetSummaryCardProps) {
  const percentage = budget.total_budget > 0
    ? Math.round((budget.total_used / budget.total_budget) * 100)
    : 0

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center justify-between">
          <span>Budget Summary</span>
          <span className="text-sm font-normal text-muted-foreground">
            {budget.invoice_count} invoice{budget.invoice_count !== 1 ? 's' : ''} to date
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 md:grid-cols-3 text-center">
          <div className="p-3 bg-muted/50 rounded-lg">
            <div className="text-xs text-muted-foreground">Total Budget</div>
            <div className="text-lg font-bold">{formatCurrency(budget.total_budget)}</div>
          </div>
          <div className="p-3 bg-muted/50 rounded-lg">
            <div className="text-xs text-muted-foreground">Used</div>
            <div className="text-lg font-bold">{formatCurrency(budget.total_used)}</div>
          </div>
          <div className="p-3 bg-muted/50 rounded-lg">
            <div className="text-xs text-muted-foreground">Remaining</div>
            <div className={cn(
              'text-lg font-bold',
              budget.total_remaining < 0 && 'text-destructive'
            )}>
              {formatCurrency(budget.total_remaining)}
            </div>
          </div>
        </div>

        <div className="space-y-1">
          <div className="flex justify-between text-sm">
            <span className="font-medium">Overall</span>
            <span className="text-xs text-muted-foreground">{percentage}% utilised</span>
          </div>
          <div className="h-3 bg-muted rounded-full overflow-hidden">
            <div
              className={cn(
                'h-full rounded-full transition-all',
                percentage > 90 ? 'bg-destructive' : percentage > 75 ? 'bg-orange-500' : 'bg-primary'
              )}
              style={{ width: `${Math.min(percentage, 100)}%` }}
            />
          </div>
        </div>

        <div className="space-y-3 pt-2">
          <BudgetBar
            label="Core Supports"
            total={budget.budget_core || 0}
            used={budget.total_used * ((budget.budget_core || 0) / (budget.total_budget || 1))}
            color="bg-blue-500"
          />
          <BudgetBar
            label="Capacity Building"
            total={budget.budget_capacity_building || 0}
            used={budget.total_used * ((budget.budget_capacity_building || 0) / (budget.total_budget || 1))}
            color="bg-purple-500"
          />
          <BudgetBar
            label="Capital"
            total={budget.budget_capital || 0}
            used={budget.total_used * ((budget.budget_capital || 0) / (budget.total_budget || 1))}
            color="bg-emerald-500"
          />
        </div>
      </CardContent>
    </Card>
  )
}
