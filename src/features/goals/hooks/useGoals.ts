import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import type { Tables } from '@/lib/types'

type Goal = Tables<'goals'>
type GoalProgressEntry = Tables<'goal_progress_entries'>

interface GoalFilters {
  participantId?: string
  status?: string
  domain?: string
  timeframe?: string
}

export interface GoalWithNames extends Goal {
  participant_name?: string
  created_by_name?: string
}

export function useGoals(filters?: GoalFilters) {
  return useQuery({
    queryKey: ['goals', filters],
    queryFn: async () => {
      let query = supabase
        .from('goals')
        .select('*, participants(first_name, last_name), profiles!goals_created_by_fkey(full_name)')
        .order('created_at', { ascending: false })

      if (filters?.participantId) {
        query = query.eq('participant_id', filters.participantId)
      }
      if (filters?.status && filters.status !== 'all') {
        query = query.eq('status', filters.status)
      }
      if (filters?.domain && filters.domain !== 'all') {
        query = query.eq('domain', filters.domain)
      }
      if (filters?.timeframe && filters.timeframe !== 'all') {
        query = query.eq('timeframe', filters.timeframe)
      }

      const { data, error } = await query
      if (error) throw error

      return (data ?? []).map((row: Record<string, unknown>) => {
        const participants = row.participants as { first_name: string; last_name: string } | null
        const profiles = row.profiles as { full_name: string } | null
        return {
          ...row,
          participant_name: participants ? `${participants.first_name} ${participants.last_name}` : undefined,
          created_by_name: profiles?.full_name ?? undefined,
        } as GoalWithNames
      })
    },
  })
}

export function useGoal(id: string | undefined) {
  return useQuery({
    queryKey: ['goal', id],
    queryFn: async () => {
      if (!id) throw new Error('No goal ID')
      const { data, error } = await supabase
        .from('goals')
        .select('*, participants(first_name, last_name), profiles!goals_created_by_fkey(full_name)')
        .eq('id', id)
        .single()
      if (error) throw error

      const row = data as Record<string, unknown>
      const participants = row.participants as { first_name: string; last_name: string } | null
      const profiles = row.profiles as { full_name: string } | null
      return {
        ...row,
        participant_name: participants ? `${participants.first_name} ${participants.last_name}` : undefined,
        created_by_name: profiles?.full_name ?? undefined,
      } as GoalWithNames
    },
    enabled: !!id,
  })
}

export function useGoalProgress(goalId: string | undefined) {
  return useQuery({
    queryKey: ['goal-progress', goalId],
    queryFn: async () => {
      if (!goalId) throw new Error('No goal ID')
      const { data, error } = await supabase
        .from('goal_progress_entries')
        .select('*, profiles!goal_progress_entries_recorded_by_fkey(full_name)')
        .eq('goal_id', goalId)
        .order('progress_date', { ascending: true })
      if (error) throw error
      return (data ?? []) as Array<GoalProgressEntry & { profiles: { full_name: string } | null }>
    },
    enabled: !!goalId,
  })
}

export function useParticipantGoals(participantId: string | undefined) {
  return useGoals(participantId ? { participantId } : undefined)
}

export function useCreateGoal() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: Record<string, unknown>) => {
      const { data, error } = await supabase
        .from('goals')
        .insert(input as never)
        .select()
        .single()
      if (error) throw error
      return data as unknown as Goal
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goals'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] })
    },
  })
}

export function useUpdateGoal() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string } & Record<string, unknown>) => {
      const { data, error } = await supabase
        .from('goals')
        .update(updates as never)
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return data as unknown as Goal
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['goals'] })
      queryClient.invalidateQueries({ queryKey: ['goal', id] })
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] })
    },
  })
}

export function useAddGoalProgress() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: Record<string, unknown>) => {
      const { data, error } = await supabase
        .from('goal_progress_entries')
        .insert(input as never)
        .select()
        .single()
      if (error) throw error
      return data as unknown as GoalProgressEntry
    },
    onSuccess: (data) => {
      const goalId = (data as Record<string, unknown>).goal_id as string
      queryClient.invalidateQueries({ queryKey: ['goal-progress', goalId] })
      queryClient.invalidateQueries({ queryKey: ['goal', goalId] })
      queryClient.invalidateQueries({ queryKey: ['goals'] })
      toast.success('Progress recorded')
    },
  })
}

export function useGoalStats() {
  return useQuery({
    queryKey: ['goal-stats'],
    queryFn: async () => {
      const [total, achieved, inProgress, reviewDue] = await Promise.all([
        supabase.from('goals').select('id', { count: 'exact', head: true }),
        supabase.from('goals').select('id', { count: 'exact', head: true }).eq('status', 'achieved'),
        supabase.from('goals').select('id', { count: 'exact', head: true }).eq('status', 'in_progress'),
        supabase.from('goals').select('id', { count: 'exact', head: true })
          .lte('review_date', new Date().toISOString().split('T')[0])
          .in('status', ['not_started', 'in_progress']),
      ])
      return {
        total: total.count ?? 0,
        achieved: achieved.count ?? 0,
        inProgress: inProgress.count ?? 0,
        reviewDue: reviewDue.count ?? 0,
      }
    },
  })
}
