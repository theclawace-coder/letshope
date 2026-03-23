import { useMemo } from 'react'
import { parseISO, differenceInDays, isValid } from 'date-fns'
import type { Tables } from '@/lib/types'

type Worker = Tables<'workers'>

export type ComplianceLevel = 'green' | 'amber' | 'red'

export interface ComplianceItem {
  label: string
  status: ComplianceLevel | 'na'
  detail: string
  expiryDate?: string
}

export interface WorkerComplianceStatus {
  workerId: string
  workerName: string
  overallStatus: ComplianceLevel
  items: ComplianceItem[]
  completedSteps: number
  totalSteps: number
}

function checkExpiry(dateStr: string | null | undefined, warningDays = 30): ComplianceLevel {
  if (!dateStr) return 'red'
  const date = parseISO(dateStr)
  if (!isValid(date)) return 'red'
  const daysUntil = differenceInDays(date, new Date())
  if (daysUntil < 0) return 'red'
  if (daysUntil <= warningDays) return 'amber'
  return 'green'
}

function getWorkerCompliance(worker: Worker): WorkerComplianceStatus {
  const items: ComplianceItem[] = []
  let completedSteps = 0
  const totalSteps = 10

  // 1. Contract
  if (worker.contract_signed) {
    items.push({ label: 'Contract', status: 'green', detail: 'Signed' })
    completedSteps++
  } else {
    items.push({ label: 'Contract', status: 'red', detail: 'Not signed' })
  }

  // 2. Position Description
  if (worker.position_description_acknowledged) {
    items.push({ label: 'Position Description', status: 'green', detail: 'Acknowledged' })
    completedSteps++
  } else {
    items.push({ label: 'Position Description', status: 'amber', detail: 'Not acknowledged' })
  }

  // 3. 100 Points of ID
  if (worker.identity_points_verified) {
    items.push({ label: '100 Points of ID', status: 'green', detail: 'Verified' })
    completedSteps++
  } else {
    items.push({ label: '100 Points of ID', status: 'red', detail: 'Not verified' })
  }

  // 4. NDIS Screening (critical)
  const ndisStatus = worker.ndis_screening_status
  if (ndisStatus === 'cleared') {
    items.push({ label: 'NDIS Screening', status: 'green', detail: 'Cleared' })
    completedSteps++
  } else if (ndisStatus === 'barred') {
    items.push({ label: 'NDIS Screening', status: 'red', detail: 'BARRED — cannot assign' })
  } else if (ndisStatus === 'expired') {
    items.push({ label: 'NDIS Screening', status: 'red', detail: 'Expired' })
  } else if (ndisStatus === 'pending') {
    items.push({ label: 'NDIS Screening', status: 'amber', detail: 'Pending' })
  } else {
    items.push({ label: 'NDIS Screening', status: 'red', detail: 'Not started' })
  }

  // 5. Police Check
  const policeStatus = worker.police_check_status
  if (policeStatus === 'clear') {
    const expiryLevel = checkExpiry(worker.police_check_expiry)
    items.push({
      label: 'Police Check',
      status: expiryLevel,
      detail: expiryLevel === 'green' ? 'Clear' : expiryLevel === 'amber' ? 'Expiring soon' : 'Expired',
      expiryDate: worker.police_check_expiry || undefined,
    })
    if (expiryLevel !== 'red') completedSteps++
  } else if (policeStatus === 'disclosable') {
    items.push({ label: 'Police Check', status: 'red', detail: 'Disclosable outcomes' })
  } else if (policeStatus === 'pending') {
    items.push({ label: 'Police Check', status: 'amber', detail: 'Pending' })
  } else {
    items.push({ label: 'Police Check', status: 'red', detail: policeStatus === 'expired' ? 'Expired' : 'Not started' })
  }

  // 6. Orientation
  if (worker.orientation_completed) {
    items.push({ label: 'Orientation', status: 'green', detail: 'Completed' })
    completedSteps++
  } else {
    items.push({ label: 'Orientation', status: 'amber', detail: 'Not completed' })
  }

  // 7. WWCC
  const wwccStatus = worker.wwcc_status
  if (wwccStatus === 'not_required') {
    items.push({ label: 'WWCC', status: 'na', detail: 'Not required' })
    completedSteps++
  } else if (wwccStatus === 'cleared') {
    const expiryLevel = checkExpiry(worker.wwcc_expiry)
    items.push({
      label: 'WWCC',
      status: expiryLevel,
      detail: expiryLevel === 'green' ? 'Cleared' : expiryLevel === 'amber' ? 'Expiring soon' : 'Expired',
      expiryDate: worker.wwcc_expiry || undefined,
    })
    if (expiryLevel !== 'red') completedSteps++
  } else if (wwccStatus === 'pending') {
    items.push({ label: 'WWCC', status: 'amber', detail: 'Pending' })
  } else {
    items.push({ label: 'WWCC', status: 'amber', detail: wwccStatus === 'expired' ? 'Expired' : 'Not started' })
  }

  // 8. Code of Conduct
  if (worker.code_of_conduct_signed) {
    items.push({ label: 'Code of Conduct', status: 'green', detail: 'Signed' })
    completedSteps++
  } else {
    items.push({ label: 'Code of Conduct', status: 'red', detail: 'Not signed' })
  }

  // 9. Induction
  if (worker.induction_completed) {
    items.push({ label: 'Induction', status: 'green', detail: 'Completed' })
    completedSteps++
  } else {
    items.push({ label: 'Induction', status: 'amber', detail: 'Not completed' })
  }

  // 10. Qualifications
  const hasGroups = (worker.qualified_registration_groups as string[] | null)?.length
  if (hasGroups) {
    items.push({ label: 'Qualifications', status: 'green', detail: 'Verified' })
    completedSteps++
  } else {
    items.push({ label: 'Qualifications', status: 'amber', detail: 'Not verified' })
  }

  // Determine overall status
  const hasRed = items.some((i) => i.status === 'red')
  const hasAmber = items.some((i) => i.status === 'amber')
  const overallStatus: ComplianceLevel = hasRed ? 'red' : hasAmber ? 'amber' : 'green'

  return {
    workerId: worker.id,
    workerName: `${worker.first_name} ${worker.last_name}`,
    overallStatus,
    items,
    completedSteps,
    totalSteps,
  }
}

export function useWorkerCompliance(workers: Worker[] | undefined) {
  return useMemo(() => {
    if (!workers) return []
    return workers.map(getWorkerCompliance)
  }, [workers])
}
