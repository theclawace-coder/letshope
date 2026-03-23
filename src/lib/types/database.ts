// Supabase database types
// In production, generate with: npx supabase gen types typescript --project-id <id>

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string
          role: 'director' | 'admin' | 'worker' | 'plan_manager' | 'participant_portal'
          avatar_url: string | null
          phone: string | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name: string
          role?: 'director' | 'admin' | 'worker' | 'plan_manager' | 'participant_portal'
          avatar_url?: string | null
          phone?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Database['public']['Tables']['profiles']['Insert']>
      }
      organisation: {
        Row: {
          id: string
          name: string
          abn: string | null
          ndis_registration_number: string | null
          phone: string | null
          email: string | null
          address: Json | null
          registration_groups: string[]
          registration_expiry: string | null
          logo_url: string | null
          settings: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name?: string
          abn?: string | null
          ndis_registration_number?: string | null
          phone?: string | null
          email?: string | null
          address?: Json | null
          registration_groups?: string[]
          registration_expiry?: string | null
          logo_url?: string | null
          settings?: Json
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Database['public']['Tables']['organisation']['Insert']>
      }
      participants: {
        Row: {
          id: string
          first_name: string
          last_name: string
          preferred_name: string | null
          date_of_birth: string | null
          gender: string | null
          ndis_number: string | null
          status: 'referral' | 'intake' | 'onboarding' | 'active' | 'on_hold' | 'exiting' | 'exited'
          phone: string | null
          email: string | null
          address: Json | null
          funding_type: 'ndia_managed' | 'plan_managed' | 'self_managed' | 'combination' | null
          plan_start_date: string | null
          plan_end_date: string | null
          plan_number: string | null
          support_coordinator_name: string | null
          support_coordinator_phone: string | null
          support_coordinator_email: string | null
          lac_name: string | null
          lac_contact: string | null
          services_requested: string[]
          gp_name: string | null
          gp_phone: string | null
          gp_address: string | null
          medical_conditions: string[]
          allergies: string[]
          medications: Json
          emergency_contacts: Json
          has_guardian: boolean
          guardian_name: string | null
          guardian_relationship: string | null
          guardian_phone: string | null
          guardian_email: string | null
          guardian_authority: string | null
          communication_needs: string | null
          cultural_needs: string | null
          mobility_needs: string | null
          living_situation: string | null
          goals: Json
          referral_source: string | null
          referral_date: string | null
          referral_notes: string | null
          urgency: 'routine' | 'urgent' | 'crisis' | null
          risk_level: 'low' | 'medium' | 'high' | null
          risk_assessment_date: string | null
          risk_review_date: string | null
          budget_core: number | null
          budget_capacity_building: number | null
          budget_capital: number | null
          notes: string | null
          avatar_url: string | null
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          first_name: string
          last_name: string
          preferred_name?: string | null
          date_of_birth?: string | null
          gender?: string | null
          ndis_number?: string | null
          status?: 'referral' | 'intake' | 'onboarding' | 'active' | 'on_hold' | 'exiting' | 'exited'
          phone?: string | null
          email?: string | null
          address?: Json | null
          funding_type?: 'ndia_managed' | 'plan_managed' | 'self_managed' | 'combination' | null
          plan_start_date?: string | null
          plan_end_date?: string | null
          plan_number?: string | null
          support_coordinator_name?: string | null
          support_coordinator_phone?: string | null
          support_coordinator_email?: string | null
          lac_name?: string | null
          lac_contact?: string | null
          services_requested?: string[]
          gp_name?: string | null
          gp_phone?: string | null
          gp_address?: string | null
          medical_conditions?: string[]
          allergies?: string[]
          medications?: Json
          emergency_contacts?: Json
          has_guardian?: boolean
          guardian_name?: string | null
          guardian_relationship?: string | null
          guardian_phone?: string | null
          guardian_email?: string | null
          guardian_authority?: string | null
          communication_needs?: string | null
          cultural_needs?: string | null
          mobility_needs?: string | null
          living_situation?: string | null
          goals?: Json
          referral_source?: string | null
          referral_date?: string | null
          referral_notes?: string | null
          urgency?: 'routine' | 'urgent' | 'crisis' | null
          risk_level?: 'low' | 'medium' | 'high' | null
          risk_assessment_date?: string | null
          risk_review_date?: string | null
          budget_core?: number | null
          budget_capacity_building?: number | null
          budget_capital?: number | null
          notes?: string | null
          avatar_url?: string | null
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Database['public']['Tables']['participants']['Insert']>
      }
      workers: {
        Row: {
          id: string
          profile_id: string | null
          first_name: string
          last_name: string
          email: string | null
          phone: string | null
          date_of_birth: string | null
          address: Json | null
          status: 'onboarding' | 'active' | 'inactive' | 'terminated'
          employment_type: 'contractor' | 'employee' | 'volunteer'
          role_title: string | null
          qualified_registration_groups: string[]
          ndis_screening_status: string | null
          ndis_screening_number: string | null
          ndis_screening_date: string | null
          police_check_status: string | null
          police_check_date: string | null
          police_check_expiry: string | null
          wwcc_status: string | null
          wwcc_number: string | null
          wwcc_expiry: string | null
          orientation_completed: boolean
          orientation_date: string | null
          code_of_conduct_signed: boolean
          code_of_conduct_date: string | null
          induction_completed: boolean
          induction_data: Json
          ahpra_number: string | null
          ahpra_expiry: string | null
          ahpra_status: string | null
          other_qualifications: Json
          references_verified: boolean
          availability: Json
          contract_signed: boolean
          contract_date: string | null
          position_description_acknowledged: boolean
          identity_points_verified: boolean
          notes: string | null
          avatar_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          profile_id?: string | null
          first_name: string
          last_name: string
          email?: string | null
          phone?: string | null
          date_of_birth?: string | null
          address?: Json | null
          status?: 'onboarding' | 'active' | 'inactive' | 'terminated'
          employment_type?: 'contractor' | 'employee' | 'volunteer'
          role_title?: string | null
          qualified_registration_groups?: string[]
          ndis_screening_status?: string | null
          ndis_screening_number?: string | null
          ndis_screening_date?: string | null
          police_check_status?: string | null
          police_check_date?: string | null
          police_check_expiry?: string | null
          wwcc_status?: string | null
          wwcc_number?: string | null
          wwcc_expiry?: string | null
          orientation_completed?: boolean
          orientation_date?: string | null
          code_of_conduct_signed?: boolean
          code_of_conduct_date?: string | null
          induction_completed?: boolean
          induction_data?: Json
          ahpra_number?: string | null
          ahpra_expiry?: string | null
          ahpra_status?: string | null
          other_qualifications?: Json
          references_verified?: boolean
          availability?: Json
          contract_signed?: boolean
          contract_date?: string | null
          position_description_acknowledged?: boolean
          identity_points_verified?: boolean
          notes?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Database['public']['Tables']['workers']['Insert']>
      }
      worker_participant_assignments: {
        Row: {
          id: string
          worker_id: string
          participant_id: string
          registration_group: string
          assigned_date: string
          end_date: string | null
          is_active: boolean
          assigned_by: string | null
          created_at: string
        }
        Insert: {
          id?: string
          worker_id: string
          participant_id: string
          registration_group: string
          assigned_date?: string
          end_date?: string | null
          is_active?: boolean
          assigned_by?: string | null
          created_at?: string
        }
        Update: Partial<Database['public']['Tables']['worker_participant_assignments']['Insert']>
      }
      workflows: {
        Row: {
          id: string
          type: 'participant_onboarding' | 'worker_onboarding' | 'incident_response' | 'complaint_resolution' | 'plan_review' | 'invoice_processing'
          reference_id: string | null
          current_stage: number
          total_stages: number
          stage_data: Json
          completed_stages: number[]
          status: 'in_progress' | 'completed' | 'abandoned'
          started_by: string | null
          started_at: string
          completed_at: string | null
          updated_at: string
        }
        Insert: {
          id?: string
          type: 'participant_onboarding' | 'worker_onboarding' | 'incident_response' | 'complaint_resolution' | 'plan_review' | 'invoice_processing'
          reference_id?: string | null
          current_stage?: number
          total_stages: number
          stage_data?: Json
          completed_stages?: number[]
          status?: 'in_progress' | 'completed' | 'abandoned'
          started_by?: string | null
          started_at?: string
          completed_at?: string | null
          updated_at?: string
        }
        Update: Partial<Database['public']['Tables']['workflows']['Insert']>
      }
      ndis_plans: {
        Row: {
          id: string
          participant_id: string
          plan_number: string | null
          funding_type: 'ndia_managed' | 'plan_managed' | 'self_managed' | 'combination' | null
          start_date: string
          end_date: string
          status: 'draft' | 'active' | 'expired' | 'superseded'
          budget_core: number
          budget_capacity_building: number
          budget_capital: number
          support_coordinator_name: string | null
          support_coordinator_phone: string | null
          support_coordinator_email: string | null
          lac_name: string | null
          lac_contact: string | null
          notes: string | null
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          participant_id: string
          plan_number?: string | null
          funding_type?: 'ndia_managed' | 'plan_managed' | 'self_managed' | 'combination' | null
          start_date: string
          end_date: string
          status?: 'draft' | 'active' | 'expired' | 'superseded'
          budget_core?: number
          budget_capacity_building?: number
          budget_capital?: number
          support_coordinator_name?: string | null
          support_coordinator_phone?: string | null
          support_coordinator_email?: string | null
          lac_name?: string | null
          lac_contact?: string | null
          notes?: string | null
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Database['public']['Tables']['ndis_plans']['Insert']>
      }
      service_agreements: {
        Row: {
          id: string
          participant_id: string
          plan_id: string | null
          version: number
          status: 'draft' | 'sent' | 'signed' | 'expired' | 'terminated'
          services: Json
          start_date: string | null
          end_date: string | null
          participant_signed: boolean
          participant_signed_date: string | null
          participant_signature_data: string | null
          provider_signed: boolean
          provider_signed_date: string | null
          file_path: string | null
          shared_link: string | null
          shared_link_expiry: string | null
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          participant_id: string
          plan_id?: string | null
          version?: number
          status?: 'draft' | 'sent' | 'signed' | 'expired' | 'terminated'
          services?: Json
          start_date?: string | null
          end_date?: string | null
          participant_signed?: boolean
          participant_signed_date?: string | null
          participant_signature_data?: string | null
          provider_signed?: boolean
          provider_signed_date?: string | null
          file_path?: string | null
          shared_link?: string | null
          shared_link_expiry?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Database['public']['Tables']['service_agreements']['Insert']>
      }
      communications: {
        Row: {
          id: string
          participant_id: string | null
          worker_id: string | null
          type: string
          direction: 'inbound' | 'outbound' | null
          with_name: string | null
          with_role: string | null
          subject: string | null
          summary: string
          action_required: string | null
          follow_up_date: string | null
          logged_by: string | null
          created_at: string
        }
        Insert: {
          id?: string
          participant_id?: string | null
          worker_id?: string | null
          type: string
          direction?: 'inbound' | 'outbound' | null
          with_name?: string | null
          with_role?: string | null
          subject?: string | null
          summary: string
          action_required?: string | null
          follow_up_date?: string | null
          logged_by?: string | null
          created_at?: string
        }
        Update: Partial<Database['public']['Tables']['communications']['Insert']>
      }
      documents: {
        Row: {
          id: string
          name: string
          category: string
          participant_id: string | null
          worker_id: string | null
          file_path: string
          file_size: number | null
          mime_type: string | null
          uploaded_by: string | null
          shared_link: string | null
          shared_link_expiry: string | null
          metadata: Json
          created_at: string
          status: 'draft' | 'pending_review' | 'approved' | 'archived' | 'expired'
          updated_at: string
          folder_id: string | null
          version: number
          latest_version_id: string | null
          original_document_id: string | null
          retention_date: string | null
          tags: string[]
          description: string | null
          reviewed_by: string | null
          reviewed_at: string | null
        }
        Insert: {
          id?: string
          name: string
          category: string
          participant_id?: string | null
          worker_id?: string | null
          file_path: string
          file_size?: number | null
          mime_type?: string | null
          uploaded_by?: string | null
          shared_link?: string | null
          shared_link_expiry?: string | null
          metadata?: Json
          created_at?: string
          status?: 'draft' | 'pending_review' | 'approved' | 'archived' | 'expired'
          updated_at?: string
          folder_id?: string | null
          version?: number
          latest_version_id?: string | null
          original_document_id?: string | null
          retention_date?: string | null
          tags?: string[]
          description?: string | null
          reviewed_by?: string | null
          reviewed_at?: string | null
        }
        Update: Partial<Database['public']['Tables']['documents']['Insert']>
      }
      bookings: {
        Row: {
          id: string
          participant_id: string
          worker_id: string | null
          registration_group: string | null
          service_description: string | null
          booking_date: string
          start_time: string
          end_time: string
          recurrence: 'one_off' | 'weekly' | 'fortnightly' | null
          status: 'scheduled' | 'checked_in' | 'checked_out' | 'completed' | 'cancelled' | 'no_show'
          notes: string | null
          actual_start_time: string | null
          actual_end_time: string | null
          check_in_location: Json | null
          check_out_location: Json | null
          support_item_number: string | null
          unit_price: number | null
          estimated_cost: number | null
          cancellation_reason: string | null
          cancellation_type: 'standard' | 'short_notice' | 'no_show' | null
          cancelled_by: 'participant' | 'provider' | 'worker' | 'system' | null
          cancelled_at: string | null
          cancellation_charge: number | null
          cancellation_charge_rate: number | null
          time_slot_filled: boolean
          recurrence_parent_id: string | null
          recurrence_end_date: string | null
          is_group_booking: boolean
          group_ratio: string | null
          group_size: number | null
          travel_time_minutes: number | null
          travel_distance_km: number | null
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          participant_id: string
          worker_id?: string | null
          registration_group?: string | null
          service_description?: string | null
          booking_date: string
          start_time: string
          end_time: string
          recurrence?: 'one_off' | 'weekly' | 'fortnightly' | null
          status?: 'scheduled' | 'checked_in' | 'checked_out' | 'completed' | 'cancelled' | 'no_show'
          notes?: string | null
          actual_start_time?: string | null
          actual_end_time?: string | null
          check_in_location?: Json | null
          check_out_location?: Json | null
          support_item_number?: string | null
          unit_price?: number | null
          estimated_cost?: number | null
          cancellation_reason?: string | null
          cancellation_type?: 'standard' | 'short_notice' | 'no_show' | null
          cancelled_by?: 'participant' | 'provider' | 'worker' | 'system' | null
          cancelled_at?: string | null
          cancellation_charge?: number | null
          cancellation_charge_rate?: number | null
          time_slot_filled?: boolean
          recurrence_parent_id?: string | null
          recurrence_end_date?: string | null
          is_group_booking?: boolean
          group_ratio?: string | null
          group_size?: number | null
          travel_time_minutes?: number | null
          travel_distance_km?: number | null
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Database['public']['Tables']['bookings']['Insert']>
      }
      booking_participants: {
        Row: {
          id: string
          booking_id: string
          participant_id: string
          estimated_cost: number | null
          notes: string | null
          created_at: string
        }
        Insert: {
          id?: string
          booking_id: string
          participant_id: string
          estimated_cost?: number | null
          notes?: string | null
          created_at?: string
        }
        Update: Partial<Database['public']['Tables']['booking_participants']['Insert']>
      }
      progress_notes: {
        Row: {
          id: string
          participant_id: string
          worker_id: string
          booking_id: string | null
          note_date: string
          service_type: string | null
          goals_addressed: string[]
          presentation: string | null
          actions_taken: string | null
          content: string
          audio_url: string | null
          is_transcribed: boolean
          concern_flagged: boolean
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          participant_id: string
          worker_id: string
          booking_id?: string | null
          note_date?: string
          service_type?: string | null
          goals_addressed?: string[]
          presentation?: string | null
          actions_taken?: string | null
          content: string
          audio_url?: string | null
          is_transcribed?: boolean
          concern_flagged?: boolean
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Database['public']['Tables']['progress_notes']['Insert']>
      }
      concerns: {
        Row: {
          id: string
          participant_id: string
          progress_note_id: string | null
          raised_by: string
          concern_type: 'safety' | 'health' | 'behavioral' | 'environmental' | 'financial' | 'other'
          severity: 'low' | 'medium' | 'high' | 'critical'
          title: string
          description: string
          actions_requested: string | null
          status: 'open' | 'reviewing' | 'resolved' | 'dismissed'
          resolved_by: string | null
          resolved_at: string | null
          resolution_notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          participant_id: string
          progress_note_id?: string | null
          raised_by: string
          concern_type: 'safety' | 'health' | 'behavioral' | 'environmental' | 'financial' | 'other'
          severity: 'low' | 'medium' | 'high' | 'critical'
          title: string
          description: string
          actions_requested?: string | null
          status?: 'open' | 'reviewing' | 'resolved' | 'dismissed'
          resolved_by?: string | null
          resolved_at?: string | null
          resolution_notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Database['public']['Tables']['concerns']['Insert']>
      }
      ndis_price_guide: {
        Row: {
          id: string
          support_item_number: string
          support_item_name: string
          registration_group: string
          unit: 'hour' | 'each' | 'day' | 'week' | 'km'
          price_national: number
          price_remote: number | null
          price_very_remote: number | null
          category: 'core' | 'capacity_building' | 'capital'
          effective_from: string
          effective_to: string | null
          is_active: boolean
          created_at: string
        }
        Insert: {
          id?: string
          support_item_number: string
          support_item_name: string
          registration_group: string
          unit: 'hour' | 'each' | 'day' | 'week' | 'km'
          price_national: number
          price_remote?: number | null
          price_very_remote?: number | null
          category: 'core' | 'capacity_building' | 'capital'
          effective_from: string
          effective_to?: string | null
          is_active?: boolean
          created_at?: string
        }
        Update: Partial<Database['public']['Tables']['ndis_price_guide']['Insert']>
      }
      invoices: {
        Row: {
          id: string
          participant_id: string
          invoice_number: string
          invoice_date: string
          due_date: string | null
          period_start: string
          period_end: string
          status: 'draft' | 'approved' | 'submitted' | 'paid' | 'rejected' | 'cancelled' | 'void'
          funding_type: 'ndia_managed' | 'plan_managed' | 'self_managed' | null
          claim_reference: string | null
          subtotal: number
          gst: number
          total: number
          notes: string | null
          rejection_reason: string | null
          submitted_at: string | null
          paid_at: string | null
          locked_at: string | null
          locked_by: string | null
          credit_note_total: number
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          participant_id: string
          invoice_number: string
          invoice_date?: string
          due_date?: string | null
          period_start: string
          period_end: string
          status?: 'draft' | 'approved' | 'submitted' | 'paid' | 'rejected' | 'cancelled' | 'void'
          funding_type?: 'ndia_managed' | 'plan_managed' | 'self_managed' | null
          claim_reference?: string | null
          subtotal?: number
          gst?: number
          total?: number
          notes?: string | null
          rejection_reason?: string | null
          submitted_at?: string | null
          paid_at?: string | null
          locked_at?: string | null
          locked_by?: string | null
          credit_note_total?: number
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Database['public']['Tables']['invoices']['Insert']>
      }
      invoice_line_items: {
        Row: {
          id: string
          invoice_id: string
          booking_id: string | null
          worker_id: string | null
          support_item_number: string | null
          support_item_name: string
          registration_group: string | null
          date_of_service: string
          start_time: string | null
          end_time: string | null
          quantity: number
          unit: 'hour' | 'each' | 'day' | 'week' | 'km'
          unit_price: number
          ndis_max_price: number | null
          gst_applicable: boolean
          total: number
          claim_type: 'standard' | 'non_face_to_face' | 'provider_travel' | 'cancellation_short_notice' | 'cancellation_no_show' | 'report_writing' | 'irregular_sil_supports'
          notes: string | null
          created_at: string
        }
        Insert: {
          id?: string
          invoice_id: string
          booking_id?: string | null
          worker_id?: string | null
          support_item_number?: string | null
          support_item_name: string
          registration_group?: string | null
          date_of_service: string
          start_time?: string | null
          end_time?: string | null
          quantity?: number
          unit?: 'hour' | 'each' | 'day' | 'week' | 'km'
          unit_price: number
          ndis_max_price?: number | null
          gst_applicable?: boolean
          total: number
          claim_type?: 'standard' | 'non_face_to_face' | 'provider_travel' | 'cancellation_short_notice' | 'cancellation_no_show' | 'report_writing' | 'irregular_sil_supports'
          notes?: string | null
          created_at?: string
        }
        Update: Partial<Database['public']['Tables']['invoice_line_items']['Insert']>
      }
      credit_notes: {
        Row: {
          id: string
          credit_note_number: string
          invoice_id: string
          participant_id: string
          reason: string
          status: 'draft' | 'approved' | 'applied' | 'void'
          subtotal: number
          gst: number
          total: number
          notes: string | null
          approved_at: string | null
          approved_by: string | null
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          credit_note_number: string
          invoice_id: string
          participant_id: string
          reason: string
          status?: 'draft' | 'approved' | 'applied' | 'void'
          subtotal?: number
          gst?: number
          total?: number
          notes?: string | null
          approved_at?: string | null
          approved_by?: string | null
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Database['public']['Tables']['credit_notes']['Insert']>
      }
      credit_note_line_items: {
        Row: {
          id: string
          credit_note_id: string
          original_line_item_id: string | null
          support_item_number: string | null
          support_item_name: string
          date_of_service: string
          quantity: number
          unit: 'hour' | 'each' | 'day' | 'week' | 'km'
          unit_price: number
          gst_applicable: boolean
          total: number
          notes: string | null
          created_at: string
        }
        Insert: {
          id?: string
          credit_note_id: string
          original_line_item_id?: string | null
          support_item_number?: string | null
          support_item_name: string
          date_of_service: string
          quantity?: number
          unit?: 'hour' | 'each' | 'day' | 'week' | 'km'
          unit_price: number
          gst_applicable?: boolean
          total: number
          notes?: string | null
          created_at?: string
        }
        Update: Partial<Database['public']['Tables']['credit_note_line_items']['Insert']>
      }
      incidents: {
        Row: {
          id: string
          participant_id: string | null
          worker_id: string | null
          incident_date: string
          incident_time: string | null
          location: string | null
          description: string
          incident_type: string | null
          severity: 'minor' | 'moderate' | 'major' | 'critical' | null
          is_reportable: boolean
          reported_to_commission: boolean
          report_deadline: string | null
          investigation_notes: string | null
          corrective_actions: Json
          status: 'open' | 'investigating' | 'resolved' | 'closed'
          logged_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          participant_id?: string | null
          worker_id?: string | null
          incident_date: string
          incident_time?: string | null
          location?: string | null
          description: string
          incident_type?: string | null
          severity?: 'minor' | 'moderate' | 'major' | 'critical' | null
          is_reportable?: boolean
          reported_to_commission?: boolean
          report_deadline?: string | null
          investigation_notes?: string | null
          corrective_actions?: Json
          status?: 'open' | 'investigating' | 'resolved' | 'closed'
          logged_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Database['public']['Tables']['incidents']['Insert']>
      }
      complaints: {
        Row: {
          id: string
          participant_id: string | null
          complainant_name: string | null
          complainant_relationship: string | null
          complaint_date: string
          description: string
          category: string | null
          acknowledge_deadline: string | null
          resolution_deadline: string | null
          acknowledged: boolean
          acknowledged_date: string | null
          resolution: string | null
          resolution_date: string | null
          status: 'received' | 'acknowledged' | 'investigating' | 'resolved' | 'closed'
          logged_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          participant_id?: string | null
          complainant_name?: string | null
          complainant_relationship?: string | null
          complaint_date: string
          description: string
          category?: string | null
          acknowledge_deadline?: string | null
          resolution_deadline?: string | null
          acknowledged?: boolean
          acknowledged_date?: string | null
          resolution?: string | null
          resolution_date?: string | null
          status?: 'received' | 'acknowledged' | 'investigating' | 'resolved' | 'closed'
          logged_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Database['public']['Tables']['complaints']['Insert']>
      }
      policy_documents: {
        Row: {
          id: string
          title: string
          source: string
          category: 'practice_standards' | 'code_of_conduct' | 'pricing' | 'quality_indicators' | 'worker_screening' | 'complaints_management' | 'incident_management' | 'restrictive_practices' | 'plan_management' | 'sil' | 'community_participation' | 'internal_policy' | 'other'
          chunk_index: number
          content: string
          metadata: Json
          is_active: boolean
          uploaded_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          source: string
          category: 'practice_standards' | 'code_of_conduct' | 'pricing' | 'quality_indicators' | 'worker_screening' | 'complaints_management' | 'incident_management' | 'restrictive_practices' | 'plan_management' | 'sil' | 'community_participation' | 'internal_policy' | 'other'
          chunk_index?: number
          content: string
          metadata?: Json
          is_active?: boolean
          uploaded_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Database['public']['Tables']['policy_documents']['Insert']>
      }
      policy_embeddings: {
        Row: {
          id: string
          document_id: string
          embedding: unknown
          created_at: string
        }
        Insert: {
          id?: string
          document_id: string
          embedding: unknown
          created_at?: string
        }
        Update: Partial<Database['public']['Tables']['policy_embeddings']['Insert']>
      }
      ai_conversations: {
        Row: {
          id: string
          user_id: string
          title: string
          is_pinned: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title?: string
          is_pinned?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Database['public']['Tables']['ai_conversations']['Insert']>
      }
      ai_messages: {
        Row: {
          id: string
          conversation_id: string
          role: 'user' | 'assistant'
          content: string
          sources: Json
          tokens_used: number | null
          created_at: string
        }
        Insert: {
          id?: string
          conversation_id: string
          role: 'user' | 'assistant'
          content: string
          sources?: Json
          tokens_used?: number | null
          created_at?: string
        }
        Update: Partial<Database['public']['Tables']['ai_messages']['Insert']>
      }
      audit_logs: {
        Row: {
          id: string
          user_id: string | null
          action: 'insert' | 'update' | 'delete'
          entity_type: string
          entity_id: string
          changes: Json
          metadata: Json
          created_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          action: 'insert' | 'update' | 'delete'
          entity_type: string
          entity_id: string
          changes?: Json
          metadata?: Json
          created_at?: string
        }
        Update: Partial<Database['public']['Tables']['audit_logs']['Insert']>
      }
      goals: {
        Row: {
          id: string
          participant_id: string
          title: string
          description: string | null
          domain: 'daily_living' | 'community_participation' | 'employment' | 'health_wellbeing' | 'relationships' | 'lifelong_learning' | 'choice_control' | 'home'
          timeframe: 'short_term' | 'medium_term' | 'long_term'
          status: 'not_started' | 'in_progress' | 'achieved' | 'on_hold' | 'discontinued'
          priority: 'high' | 'medium' | 'low'
          start_date: string | null
          target_date: string | null
          review_date: string | null
          baseline_measure: string | null
          target_measure: string | null
          current_progress: number
          linked_registration_groups: string[]
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          participant_id: string
          title: string
          description?: string | null
          domain: 'daily_living' | 'community_participation' | 'employment' | 'health_wellbeing' | 'relationships' | 'lifelong_learning' | 'choice_control' | 'home'
          timeframe?: 'short_term' | 'medium_term' | 'long_term'
          status?: 'not_started' | 'in_progress' | 'achieved' | 'on_hold' | 'discontinued'
          priority?: 'high' | 'medium' | 'low'
          start_date?: string | null
          target_date?: string | null
          review_date?: string | null
          baseline_measure?: string | null
          target_measure?: string | null
          current_progress?: number
          linked_registration_groups?: string[]
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Database['public']['Tables']['goals']['Insert']>
      }
      goal_progress_entries: {
        Row: {
          id: string
          goal_id: string
          progress_date: string
          progress_percentage: number
          notes: string | null
          evidence: string | null
          recorded_by: string | null
          created_at: string
        }
        Insert: {
          id?: string
          goal_id: string
          progress_date?: string
          progress_percentage: number
          notes?: string | null
          evidence?: string | null
          recorded_by?: string | null
          created_at?: string
        }
        Update: Partial<Database['public']['Tables']['goal_progress_entries']['Insert']>
      }
      email_digest_preferences: {
        Row: {
          id: string
          user_id: string
          digest_enabled: boolean
          frequency: 'daily' | 'weekly' | 'off'
          include_incidents: boolean
          include_complaints: boolean
          include_compliance: boolean
          include_invoices: boolean
          include_overdue: boolean
          preferred_time: string
          preferred_day: number
          last_sent_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          digest_enabled?: boolean
          frequency?: 'daily' | 'weekly' | 'off'
          include_incidents?: boolean
          include_complaints?: boolean
          include_compliance?: boolean
          include_invoices?: boolean
          include_overdue?: boolean
          preferred_time?: string
          preferred_day?: number
          last_sent_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Database['public']['Tables']['email_digest_preferences']['Insert']>
      }
      portal_access_tokens: {
        Row: {
          id: string
          participant_id: string
          email: string
          token: string
          role: 'participant' | 'guardian' | 'support_coordinator'
          name: string
          relationship: string | null
          is_active: boolean
          last_accessed_at: string | null
          expires_at: string | null
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          participant_id: string
          email: string
          token?: string
          role?: 'participant' | 'guardian' | 'support_coordinator'
          name: string
          relationship?: string | null
          is_active?: boolean
          last_accessed_at?: string | null
          expires_at?: string | null
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Database['public']['Tables']['portal_access_tokens']['Insert']>
      }
      portal_activity_log: {
        Row: {
          id: string
          portal_token_id: string
          participant_id: string
          action: string
          metadata: Json
          created_at: string
        }
        Insert: {
          id?: string
          portal_token_id: string
          participant_id: string
          action: string
          metadata?: Json
          created_at?: string
        }
        Update: Partial<Database['public']['Tables']['portal_activity_log']['Insert']>
      }
      notifications: {
        Row: {
          id: string
          user_id: string
          category: 'incident' | 'complaint' | 'concern' | 'booking' | 'invoice' | 'compliance' | 'goal' | 'portal' | 'message' | 'system'
          priority: 'low' | 'normal' | 'high' | 'urgent'
          title: string
          body: string | null
          entity_type: string | null
          entity_id: string | null
          action_url: string | null
          is_read: boolean
          read_at: string | null
          is_archived: boolean
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          category: 'incident' | 'complaint' | 'concern' | 'booking' | 'invoice' | 'compliance' | 'goal' | 'portal' | 'message' | 'system'
          priority?: 'low' | 'normal' | 'high' | 'urgent'
          title: string
          body?: string | null
          entity_type?: string | null
          entity_id?: string | null
          action_url?: string | null
          is_read?: boolean
          read_at?: string | null
          is_archived?: boolean
          created_at?: string
        }
        Update: Partial<Database['public']['Tables']['notifications']['Insert']>
      }
      notification_preferences: {
        Row: {
          id: string
          user_id: string
          category: 'incident' | 'complaint' | 'concern' | 'booking' | 'invoice' | 'compliance' | 'goal' | 'portal' | 'message' | 'system'
          in_app_enabled: boolean
          email_enabled: boolean
          push_enabled: boolean
          min_priority: 'low' | 'normal' | 'high' | 'urgent'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          category: 'incident' | 'complaint' | 'concern' | 'booking' | 'invoice' | 'compliance' | 'goal' | 'portal' | 'message' | 'system'
          in_app_enabled?: boolean
          email_enabled?: boolean
          push_enabled?: boolean
          min_priority?: 'low' | 'normal' | 'high' | 'urgent'
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Database['public']['Tables']['notification_preferences']['Insert']>
      }
      message_threads: {
        Row: {
          id: string
          subject: string
          entity_type: string | null
          entity_id: string | null
          created_by: string
          is_archived: boolean
          last_message_at: string
          created_at: string
        }
        Insert: {
          id?: string
          subject: string
          entity_type?: string | null
          entity_id?: string | null
          created_by: string
          is_archived?: boolean
          last_message_at?: string
          created_at?: string
        }
        Update: Partial<Database['public']['Tables']['message_threads']['Insert']>
      }
      message_thread_participants: {
        Row: {
          id: string
          thread_id: string
          user_id: string
          last_read_at: string | null
          is_muted: boolean
          joined_at: string
        }
        Insert: {
          id?: string
          thread_id: string
          user_id: string
          last_read_at?: string | null
          is_muted?: boolean
          joined_at?: string
        }
        Update: Partial<Database['public']['Tables']['message_thread_participants']['Insert']>
      }
      messages: {
        Row: {
          id: string
          thread_id: string
          sender_id: string
          content: string
          attachment_url: string | null
          attachment_name: string | null
          is_edited: boolean
          edited_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          thread_id: string
          sender_id: string
          content: string
          attachment_url?: string | null
          attachment_name?: string | null
          is_edited?: boolean
          edited_at?: string | null
          created_at?: string
        }
        Update: Partial<Database['public']['Tables']['messages']['Insert']>
      }
      document_folders: {
        Row: {
          id: string
          name: string
          description: string | null
          parent_id: string | null
          color: string
          icon: string
          participant_id: string | null
          worker_id: string | null
          is_system: boolean
          sort_order: number
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          parent_id?: string | null
          color?: string
          icon?: string
          participant_id?: string | null
          worker_id?: string | null
          is_system?: boolean
          sort_order?: number
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Database['public']['Tables']['document_folders']['Insert']>
      }
      document_versions: {
        Row: {
          id: string
          document_id: string
          version_number: number
          file_path: string
          file_size: number | null
          mime_type: string | null
          change_summary: string | null
          uploaded_by: string | null
          created_at: string
        }
        Insert: {
          id?: string
          document_id: string
          version_number: number
          file_path: string
          file_size?: number | null
          mime_type?: string | null
          change_summary?: string | null
          uploaded_by?: string | null
          created_at?: string
        }
        Update: Partial<Database['public']['Tables']['document_versions']['Insert']>
      }
      document_access_log: {
        Row: {
          id: string
          document_id: string
          action: 'viewed' | 'downloaded' | 'printed' | 'shared' | 'emailed' | 'version_created' | 'status_changed' | 'moved' | 'archived' | 'restored'
          performed_by: string | null
          ip_address: string | null
          user_agent: string | null
          metadata: Json
          created_at: string
        }
        Insert: {
          id?: string
          document_id: string
          action: 'viewed' | 'downloaded' | 'printed' | 'shared' | 'emailed' | 'version_created' | 'status_changed' | 'moved' | 'archived' | 'restored'
          performed_by?: string | null
          ip_address?: string | null
          user_agent?: string | null
          metadata?: Json
          created_at?: string
        }
        Update: Partial<Database['public']['Tables']['document_access_log']['Insert']>
      }
      document_retention_policies: {
        Row: {
          id: string
          name: string
          description: string | null
          category: string
          retention_years: number
          action_on_expiry: 'flag_for_review' | 'archive' | 'delete'
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          category: string
          retention_years?: number
          action_on_expiry?: 'flag_for_review' | 'archive' | 'delete'
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Database['public']['Tables']['document_retention_policies']['Insert']>
      }
    }
    Views: Record<string, never>
    Functions: {
      generate_invoice_number: {
        Args: Record<string, never>
        Returns: string
      }
      validate_portal_token: {
        Args: {
          p_token: string
        }
        Returns: Array<{
          token_id: string
          participant_id: string
          email: string
          role: string
          name: string
          relationship: string | null
          participant_first_name: string
          participant_last_name: string
          participant_preferred_name: string | null
        }>
      }
      match_policy_documents: {
        Args: {
          query_embedding: unknown
          match_threshold?: number
          match_count?: number
        }
        Returns: Array<{
          id: string
          document_id: string
          title: string
          source: string
          category: string
          content: string
          metadata: Json
          similarity: number
        }>
      }
    }
    Enums: Record<string, never>
  }
}

// Helper types
export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row']
export type InsertTables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Insert']
export type UpdateTables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Update']
