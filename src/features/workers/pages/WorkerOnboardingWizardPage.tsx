import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useWorkerOnboardingWizard } from '../hooks/useWorkerOnboardingWizard'
import { useCreateWorker, useUpdateWorker } from '../hooks/useWorkers'
import { StepIndicator } from '@/components/shared/StepIndicator'
import { GuidancePanel } from '@/components/shared/GuidancePanel'
import { PageHeader } from '@/components/shared/PageHeader'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { WORKER_ONBOARDING_STAGES, EMPLOYMENT_TYPES } from '../constants'
import { Stage1Contract } from '../components/stages/Stage1Contract'
import { Stage2PositionDescription } from '../components/stages/Stage2PositionDescription'
import { Stage3IdentityPoints } from '../components/stages/Stage3IdentityPoints'
import { Stage4NdisScreening } from '../components/stages/Stage4NdisScreening'
import { Stage5PoliceCheck } from '../components/stages/Stage5PoliceCheck'
import { Stage6Orientation } from '../components/stages/Stage6Orientation'
import { Stage7Wwcc } from '../components/stages/Stage7Wwcc'
import { Stage8CodeOfConduct } from '../components/stages/Stage8CodeOfConduct'
import { Stage9Induction } from '../components/stages/Stage9Induction'
import { Stage10Qualifications } from '../components/stages/Stage10Qualifications'
import { Lightbulb, ArrowLeft } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { workerBasicInfoSchema, type WorkerBasicInfoData } from '../schemas'
import type {
  WorkerStage1Data,
  WorkerStage2Data,
  WorkerStage3Data,
  WorkerStage4Data,
  WorkerStage5Data,
  WorkerStage6Data,
  WorkerStage7Data,
  WorkerStage8Data,
  WorkerStage9Data,
  WorkerStage10Data,
} from '../schemas'

