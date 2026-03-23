import { useState, useCallback, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/providers/AuthProvider'
import type { Tables, Json } from '@/lib/types'

type Workflow = Tables<'workflows'>

interface WizardState {
  workflowId: string | null
  workerId: string | null
  currentStage: number
  completedStages: number[]
  stageData: Record<number, Record<string, unknown>>
  status: 'in_progress' | 'completed' | 'abandoned'
}

export function useWorkerOnboardingWizard(workflowId?: string) {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [state, setState] = useState<WizardState>({
    workflowId: workflowId || null,
    workerId: null,
    currentStage: 1,
    completedStages: [],
    stageData: {},
    status: 'in_progress',
  })

  const { data: workflow } = useQuery({
    queryKey: ['workflow', workflowId],
    queryFn: async () => {
      if (!workflowId) return null
      const { data, error } = await supabase
        .from('workflows')
        .select('*')
        .eq('id', workflowId)
        .single()
      if (error) throw error
      return data as Workflow
    },
    enabled: !!workflowId,
  })

  useEffect(() => {
    if (workflow) {
      const rawStageData = (workflow.stage_data || {}) as Record<string, Record<string, unknown>>
      const numericStageData: Record<number, Record<string, unknown>> = {}
      for (const [key, value] of Object.entries(rawStageData)) {
        numericStageData[parseInt(key)] = value
      }
      setState({
        workflowId: workflow.id,
        workerId: workflow.reference_id,
        currentStage: workflow.current_stage,
        completedStages: workflow.completed_stages || [],
        stageData: numericStageData,
        status: workflow.status,
      })
    }
  }, [workflow])

  const createWorkflow = useMutation({
    mutationFn: async (workerId: string) => {
      const { data, error } = await supabase
        .from('workflows')
        .insert({
          type: 'worker_onboarding',
          reference_id: workerId,
          total_stages: 10,
          current_stage: 1,
          started_by: user?.id,
          stage_data: {} as Json,
          completed_stages: [],
        } as never)
        .select()
        .single()
      if (error) throw error
      return data as unknown as Workflow
    },
    onSuccess: (data) => {
      setState((prev) => ({
        ...prev,
        workflowId: data.id,
        workerId: data.reference_id,
      }))
    },
  })

  const saveStageData = useMutation({
    mutationFn: async ({
      stageNumber,
      data,
      moveToNext,
    }: {
      stageNumber: number
      data: Record<string, unknown>
      moveToNext: boolean
    }) => {
      if (!state.workflowId) return

      const newStageData = { ...state.stageData, [stageNumber]: data }
      const newCompleted =
        moveToNext && !state.completedStages.includes(stageNumber)
          ? [...state.completedStages, stageNumber]
          : state.completedStages
      const newCurrentStage = moveToNext ? stageNumber + 1 : state.currentStage

      const stageDataJson: Record<string, unknown> = {}
      for (const [key, value] of Object.entries(newStageData)) {
        stageDataJson[key.toString()] = value
      }

      const { error } = await supabase
        .from('workflows')
        .update({
          stage_data: stageDataJson as Json,
          completed_stages: newCompleted,
          current_stage: newCurrentStage,
          updated_at: new Date().toISOString(),
        } as never)
        .eq('id', state.workflowId)
      if (error) throw error

      setState((prev) => ({
        ...prev,
        stageData: newStageData,
        completedStages: newCompleted,
        currentStage: newCurrentStage,
      }))
    },
  })

  const completeWorkflow = useMutation({
    mutationFn: async () => {
      if (!state.workflowId) return

      // Mark workflow as completed
      const { error } = await supabase
        .from('workflows')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        } as never)
        .eq('id', state.workflowId)
      if (error) throw error

      // Set worker status to active
      if (state.workerId) {
        const { error: workerError } = await supabase
          .from('workers')
          .update({ status: 'active', updated_at: new Date().toISOString() } as never)
          .eq('id', state.workerId)
        if (workerError) throw workerError
      }

      queryClient.invalidateQueries({ queryKey: ['workers'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] })
    },
  })

  const goToStage = useCallback((stage: number) => {
    setState((prev) => ({ ...prev, currentStage: stage }))
  }, [])

  const nextStage = useCallback(() => {
    setState((prev) => ({ ...prev, currentStage: prev.currentStage + 1 }))
  }, [])

  const prevStage = useCallback(() => {
    setState((prev) => ({ ...prev, currentStage: Math.max(1, prev.currentStage - 1) }))
  }, [])

  return {
    ...state,
    createWorkflow,
    saveStageData,
    completeWorkflow,
    goToStage,
    nextStage,
    prevStage,
    isLoading: createWorkflow.isPending || saveStageData.isPending,
  }
}
