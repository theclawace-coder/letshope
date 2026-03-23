import { Page, View, Text, Image } from '@react-pdf/renderer'
import { baseStyles, BRAND } from './styles'
import type { ReactNode } from 'react'

// ─── Organisation info passed to every template ──────────────────────────
export interface OrgInfo {
  name: string
  abn?: string | null
  ndis_registration_number?: string | null
  phone?: string | null
  email?: string | null
  address?: string | null
  logo_url?: string | null
}

// ─── Branded page with header + footer on every page ─────────────────────
interface BrandedPageProps {
  org: OrgInfo
  documentTitle: string
  documentId?: string
  children: ReactNode
}

export function BrandedPage({ org, documentTitle, documentId, children }: BrandedPageProps) {
  return (
    <Page size="A4" style={baseStyles.page}>
      {/* Header bar */}
      <View style={baseStyles.headerBar} fixed>
        <View>
          <Text style={baseStyles.headerTitle}>{org.name}</Text>
          <Text style={baseStyles.headerSubtitle}>
            {org.ndis_registration_number ? `NDIS Reg: ${org.ndis_registration_number}` : 'NDIS Registered Provider'}
            {org.abn ? `  |  ABN: ${org.abn}` : ''}
          </Text>
        </View>
        <View style={baseStyles.headerRight}>
          <Text style={baseStyles.headerDate}>{documentTitle}</Text>
          {documentId && <Text style={baseStyles.headerDate}>Ref: {documentId}</Text>}
        </View>
      </View>

      {/* Content */}
      {children}

      {/* Footer */}
      <View style={baseStyles.footer} fixed>
        <Text style={baseStyles.footerText}>
          {org.name} | {org.phone || ''} | {org.email || ''} | Confidential
        </Text>
        <Text style={baseStyles.pageNumber} render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`} />
      </View>
    </Page>
  )
}

// ─── Field row: label + value ────────────────────────────────────────────
interface FieldProps {
  label: string
  value?: string | number | null
  half?: boolean
}

export function Field({ label, value, half }: FieldProps) {
  return (
    <View style={[baseStyles.fieldRow, half ? { width: '50%' } : {}]}>
      <Text style={baseStyles.fieldLabel}>{label}</Text>
      <Text style={baseStyles.fieldValue}>{value ?? '-'}</Text>
    </View>
  )
}

// ─── Two fields side by side ─────────────────────────────────────────────
export function FieldRow({ children }: { children: ReactNode }) {
  return <View style={{ flexDirection: 'row', gap: 8 }}>{children}</View>
}

// ─── Section heading ─────────────────────────────────────────────────────
export function Section({ title }: { title: string }) {
  return <Text style={baseStyles.heading}>{title}</Text>
}

// ─── Checkbox row ────────────────────────────────────────────────────────
interface CheckItemProps {
  label: string
  checked: boolean
}

export function CheckItem({ label, checked }: CheckItemProps) {
  return (
    <View style={baseStyles.checkboxRow}>
      <View style={checked ? baseStyles.checkboxChecked : baseStyles.checkbox}>
        {checked && <Text style={baseStyles.checkmark}>✓</Text>}
      </View>
      <Text style={baseStyles.body}>{label}</Text>
    </View>
  )
}

// ─── Signature block ─────────────────────────────────────────────────────
interface SignatureProps {
  label: string
  signatureDataUrl?: string | null
  date?: string | null
}

export function SignatureBlock({ label, signatureDataUrl, date }: SignatureProps) {
  return (
    <View style={{ flex: 1 }}>
      {signatureDataUrl ? (
        <Image src={signatureDataUrl} style={baseStyles.signatureImage} />
      ) : (
        <View style={{ height: 50, borderBottomWidth: 1, borderBottomColor: BRAND.text }} />
      )}
      <View style={baseStyles.signatureBox}>
        <Text style={baseStyles.signatureLabel}>{label}</Text>
        {date && <Text style={baseStyles.signatureLabel}>Date: {date}</Text>}
      </View>
    </View>
  )
}

// ─── Info box ────────────────────────────────────────────────────────────
export function InfoBox({ children }: { children: ReactNode }) {
  return <View style={baseStyles.infoBox}>{children}</View>
}

export function WarningBox({ children }: { children: ReactNode }) {
  return <View style={baseStyles.warningBox}>{children}</View>
}

// ─── Table helpers ───────────────────────────────────────────────────────
interface TableColumn {
  key: string
  header: string
  width: string | number  // e.g. '30%' or 100
}

interface SimpleTableProps {
  columns: TableColumn[]
  rows: Record<string, string | number | null | undefined>[]
}

export function SimpleTable({ columns, rows }: SimpleTableProps) {
  return (
    <View style={baseStyles.table}>
      <View style={baseStyles.tableHeader}>
        {columns.map((col) => (
          <Text key={col.key} style={[baseStyles.tableHeaderCell, { width: col.width }]}>{col.header}</Text>
        ))}
      </View>
      {rows.map((row, i) => (
        <View key={i} style={i % 2 === 1 ? baseStyles.tableRowAlt : baseStyles.tableRow}>
          {columns.map((col) => (
            <Text key={col.key} style={[baseStyles.tableCell, { width: col.width }]}>{row[col.key] ?? '-'}</Text>
          ))}
        </View>
      ))}
    </View>
  )
}

// ─── Spacer ──────────────────────────────────────────────────────────────
export function Spacer() {
  return <View style={baseStyles.spacer} />
}

export function Divider() {
  return <View style={baseStyles.divider} />
}

// ─── Badge ───────────────────────────────────────────────────────────────
type BadgeVariant = 'primary' | 'success' | 'danger' | 'warning'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const badgeVariantStyles: Record<BadgeVariant, any> = {
  primary: baseStyles.badgePrimary,
  success: baseStyles.badgeSuccess,
  danger: baseStyles.badgeDanger,
  warning: baseStyles.badgeWarning,
}

export function PdfBadge({ text, variant = 'primary' }: { text: string; variant?: BadgeVariant }) {
  return <Text style={[baseStyles.badge, badgeVariantStyles[variant]]}>{text}</Text>
}
