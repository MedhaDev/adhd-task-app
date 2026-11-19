// Generated from the Supabase schema (generate_typescript_types). Do not edit by hand;
// regenerate after each migration.
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: '14.18'
  }
  public: {
    Tables: {
      events: {
        Row: {
          details: Json
          id: number
          name: string
          occurred_at: string
          task_id: string | null
          user_id: string
        }
        Insert: {
          details?: Json
          id?: never
          name: string
          occurred_at?: string
          task_id?: string | null
          user_id?: string
        }
        Update: {
          details?: Json
          id?: never
          name?: string
          occurred_at?: string
          task_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'events_task_id_user_id_fkey'
            columns: ['task_id', 'user_id']
            isOneToOne: false
            referencedRelation: 'tasks'
            referencedColumns: ['id', 'user_id']
          },
        ]
      }
      parked_thoughts: {
        Row: {
          body: string
          created_at: string
          id: string
          resolution: Database['public']['Enums']['parked_resolution'] | null
          resolved_at: string | null
          session_id: string | null
          user_id: string
        }
        Insert: {
          body: string
          created_at?: string
          id?: string
          resolution?: Database['public']['Enums']['parked_resolution'] | null
          resolved_at?: string | null
          session_id?: string | null
          user_id?: string
        }
        Update: {
          body?: string
          created_at?: string
          id?: string
          resolution?: Database['public']['Enums']['parked_resolution'] | null
          resolved_at?: string | null
          session_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'parked_thoughts_session_id_user_id_fkey'
            columns: ['session_id', 'user_id']
            isOneToOne: false
            referencedRelation: 'timer_sessions'
            referencedColumns: ['id', 'user_id']
          },
        ]
      }
      steps: {
        Row: {
          body: string
          created_at: string
          done_at: string | null
          id: string
          position: number
          task_id: string
          user_id: string
        }
        Insert: {
          body: string
          created_at?: string
          done_at?: string | null
          id?: string
          position?: number
          task_id: string
          user_id?: string
        }
        Update: {
          body?: string
          created_at?: string
          done_at?: string | null
          id?: string
          position?: number
          task_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'steps_task_id_user_id_fkey'
            columns: ['task_id', 'user_id']
            isOneToOne: false
            referencedRelation: 'tasks'
            referencedColumns: ['id', 'user_id']
          },
        ]
      }
      tasks: {
        Row: {
          area: Database['public']['Enums']['task_area'] | null
          created_at: string
          finished_at: string | null
          id: string
          moved_to_today_at: string | null
          status: Database['public']['Enums']['task_status']
          title: string
          today_position: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          area?: Database['public']['Enums']['task_area'] | null
          created_at?: string
          finished_at?: string | null
          id?: string
          moved_to_today_at?: string | null
          status?: Database['public']['Enums']['task_status']
          title: string
          today_position?: number | null
          updated_at?: string
          user_id?: string
        }
        Update: {
          area?: Database['public']['Enums']['task_area'] | null
          created_at?: string
          finished_at?: string | null
          id?: string
          moved_to_today_at?: string | null
          status?: Database['public']['Enums']['task_status']
          title?: string
          today_position?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      timer_sessions: {
        Row: {
          ended_at: string | null
          id: string
          kind: Database['public']['Enums']['timer_kind']
          outcome: Database['public']['Enums']['timer_outcome'] | null
          planned_minutes: number
          started_at: string
          step_id: string | null
          task_id: string | null
          user_id: string
        }
        Insert: {
          ended_at?: string | null
          id?: string
          kind: Database['public']['Enums']['timer_kind']
          outcome?: Database['public']['Enums']['timer_outcome'] | null
          planned_minutes: number
          started_at?: string
          step_id?: string | null
          task_id?: string | null
          user_id?: string
        }
        Update: {
          ended_at?: string | null
          id?: string
          kind?: Database['public']['Enums']['timer_kind']
          outcome?: Database['public']['Enums']['timer_outcome'] | null
          planned_minutes?: number
          started_at?: string
          step_id?: string | null
          task_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'timer_sessions_step_id_user_id_fkey'
            columns: ['step_id', 'user_id']
            isOneToOne: false
            referencedRelation: 'steps'
            referencedColumns: ['id', 'user_id']
          },
          {
            foreignKeyName: 'timer_sessions_task_id_user_id_fkey'
            columns: ['task_id', 'user_id']
            isOneToOne: false
            referencedRelation: 'tasks'
            referencedColumns: ['id', 'user_id']
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      move_to_today: {
        Args: { p_first_step: string; p_task_id: string }
        Returns: undefined
      }
      reset_today: { Args: { p_since: string }; Returns: undefined }
      start_here: { Args: { p_task_id: string }; Returns: undefined }
    }
    Enums: {
      parked_resolution: 'kept' | 'deleted'
      task_area: 'work' | 'job_search' | 'personal' | 'fun'
      task_status: 'later' | 'today' | 'done'
      timer_kind: 'starter' | 'focus' | 'break'
      timer_outcome: 'kept_going' | 'stopped' | 'finished' | 'abandoned'
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type PublicSchema = Database['public']
export type TableRow<T extends keyof PublicSchema['Tables']> = PublicSchema['Tables'][T]['Row']
export type EnumOf<E extends keyof PublicSchema['Enums']> = PublicSchema['Enums'][E]

export const Constants = {
  public: {
    Enums: {
      parked_resolution: ['kept', 'deleted'],
      task_area: ['work', 'job_search', 'personal', 'fun'],
      task_status: ['later', 'today', 'done'],
      timer_kind: ['starter', 'focus', 'break'],
      timer_outcome: ['kept_going', 'stopped', 'finished', 'abandoned'],
    },
  },
} as const
