import { StyleSheet } from '@react-pdf/renderer'

// Hope Disability Support brand colours
export const BRAND = {
  primary: '#7c3aed',       // Violet-600
  primaryLight: '#ede9fe',  // Violet-50
  primaryDark: '#5b21b6',   // Violet-800
  text: '#1e293b',          // Slate-800
  textMuted: '#64748b',     // Slate-500
  border: '#e2e8f0',        // Slate-200
  background: '#ffffff',
  backgroundAlt: '#f8fafc', // Slate-50
  success: '#16a34a',       // Green-600
  danger: '#dc2626',        // Red-600
  warning: '#ea580c',       // Orange-600
} as const

export const baseStyles = StyleSheet.create({
  page: {
    fontFamily: 'Helvetica',
    fontSize: 10,
    color: BRAND.text,
    paddingTop: 80,
    paddingBottom: 60,
    paddingHorizontal: 40,
  },
  // Header (rendered at top of every page)
  headerBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 60,
    backgroundColor: BRAND.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 40,
  },
  headerTitle: {
    color: '#ffffff',
    fontSize: 16,
    fontFamily: 'Helvetica-Bold',
  },
  headerSubtitle: {
    color: '#e0d4ff',
    fontSize: 9,
  },
  headerRight: {
    alignItems: 'flex-end',
  },
  headerDate: {
    color: '#ffffff',
    fontSize: 8,
  },
  // Footer
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 40,
    borderTopWidth: 1,
    borderTopColor: BRAND.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 40,
  },
  footerText: {
    fontSize: 7,
    color: BRAND.textMuted,
  },
  pageNumber: {
    fontSize: 7,
    color: BRAND.textMuted,
  },
  // Typography
  title: {
    fontSize: 20,
    fontFamily: 'Helvetica-Bold',
    color: BRAND.primary,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 12,
    color: BRAND.textMuted,
    marginBottom: 16,
  },
  heading: {
    fontSize: 13,
    fontFamily: 'Helvetica-Bold',
    color: BRAND.text,
    marginTop: 16,
    marginBottom: 8,
    paddingBottom: 4,
    borderBottomWidth: 1,
    borderBottomColor: BRAND.primary,
  },
  subheading: {
    fontSize: 11,
    fontFamily: 'Helvetica-Bold',
    color: BRAND.text,
    marginTop: 10,
    marginBottom: 4,
  },
  body: {
    fontSize: 10,
    lineHeight: 1.5,
    color: BRAND.text,
  },
  small: {
    fontSize: 8,
    color: BRAND.textMuted,
  },
  bold: {
    fontFamily: 'Helvetica-Bold',
  },
  // Layout
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  spacer: {
    height: 12,
  },
  divider: {
    height: 1,
    backgroundColor: BRAND.border,
    marginVertical: 12,
  },
  // Form field row
  fieldRow: {
    flexDirection: 'row',
    marginBottom: 6,
    gap: 8,
  },
  fieldLabel: {
    fontSize: 9,
    color: BRAND.textMuted,
    width: 140,
    fontFamily: 'Helvetica-Bold',
  },
  fieldValue: {
    fontSize: 10,
    color: BRAND.text,
    flex: 1,
  },
  // Info box / highlight
  infoBox: {
    backgroundColor: BRAND.primaryLight,
    borderRadius: 4,
    padding: 10,
    marginVertical: 8,
  },
  warningBox: {
    backgroundColor: '#fef3c7', // Amber-100
    borderRadius: 4,
    padding: 10,
    marginVertical: 8,
    borderLeftWidth: 3,
    borderLeftColor: BRAND.warning,
  },
  // Table
  table: {
    marginVertical: 8,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: BRAND.primaryLight,
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: BRAND.primary,
  },
  tableHeaderCell: {
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
    color: BRAND.primaryDark,
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 5,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: BRAND.border,
  },
  tableRowAlt: {
    flexDirection: 'row',
    paddingVertical: 5,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: BRAND.border,
    backgroundColor: BRAND.backgroundAlt,
  },
  tableCell: {
    fontSize: 9,
    color: BRAND.text,
  },
  // Signature block
  signatureBlock: {
    marginTop: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 40,
  },
  signatureBox: {
    flex: 1,
    borderTopWidth: 1,
    borderTopColor: BRAND.text,
    paddingTop: 4,
  },
  signatureLabel: {
    fontSize: 8,
    color: BRAND.textMuted,
  },
  signatureImage: {
    height: 50,
    objectFit: 'contain',
    marginBottom: 4,
  },
  // Checkbox
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    gap: 6,
  },
  checkbox: {
    width: 12,
    height: 12,
    borderWidth: 1,
    borderColor: BRAND.text,
    borderRadius: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    width: 12,
    height: 12,
    borderWidth: 1,
    borderColor: BRAND.success,
    borderRadius: 2,
    backgroundColor: BRAND.success,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkmark: {
    color: '#ffffff',
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
  },
  // Badge-style labels
  badge: {
    fontSize: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    fontFamily: 'Helvetica-Bold',
  },
  badgePrimary: {
    backgroundColor: BRAND.primaryLight,
    color: BRAND.primaryDark,
  },
  badgeSuccess: {
    backgroundColor: '#dcfce7',
    color: BRAND.success,
  },
  badgeDanger: {
    backgroundColor: '#fee2e2',
    color: BRAND.danger,
  },
  badgeWarning: {
    backgroundColor: '#fef3c7',
    color: BRAND.warning,
  },
})
