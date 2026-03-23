import { FileText } from 'lucide-react'
import type { PolicySource } from '../hooks/useAiBuddy'

const categoryLabels: Record<string, string> = {
  practice_standards: 'Practice Standards',
  code_of_conduct: 'Code of Conduct',
  pricing: 'Pricing',
  quality_indicators: 'Quality Indicators',
  worker_screening: 'Worker Screening',
  complaints_management: 'Complaints Management',
  incident_management: 'Incident Management',
  restrictive_practices: 'Restrictive Practices',
  plan_management: 'Plan Management',
  sil: 'SIL',
  community_participation: 'Community Participation',
  internal_policy: 'Internal Policy',
  governance: 'Governance',
  risk_management: 'Risk Management',
  participant_documentation: 'Participant Documentation',
  audit: 'Audit',
  high_intensity: 'High Intensity',
  behaviour_support: 'Behaviour Support',
  emergency_management: 'Emergency Management',
  human_resources: 'Human Resources',
  insurance: 'Insurance',
  other: 'Other',
}

interface PolicySourceCardProps {
  source: PolicySource
}

export function PolicySourceCard({ source }: PolicySourceCardProps) {
  const relevance = Math.round(source.similarity * 100)

  return (
    <div className="flex items-start gap-2 rounded-lg border bg-card p-2.5 text-xs">
      <FileText className="h-3.5 w-3.5 mt-0.5 shrink-0 text-primary" />
      <div className="flex-1 min-w-0">
        <p className="font-medium truncate">{source.title}</p>
        <p className="text-muted-foreground truncate">{source.source}</p>
      </div>
      <div className="flex flex-col items-end gap-0.5 shrink-0">
        <span className="inline-flex items-center rounded-full bg-primary/10 px-1.5 py-0.5 text-[10px] font-medium text-primary">
          {relevance}% match
        </span>
        <span className="text-[10px] text-muted-foreground">
          {categoryLabels[source.category] ?? source.category}
        </span>
      </div>
    </div>
  )
}
