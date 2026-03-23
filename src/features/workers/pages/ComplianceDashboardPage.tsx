import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useWorkers } from '../hooks/useWorkers'
import { useWorkerCompliance } from '../hooks/useWorkerCompliance'
import { ComplianceStatusBadge } from '../components/ComplianceStatusBadge'
import { PageHeader } from '@/components/shared/PageHeader'
import { LoadingState } from '@/components/shared/LoadingState'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Search, ShieldCheck, ShieldAlert, ShieldX, CheckCircle, XCircle, MinusCircle } from 'lucide-react'

function ComplianceIcon({ status }: { status: string }) {
  if (status === 'green' || status === 'na') return <CheckCircle className="h-4 w-4 text-green-600" />
  if (status === 'amber') return <MinusCircle className="h-4 w-4 text-amber-600" />
  return <XCircle className="h-4 w-4 text-red-600" />
}

export function ComplianceDashboardPage() {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const { data: workers, isLoading } = useWorkers()
  const compliance = useWorkerCompliance(workers)

  const filtered = compliance.filter((c) => {
    if (statusFilter !== 'all' && c.overallStatus !== statusFilter) return false
    if (search && !c.workerName.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  const greenCount = compliance.filter((c) => c.overallStatus === 'green').length
  const amberCount = compliance.filter((c) => c.overallStatus === 'amber').length
  const redCount = compliance.filter((c) => c.overallStatus === 'red').length

  if (isLoading) return <LoadingState />

  return (
    <div>
      <PageHeader
        title="Screening Compliance"
        description="Worker screening status and compliance tracking"
      />

      <div className="grid gap-4 md:grid-cols-3 mb-6">
        <Card className="border-green-200">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Compliant</CardTitle>
            <ShieldCheck className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-700">{greenCount}</div>
            <p className="text-xs text-muted-foreground mt-1">All screening current</p>
          </CardContent>
        </Card>

        <Card className="border-amber-200">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">At Risk</CardTitle>
            <ShieldAlert className="h-4 w-4 text-amber-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-700">{amberCount}</div>
            <p className="text-xs text-muted-foreground mt-1">Expiring or incomplete</p>
          </CardContent>
        </Card>

        <Card className="border-red-200">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Non-Compliant</CardTitle>
            <ShieldX className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-700">{redCount}</div>
            <p className="text-xs text-muted-foreground mt-1">Expired or missing critical</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-3 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by worker name..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v || 'all')}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="green">Compliant</SelectItem>
                <SelectItem value="amber">At Risk</SelectItem>
                <SelectItem value="red">Non-Compliant</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Worker</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Progress</TableHead>
                <TableHead>NDIS Screening</TableHead>
                <TableHead>Police Check</TableHead>
                <TableHead>Orientation</TableHead>
                <TableHead>Code of Conduct</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((c) => {
                const ndis = c.items.find((i) => i.label === 'NDIS Screening')
                const police = c.items.find((i) => i.label === 'Police Check')
                const orientation = c.items.find((i) => i.label === 'Orientation')
                const code = c.items.find((i) => i.label === 'Code of Conduct')

                return (
                  <TableRow
                    key={c.workerId}
                    className="cursor-pointer"
                    onClick={() => navigate(`/workers/${c.workerId}`)}
                  >
                    <TableCell className="font-medium">{c.workerName}</TableCell>
                    <TableCell>
                      <ComplianceStatusBadge status={c.overallStatus} />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Progress value={(c.completedSteps / c.totalSteps) * 100} className="w-16" />
                        <span className="text-xs text-muted-foreground">{c.completedSteps}/{c.totalSteps}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <ComplianceIcon status={ndis?.status || 'red'} />
                        <span className="text-xs">{ndis?.detail}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <ComplianceIcon status={police?.status || 'red'} />
                        <span className="text-xs">{police?.detail}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <ComplianceIcon status={orientation?.status || 'red'} />
                    </TableCell>
                    <TableCell>
                      <ComplianceIcon status={code?.status || 'red'} />
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm">View</Button>
                    </TableCell>
                  </TableRow>
                )
              })}
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                    No workers found matching your filters.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
