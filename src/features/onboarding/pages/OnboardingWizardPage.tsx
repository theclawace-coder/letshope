import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useOnboardingWizard } from '../hooks/useOnboardingWizard'
import { useParticipant, useCreateParticipant, useUpdateParticipant } from '@/features/participants/hooks/useParticipants'
import { StepIndicator } from '@/components/shared/StepIndicator'
import { GuidancePanel } from '@/components/shared/GuidancePanel'
import { PageHeader } from '@/components/shared/PageHeader'
import { Button } from '@/components/ui/button'
import { ONBOARDING_STAGES } from '../constants'
import { Stage1Referral } from '../components/stages/Stage1Referral'
import { Stage2MeetAndLearn } from '../components/stages/Stage2MeetAndLearn'
import { Stage3ReviewAndSign } from '../components/stages/Stage3ReviewAndSign'
import { Stage4TeamAndSchedule } from '../components/stages/Stage4TeamAndSchedule'
import { Stage5RiskAndGoLive } from '../components/stages/Stage5RiskAndGoLive'
import { Lightbulb, ArrowLeft } from 'lucide-react'
import type { Stage1Data, Stage2Data, Stage3Data, Stage4Data, Stage5Data } from '../schemas'
import { supabase } from '@/lib/supabase'

export function OnboardingWizardPage() {
  const { id: workflowId } = useParams()
  const navigate = useNavigate()
  const wizard = useOnboardingWizard(workflowId)
  const { data: participant } = useParticipant(wizard.participantId ?? undefined)
  const createParticipant = useCreateParticipant()
  const updateParticipant = useUpdateParticipant()
  const [guidanceOpen, setGuidanceOpen] = useState(true)

  const currentStageConfig = ONBOARDING_STAGES[wizard.currentStage - 1]
  const steps = ONBOARDING_STAGES.map((s) => ({ number: s.number, title: s.title }))

  // ── Stage 1: Referral ──
  async function handleStage1(data: Stage1Data) {
    const participant = await createParticipant.mutateAsync({
      first_name: data.first_name,
      last_name: data.last_name,
      ndis_number: data.ndis_number,
      phone: data.phone || null,
      email: data.email || null,
      services_requested: data.services_requested,
      referral_source: data.referral_source,
      urgency: data.urgency,
      referral_notes: data.referral_notes || null,
      referral_date: new Date().toISOString().split('T')[0],
      status: 'referral',
    })
    const workflow = await wizard.createWorkflow.mutateAsync(participant.id)
    await wizard.saveStageData.mutateAsync({
      stageNumber: 1,
      data: data as unknown as Record<string, unknown>,
      moveToNext: true,
      workflowId: workflow.id,
    })
  }

  // ── Stage 2: Meet & Learn (merged old stages 2+3) ──
  async function handleStage2(data: Stage2Data) {
    if (wizard.participantId) {
      await updateParticipant.mutateAsync({
        id: wizard.participantId,
        data: {
          has_guardian: data.has_guardian,
          guardian_name: data.guardian_name || null,
          guardian_relationship: data.guardian_relationship || null,
          guardian_phone: data.guardian_phone || null,
          guardian_authority: data.guardian_authority || null,
          communication_needs: data.communication_needs || null,
          cultural_needs: data.cultural_needs || null,
          mobility_needs: data.mobility_needs || null,
          medical_conditions: data.medical_conditions
            ? data.medical_conditions.split(',').map((s) => s.trim()).filter(Boolean)
            : [],
          allergies: data.allergies
            ? data.allergies.split(',').map((s) => s.trim()).filter(Boolean)
            : [],
          // Personal details (previously Stage 3)
          date_of_birth: data.date_of_birth,
          gender: data.gender || null,
          address: data.address_street ? {
            street: data.address_street,
            suburb: data.address_suburb || '',
            state: data.address_state || '',
            postcode: data.address_postcode || '',
          } : null,
          funding_type: data.funding_type,
          plan_start_date: data.plan_start_date,
          plan_end_date: data.plan_end_date,
          plan_number: data.plan_number || null,
          support_coordinator_name: data.support_coordinator_name || null,
          support_coordinator_phone: data.support_coordinator_phone || null,
          support_coordinator_email: data.support_coordinator_email || null,
          lac_name: data.lac_name || null,
          lac_contact: data.lac_contact || null,
          gp_name: data.gp_name || null,
          gp_phone: data.gp_phone || null,
          gp_address: data.gp_address || null,
          emergency_contacts: data.emergency_contacts,
          goals: data.goals,
          living_situation: data.living_situation || null,
          budget_core: data.budget_core ? parseFloat(data.budget_core) : null,
          budget_capacity_building: data.budget_capacity_building ? parseFloat(data.budget_capacity_building) : null,
          budget_capital: data.budget_capital ? parseFloat(data.budget_capital) : null,
          status: 'onboarding',
        },
      })
    }
    await wizard.saveStageData.mutateAsync({
      stageNumber: 2,
      data: data as unknown as Record<string, unknown>,
      moveToNext: true,
    })
  }

  // ── Stage 3: Review & Sign ──
  async function handleStage3(data: Stage3Data) {
    await wizard.saveStageData.mutateAsync({
      stageNumber: 3,
      data: data as unknown as Record<string, unknown>,
      moveToNext: true,
    })
  }

  // ── Stage 4: Team & Schedule ──
  async function handleStage4(data: Stage4Data) {
    if (wizard.participantId) {
      // Create worker-participant assignments
      for (const assignment of data.assignments) {
        await supabase.from('worker_participant_assignments').insert({
          worker_id: assignment.worker_id,
          participant_id: wizard.participantId,
          registration_group: assignment.registration_group,
        } as never)
      }
      // Create bookings
      for (const booking of data.bookings) {
        if (booking.booking_date) {
          await supabase.from('bookings').insert({
            participant_id: wizard.participantId,
            worker_id: booking.worker_id,
            registration_group: booking.registration_group,
            booking_date: booking.booking_date,
            start_time: booking.start_time,
            end_time: booking.end_time,
            recurrence: booking.recurrence,
            notes: booking.notes || null,
            status: 'scheduled',
          } as never)
        }
      }
    }
    await wizard.saveStageData.mutateAsync({
      stageNumber: 4,
      data: data as unknown as Record<string, unknown>,
      moveToNext: true,
    })
  }

  // ── Stage 5: Risk & Go Live ──
  async function handleStage5(data: Stage5Data) {
    if (wizard.participantId) {
      const now = new Date()
      const reviewMonths = data.risk_level === 'low' ? 6 : 3
      const reviewDate = new Date(now.setMonth(now.getMonth() + reviewMonths))

      await updateParticipant.mutateAsync({
        id: wizard.participantId,
        data: {
          risk_level: data.risk_level,
          risk_assessment_date: new Date().toISOString().split('T')[0],
          risk_review_date: reviewDate.toISOString().split('T')[0],
          status: 'active',
        },
      })
    }
    await wizard.completeWorkflow.mutateAsync()
    navigate(`/participants/${wizard.participantId}`)
  }

  const stage1Data = wizard.stageData[1] as Stage1Data | undefined

  const stage5StageData = {
    stage1: wizard.stageData[1] as Stage1Data | undefined,
    stage2: wizard.stageData[2] as Stage2Data | undefined,
    stage3: wizard.stageData[3] as Stage3Data | undefined,
    stage4: wizard.stageData[4] as Stage4Data | undefined,
  }

  return (
    <div className="max-w-4xl mx-auto">
      <PageHeader
        title="Participant Onboarding"
        description={currentStageConfig?.description}
        action={
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setGuidanceOpen(!guidanceOpen)}>
              <Lightbulb className="h-4 w-4 mr-1" />
              Guidance
            </Button>
            <Button variant="ghost" size="sm" onClick={() => navigate('/participants')}>
              <ArrowLeft className="h-4 w-4 mr-1" />
              Exit
            </Button>
          </div>
        }
      />

      <div className="mb-8">
        <StepIndicator
          steps={steps}
          currentStep={wizard.currentStage}
          completedSteps={wizard.completedStages}
          onStepClick={wizard.goToStage}
        />
      </div>

      <div className={guidanceOpen ? 'mr-84' : ''}>
        {wizard.currentStage === 1 && (
          <Stage1Referral
            defaultValues={wizard.stageData[1] as Partial<Stage1Data> | undefined}
            onSubmit={handleStage1}
            isLoading={wizard.isLoading || createParticipant.isPending}
          />
        )}
        {wizard.currentStage === 2 && (
          <Stage2MeetAndLearn
            defaultValues={wizard.stageData[2] as Partial<Stage2Data> | undefined}
            servicesRequested={stage1Data?.services_requested || []}
            onSubmit={handleStage2}
            onBack={wizard.prevStage}
            isLoading={wizard.isLoading}
          />
        )}
        {wizard.currentStage === 3 && (
          <Stage3ReviewAndSign
            defaultValues={wizard.stageData[3] as Partial<Stage3Data> | undefined}
            onSubmit={handleStage3}
            onBack={wizard.prevStage}
            isLoading={wizard.isLoading}
            participant={participant}
          />
        )}
        {wizard.currentStage === 4 && (
          <Stage4TeamAndSchedule
            defaultValues={wizard.stageData[4] as Partial<Stage4Data> | undefined}
            servicesRequested={stage1Data?.services_requested || []}
            onSubmit={handleStage4}
            onBack={wizard.prevStage}
            isLoading={wizard.isLoading}
          />
        )}
        {wizard.currentStage === 5 && (
          <Stage5RiskAndGoLive
            defaultValues={wizard.stageData[5] as Partial<Stage5Data> | undefined}
            stageData={stage5StageData}
            onSubmit={handleStage5}
            onBack={wizard.prevStage}
            isLoading={wizard.isLoading}
          />
        )}
      </div>

      {currentStageConfig && (
        <GuidancePanel
          title={currentStageConfig.title}
          content={currentStageConfig.guidance}
          policyRef={currentStageConfig.policyRef}
          open={guidanceOpen}
          onClose={() => setGuidanceOpen(false)}
        />
      )}
    </div>
  )
}
