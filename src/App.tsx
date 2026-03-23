import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom'
import { AppShell } from '@/components/layout/AppShell'
import { AuthGuard } from '@/features/auth/components/AuthGuard'
import { LoginPage } from '@/features/auth/pages/LoginPage'
import { DashboardPage } from '@/features/dashboard/pages/DashboardPage'
import { ParticipantsListPage } from '@/features/participants/pages/ParticipantsListPage'
import { ParticipantDetailPage } from '@/features/participants/pages/ParticipantDetailPage'
import { OnboardingWizardPage } from '@/features/onboarding/pages/OnboardingWizardPage'
import { WorkersListPage } from '@/features/workers/pages/WorkersListPage'
import { WorkerDetailPage } from '@/features/workers/pages/WorkerDetailPage'
import { WorkerOnboardingWizardPage } from '@/features/workers/pages/WorkerOnboardingWizardPage'
import { ComplianceDashboardPage } from '@/features/workers/pages/ComplianceDashboardPage'
import { CalendarPage } from '@/features/workers/pages/CalendarPage'
import { ProgressNotesListPage } from '@/features/progress-notes/pages/ProgressNotesListPage'
import { CreateProgressNotePage } from '@/features/progress-notes/pages/CreateProgressNotePage'
import { ConcernsListPage } from '@/features/concerns/pages/ConcernsListPage'
import { CreateConcernPage } from '@/features/concerns/pages/CreateConcernPage'
import { ConcernDetailPage } from '@/features/concerns/pages/ConcernDetailPage'
import { InvoicesListPage } from '@/features/invoices/pages/InvoicesListPage'
import { CreateInvoicePage } from '@/features/invoices/pages/CreateInvoicePage'
import { InvoiceDetailPage } from '@/features/invoices/pages/InvoiceDetailPage'
import { CreateCreditNotePage } from '@/features/invoices/pages/CreateCreditNotePage'
import { CreditNoteDetailPage } from '@/features/invoices/pages/CreditNoteDetailPage'
import { IncidentsListPage } from '@/features/incidents/pages/IncidentsListPage'
import { CreateIncidentPage } from '@/features/incidents/pages/CreateIncidentPage'
import { IncidentDetailPage } from '@/features/incidents/pages/IncidentDetailPage'
import { ComplaintsListPage } from '@/features/complaints/pages/ComplaintsListPage'
import { CreateComplaintPage } from '@/features/complaints/pages/CreateComplaintPage'
import { ComplaintDetailPage } from '@/features/complaints/pages/ComplaintDetailPage'
import { GoalsListPage } from '@/features/goals/pages/GoalsListPage'
import { CreateGoalPage } from '@/features/goals/pages/CreateGoalPage'
import { GoalDetailPage } from '@/features/goals/pages/GoalDetailPage'
import { ConsentListPage } from '@/features/consent/pages/ConsentListPage'
import { CreateConsentPage } from '@/features/consent/pages/CreateConsentPage'
import { ConsentDetailPage } from '@/features/consent/pages/ConsentDetailPage'
import { CreateRightsAcknowledgmentPage } from '@/features/consent/pages/CreateRightsAcknowledgmentPage'
import { CreateCapacityAssessmentPage } from '@/features/consent/pages/CreateCapacityAssessmentPage'
import { CreateAuthorisedRepPage } from '@/features/consent/pages/CreateAuthorisedRepPage'
import { RisksListPage } from '@/features/risks/pages/RisksListPage'
import { CreateRiskPage } from '@/features/risks/pages/CreateRiskPage'
import { RiskDetailPage } from '@/features/risks/pages/RiskDetailPage'
import { AiBuddyPage } from '@/features/ai-buddy/pages/AiBuddyPage'
import { PolicyLibraryPage } from '@/features/policy-library/pages/PolicyLibraryPage'
import { PolicyDetailPage } from '@/features/policy-library/pages/PolicyDetailPage'
import { AuditLogsPage } from '@/features/audit/pages/AuditLogsPage'
import { ServiceAgreementsListPage } from '@/features/service-agreements/pages/ServiceAgreementsListPage'
import { CreateServiceAgreementPage } from '@/features/service-agreements/pages/CreateServiceAgreementPage'
import { ServiceAgreementDetailPage } from '@/features/service-agreements/pages/ServiceAgreementDetailPage'
import { DocumentsHubPage } from '@/features/documents/pages/DocumentsHubPage'
import { SettingsPage } from '@/features/settings/pages/SettingsPage'
import { NotificationsPage } from '@/features/notifications/pages/NotificationsPage'
import { MessagesPage } from '@/features/messages/pages/MessagesPage'
// Portal
import { PortalLoginPage } from '@/features/portal/pages/PortalLoginPage'
import { PortalGuard } from '@/features/portal/components/PortalGuard'
import { PortalShell } from '@/features/portal/components/PortalShell'
import { PortalDashboardPage } from '@/features/portal/pages/PortalDashboardPage'
import { PortalBudgetPage } from '@/features/portal/pages/PortalBudgetPage'
import { PortalGoalsPage } from '@/features/portal/pages/PortalGoalsPage'
import { PortalNotesPage } from '@/features/portal/pages/PortalNotesPage'
import { PortalDocumentsPage } from '@/features/portal/pages/PortalDocumentsPage'
import { PortalBookingsPage } from '@/features/portal/pages/PortalBookingsPage'
import { PortalComplaintPage } from '@/features/portal/pages/PortalComplaintPage'