function WorkerBasicInfoForm({
  onSubmit,
  isLoading,
}: {
  onSubmit: (data: WorkerBasicInfoData) => void
  isLoading: boolean
}) {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<WorkerBasicInfoData>({
    resolver: zodResolver(workerBasicInfoSchema),
    defaultValues: { employment_type: 'contractor' },
  })

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Worker Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Enter the worker's basic details to begin onboarding.
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="first_name">First Name *</Label>
              <Input id="first_name" {...register('first_name')} />
              {errors.first_name && <p className="text-xs text-destructive">{errors.first_name.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="last_name">Last Name *</Label>
              <Input id="last_name" {...register('last_name')} />
              {errors.last_name && <p className="text-xs text-destructive">{errors.last_name.message}</p>}
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" {...register('email')} />
              {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input id="phone" {...register('phone')} />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="role_title">Role Title *</Label>
              <Input id="role_title" placeholder="e.g., Registered Nurse, Builder" {...register('role_title')} />
              {errors.role_title && <p className="text-xs text-destructive">{errors.role_title.message}</p>}
            </div>
            <div className="space-y-2">
              <Label>Employment Type *</Label>
              <Select
                value={watch('employment_type')}
                onValueChange={(v) => setValue('employment_type', v as WorkerBasicInfoData['employment_type'], { shouldValidate: true })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {EMPLOYMENT_TYPES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="date_of_birth">Date of Birth</Label>
            <Input id="date_of_birth" type="date" {...register('date_of_birth')} />
          </div>
        </CardContent>
      </Card>
      <div className="flex justify-end">
        <Button type="submit" disabled={isLoading}>
          {isLoading ? 'Creating...' : 'Create Worker & Start Onboarding'}
        </Button>
      </div>
    </form>
  )
}

export function WorkerOnboardingWizardPage() {
  const { id: workflowId } = useParams()
  const navigate = useNavigate()
  const wizard = useWorkerOnboardingWizard(workflowId)
  const createWorker = useCreateWorker()
  const updateWorker = useUpdateWorker()
  const [guidanceOpen, setGuidanceOpen] = useState(true)
  const [workerInfo, setWorkerInfo] = useState<{ id: string; role_title: string } | null>(null)

  const currentStageConfig = WORKER_ONBOARDING_STAGES[wizard.currentStage - 1]
  const steps = WORKER_ONBOARDING_STAGES.map((s) => ({ number: s.number, title: s.title }))

  // If no workflow yet, show basic info form first
  const showBasicInfo = !wizard.workflowId && !workflowId

  async function handleCreateWorker(data: WorkerBasicInfoData) {
    const worker = await createWorker.mutateAsync({
      first_name: data.first_name,
      last_name: data.last_name,
      email: data.email || null,
      phone: data.phone || null,
      date_of_birth: data.date_of_birth || null,
      role_title: data.role_title,
      employment_type: data.employment_type,
      status: 'onboarding',
    })
    setWorkerInfo({ id: worker.id, role_title: data.role_title })
    await wizard.createWorkflow.mutateAsync(worker.id)
  }

  const workerId = wizard.workerId || workerInfo?.id
  const roleTitle = workerInfo?.role_title || (wizard.stageData[0] as Record<string, unknown> | undefined)?.role_title as string | undefined

  async function handleStage1(data: WorkerStage1Data) {
    if (workerId) {
      await updateWorker.mutateAsync({
        id: workerId,
        data: { contract_signed: data.contract_signed, contract_date: data.contract_date },
      })
    }
    await wizard.saveStageData.mutateAsync({ stageNumber: 1, data: data as unknown as Record<string, unknown>, moveToNext: true })
  }

  async function handleStage2(data: WorkerStage2Data) {
    if (workerId) {
      await updateWorker.mutateAsync({
        id: workerId,
        data: { position_description_acknowledged: data.position_description_acknowledged },
      })
    }
    await wizard.saveStageData.mutateAsync({ stageNumber: 2, data: data as unknown as Record<string, unknown>, moveToNext: true })
  }

  async function handleStage3(data: WorkerStage3Data) {
    if (workerId) {
      await updateWorker.mutateAsync({
        id: workerId,
        data: { identity_points_verified: true },
      })
    }
    await wizard.saveStageData.mutateAsync({ stageNumber: 3, data: data as unknown as Record<string, unknown>, moveToNext: true })
  }

  async function handleStage4(data: WorkerStage4Data) {
    if (workerId) {
      await updateWorker.mutateAsync({
        id: workerId,
        data: {
          ndis_screening_status: data.ndis_screening_status,
          ndis_screening_number: data.ndis_screening_number || null,
          ndis_screening_date: data.ndis_screening_date || null,
        },
      })
    }
    await wizard.saveStageData.mutateAsync({ stageNumber: 4, data: data as unknown as Record<string, unknown>, moveToNext: true })
  }

  async function handleStage5(data: WorkerStage5Data) {
    if (workerId) {
      await updateWorker.mutateAsync({
        id: workerId,
        data: {
          police_check_status: data.police_check_status,
          police_check_date: data.police_check_date || null,
          police_check_expiry: data.police_check_expiry || null,
        },
      })
    }
    await wizard.saveStageData.mutateAsync({ stageNumber: 5, data: data as unknown as Record<string, unknown>, moveToNext: true })
  }

  async function handleStage6(data: WorkerStage6Data) {
    if (workerId) {
      await updateWorker.mutateAsync({
        id: workerId,
        data: {
          orientation_completed: data.orientation_completed,
          orientation_date: data.orientation_date,
        },
      })
    }
    await wizard.saveStageData.mutateAsync({ stageNumber: 6, data: data as unknown as Record<string, unknown>, moveToNext: true })
  }

  async function handleStage7(data: WorkerStage7Data) {
    if (workerId) {
      await updateWorker.mutateAsync({
        id: workerId,
        data: {
          wwcc_status: data.wwcc_required ? (data.wwcc_status || 'not_started') : 'not_required',
          wwcc_number: data.wwcc_number || null,
          wwcc_expiry: data.wwcc_expiry || null,
        },
      })
    }
    await wizard.saveStageData.mutateAsync({ stageNumber: 7, data: data as unknown as Record<string, unknown>, moveToNext: true })
  }

  async function handleStage8(data: WorkerStage8Data) {
    if (workerId) {
      await updateWorker.mutateAsync({
        id: workerId,
        data: {
          code_of_conduct_signed: data.code_of_conduct_signed,
          code_of_conduct_date: data.code_of_conduct_date,
        },
      })
    }
    await wizard.saveStageData.mutateAsync({ stageNumber: 8, data: data as unknown as Record<string, unknown>, moveToNext: true })
  }

  async function handleStage9(data: WorkerStage9Data) {
    if (workerId) {
      await updateWorker.mutateAsync({
        id: workerId,
        data: {
          induction_completed: true,
          induction_data: data.induction_items,
        },
      })
    }
    await wizard.saveStageData.mutateAsync({ stageNumber: 9, data: data as unknown as Record<string, unknown>, moveToNext: true })
  }

  async function handleStage10(data: WorkerStage10Data) {
    if (workerId) {
      await updateWorker.mutateAsync({
        id: workerId,
        data: {
          qualified_registration_groups: data.qualified_registration_groups,
          other_qualifications: data.qualifications,
          references_verified: data.references_verified,
        },
      })
    }
    await wizard.saveStageData.mutateAsync({ stageNumber: 10, data: data as unknown as Record<string, unknown>, moveToNext: false })
    await wizard.completeWorkflow.mutateAsync()
    navigate(`/workers/${workerId}`)
  }

  return (
    <div className="max-w-4xl mx-auto">
      <PageHeader
        title="Worker Onboarding"
        description={showBasicInfo ? 'Create a new worker profile' : currentStageConfig?.description}
        action={
          <div className="flex gap-2">
            {!showBasicInfo && (
              <Button variant="outline" size="sm" onClick={() => setGuidanceOpen(!guidanceOpen)}>
                <Lightbulb className="h-4 w-4 mr-1" />
                Guidance
              </Button>
            )}
            <Button variant="ghost" size="sm" onClick={() => navigate('/workers')}>
              <ArrowLeft className="h-4 w-4 mr-1" />
              Exit
            </Button>
          </div>
        }
      />

      {!showBasicInfo && (
        <div className="mb-8">
          <StepIndicator
            steps={steps}
            currentStep={wizard.currentStage}
            completedSteps={wizard.completedStages}
            onStepClick={wizard.goToStage}
          />
        </div>
      )}

      <div className={!showBasicInfo && guidanceOpen ? 'mr-84' : ''}>
        {showBasicInfo && (
          <WorkerBasicInfoForm
            onSubmit={handleCreateWorker}
            isLoading={createWorker.isPending || wizard.isLoading}
          />
        )}

        {!showBasicInfo && wizard.currentStage === 1 && (
          <Stage1Contract
            defaultValues={wizard.stageData[1] as Partial<WorkerStage1Data> | undefined}
            workerId={workerId || undefined}
            onSubmit={handleStage1}
            isLoading={wizard.isLoading || updateWorker.isPending}
          />
        )}
        {!showBasicInfo && wizard.currentStage === 2 && (
          <Stage2PositionDescription
            defaultValues={wizard.stageData[2] as Partial<WorkerStage2Data> | undefined}
            workerId={workerId || undefined}
            roleTitle={roleTitle || undefined}
            onSubmit={handleStage2}
            onBack={wizard.prevStage}
            isLoading={wizard.isLoading || updateWorker.isPending}
          />
        )}
        {!showBasicInfo && wizard.currentStage === 3 && (
          <Stage3IdentityPoints
            defaultValues={wizard.stageData[3] as Partial<WorkerStage3Data> | undefined}
            workerId={workerId || undefined}
            onSubmit={handleStage3}
            onBack={wizard.prevStage}
            isLoading={wizard.isLoading || updateWorker.isPending}
          />
        )}
        {!showBasicInfo && wizard.currentStage === 4 && (
          <Stage4NdisScreening
            defaultValues={wizard.stageData[4] as Partial<WorkerStage4Data> | undefined}
            workerId={workerId || undefined}
            onSubmit={handleStage4}
            onBack={wizard.prevStage}
            isLoading={wizard.isLoading || updateWorker.isPending}
          />
        )}
        {!showBasicInfo && wizard.currentStage === 5 && (
          <Stage5PoliceCheck
            defaultValues={wizard.stageData[5] as Partial<WorkerStage5Data> | undefined}
            workerId={workerId || undefined}
            onSubmit={handleStage5}
            onBack={wizard.prevStage}
            isLoading={wizard.isLoading || updateWorker.isPending}
          />
        )}
        {!showBasicInfo && wizard.currentStage === 6 && (
          <Stage6Orientation
            defaultValues={wizard.stageData[6] as Partial<WorkerStage6Data> | undefined}
            workerId={workerId || undefined}
            onSubmit={handleStage6}
            onBack={wizard.prevStage}
            isLoading={wizard.isLoading || updateWorker.isPending}
          />
        )}
        {!showBasicInfo && wizard.currentStage === 7 && (
          <Stage7Wwcc
            defaultValues={wizard.stageData[7] as Partial<WorkerStage7Data> | undefined}
            workerId={workerId || undefined}
            onSubmit={handleStage7}
            onBack={wizard.prevStage}
            isLoading={wizard.isLoading || updateWorker.isPending}
          />
        )}
        {!showBasicInfo && wizard.currentStage === 8 && (
          <Stage8CodeOfConduct
            defaultValues={wizard.stageData[8] as Partial<WorkerStage8Data> | undefined}
            workerId={workerId || undefined}
            onSubmit={handleStage8}
            onBack={wizard.prevStage}
            isLoading={wizard.isLoading || updateWorker.isPending}
          />
        )}
        {!showBasicInfo && wizard.currentStage === 9 && (
          <Stage9Induction
            defaultValues={wizard.stageData[9] as Partial<WorkerStage9Data> | undefined}
            onSubmit={handleStage9}
            onBack={wizard.prevStage}
            isLoading={wizard.isLoading || updateWorker.isPending}
          />
        )}
        {!showBasicInfo && wizard.currentStage === 10 && (
          <Stage10Qualifications
            defaultValues={wizard.stageData[10] as Partial<WorkerStage10Data> | undefined}
            workerId={workerId || undefined}
            roleTitle={roleTitle || undefined}
            onSubmit={handleStage10}
            onBack={wizard.prevStage}
            isLoading={wizard.isLoading || updateWorker.isPending}
          />
        )}
      </div>

      {!showBasicInfo && currentStageConfig && (
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