const router = createBrowserRouter([
  { path: '/login', element: <LoginPage /> },
  // Participant & Family Portal (separate from admin)
  { path: '/portal/login', element: <PortalLoginPage /> },
  {
    path: '/portal',
    element: <PortalGuard />,
    children: [
      {
        element: <PortalShell />,
        children: [
          { index: true, element: <PortalDashboardPage /> },
          { path: 'budget', element: <PortalBudgetPage /> },
          { path: 'goals', element: <PortalGoalsPage /> },
          { path: 'notes', element: <PortalNotesPage /> },
          { path: 'documents', element: <PortalDocumentsPage /> },
          { path: 'bookings', element: <PortalBookingsPage /> },
          { path: 'complaint', element: <PortalComplaintPage /> },
        ],
      },
    ],
  },
  // Admin app
  {
    element: <AuthGuard />,
    children: [
      {
        element: <AppShell />,
        children: [
          { index: true, element: <Navigate to="/dashboard" replace /> },
          { path: 'dashboard', element: <DashboardPage /> },
          { path: 'participants', element: <ParticipantsListPage /> },
          { path: 'participants/:id', element: <ParticipantDetailPage /> },
          { path: 'onboarding/new', element: <OnboardingWizardPage /> },
          { path: 'onboarding/:id', element: <OnboardingWizardPage /> },
          { path: 'workers', element: <WorkersListPage /> },
          { path: 'workers/:id', element: <WorkerDetailPage /> },
          { path: 'workers/onboarding/new', element: <WorkerOnboardingWizardPage /> },
          { path: 'workers/onboarding/:id', element: <WorkerOnboardingWizardPage /> },
          { path: 'calendar', element: <CalendarPage /> },
          { path: 'goals', element: <GoalsListPage /> },
          { path: 'goals/new', element: <CreateGoalPage /> },
          { path: 'goals/:id', element: <GoalDetailPage /> },
          { path: 'progress-notes', element: <ProgressNotesListPage /> },
          { path: 'progress-notes/new', element: <CreateProgressNotePage /> },
          { path: 'concerns', element: <ConcernsListPage /> },
          { path: 'concerns/new', element: <CreateConcernPage /> },
          { path: 'concerns/:id', element: <ConcernDetailPage /> },
          { path: 'compliance', element: <ComplianceDashboardPage /> },
          { path: 'invoices', element: <InvoicesListPage /> },
          { path: 'invoices/new', element: <CreateInvoicePage /> },
          { path: 'invoices/:id', element: <InvoiceDetailPage /> },
          { path: 'invoices/:invoiceId/credit-notes/new', element: <CreateCreditNotePage /> },
          { path: 'invoices/:invoiceId/credit-notes/:id', element: <CreditNoteDetailPage /> },
          { path: 'incidents', element: <IncidentsListPage /> },
          { path: 'incidents/new', element: <CreateIncidentPage /> },
          { path: 'incidents/:id', element: <IncidentDetailPage /> },
          { path: 'complaints', element: <ComplaintsListPage /> },
          { path: 'complaints/new', element: <CreateComplaintPage /> },
          { path: 'complaints/:id', element: <ComplaintDetailPage /> },
          { path: 'service-agreements', element: <ServiceAgreementsListPage /> },
          { path: 'service-agreements/new', element: <CreateServiceAgreementPage /> },
          { path: 'service-agreements/:id', element: <ServiceAgreementDetailPage /> },
          { path: 'consent', element: <ConsentListPage /> },
          { path: 'consent/new', element: <CreateConsentPage /> },
          { path: 'consent/:id', element: <ConsentDetailPage /> },
          { path: 'consent/rights/new', element: <CreateRightsAcknowledgmentPage /> },
          { path: 'consent/capacity/new', element: <CreateCapacityAssessmentPage /> },
          { path: 'consent/representatives/new', element: <CreateAuthorisedRepPage /> },
          { path: 'risks', element: <RisksListPage /> },
          { path: 'risks/new', element: <CreateRiskPage /> },
          { path: 'risks/:id', element: <RiskDetailPage /> },
          { path: 'notifications', element: <NotificationsPage /> },
          { path: 'messages', element: <MessagesPage /> },
          { path: 'policies', element: <PolicyLibraryPage /> },
          { path: 'policies/:id', element: <PolicyDetailPage /> },
          { path: 'ai-buddy', element: <AiBuddyPage /> },
          { path: 'audit', element: <AuditLogsPage /> },
          { path: 'documents', element: <DocumentsHubPage /> },
          { path: 'settings', element: <SettingsPage /> },
        ],
      },
    ],
  },
])

export default function App() {
  return <RouterProvider router={router} />
}
