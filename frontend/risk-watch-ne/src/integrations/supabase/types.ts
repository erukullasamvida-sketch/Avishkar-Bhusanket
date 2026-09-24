export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      alerts: {
        Row: {
          created_at: string
          id: string
          location_id: string | null
          location_name: string
          message: string
          predicted_in: string
          risk_score: number
          severity: string
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          location_id?: string | null
          location_name: string
          message?: string
          predicted_in?: string
          risk_score?: number
          severity?: string
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          location_id?: string | null
          location_name?: string
          message?: string
          predicted_in?: string
          risk_score?: number
          severity?: string
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "alerts_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "risk_locations"
            referencedColumns: ["id"]
          },
        ]
      }
      data_sources: {
        Row: {
          category: string
          description: string
          id: string
          last_sync: string
          latency_ms: number
          name: string
          provider: string
          refresh_interval: string
          status: string
        }
        Insert: {
          category?: string
          description?: string
          id?: string
          last_sync?: string
          latency_ms?: number
          name: string
          provider?: string
          refresh_interval?: string
          status?: string
        }
        Update: {
          category?: string
          description?: string
          id?: string
          last_sync?: string
          latency_ms?: number
          name?: string
          provider?: string
          refresh_interval?: string
          status?: string
        }
        Relationships: []
      }
      field_reports: {
        Row: {
          created_at: string
          description: string
          gps_latitude: number | null
          gps_longitude: number | null
          id: string
          location_id: string | null
          location_name: string
          photo_url: string | null
          report_type: string
          reporter_name: string
          severity: string
          status: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          description?: string
          gps_latitude?: number | null
          gps_longitude?: number | null
          id?: string
          location_id?: string | null
          location_name: string
          photo_url?: string | null
          report_type: string
          reporter_name?: string
          severity?: string
          status?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          description?: string
          gps_latitude?: number | null
          gps_longitude?: number | null
          id?: string
          location_id?: string | null
          location_name?: string
          photo_url?: string | null
          report_type?: string
          reporter_name?: string
          severity?: string
          status?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "field_reports_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "risk_locations"
            referencedColumns: ["id"]
          },
        ]
      }
      predictions: {
        Row: {
          confidence: number
          created_at: string
          id: string
          location_id: string | null
          location_name: string
          model: string
          predicted_risk: string
          prediction_window: string
          probability: number
        }
        Insert: {
          confidence?: number
          created_at?: string
          id?: string
          location_id?: string | null
          location_name: string
          model?: string
          predicted_risk?: string
          prediction_window?: string
          probability?: number
        }
        Update: {
          confidence?: number
          created_at?: string
          id?: string
          location_id?: string | null
          location_name?: string
          model?: string
          predicted_risk?: string
          prediction_window?: string
          probability?: number
        }
        Relationships: [
          {
            foreignKeyName: "predictions_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "risk_locations"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          email: string | null
          full_name: string
          id: string
          organization: string | null
          role: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          full_name?: string
          id: string
          organization?: string | null
          role?: string
        }
        Update: {
          created_at?: string
          email?: string | null
          full_name?: string
          id?: string
          organization?: string | null
          role?: string
        }
        Relationships: []
      }
      risk_history: {
        Row: {
          id: string
          location_id: string
          rainfall: number
          recorded_on: string
          risk_score: number
        }
        Insert: {
          id?: string
          location_id: string
          rainfall?: number
          recorded_on: string
          risk_score: number
        }
        Update: {
          id?: string
          location_id?: string
          rainfall?: number
          recorded_on?: string
          risk_score?: number
        }
        Relationships: [
          {
            foreignKeyName: "risk_history_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "risk_locations"
            referencedColumns: ["id"]
          },
        ]
      }
      risk_locations: {
        Row: {
          district: string
          elevation: number
          id: string
          land_cover: string
          latitude: number
          longitude: number
          name: string
          nearby_villages: string
          population: number
          rainfall_24h: number
          risk_score: number
          slope_angle: number
          soil_moisture: number
          state: string
          updated_at: string
        }
        Insert: {
          district: string
          elevation?: number
          id?: string
          land_cover?: string
          latitude: number
          longitude: number
          name: string
          nearby_villages?: string
          population?: number
          rainfall_24h?: number
          risk_score?: number
          slope_angle?: number
          soil_moisture?: number
          state?: string
          updated_at?: string
        }
        Update: {
          district?: string
          elevation?: number
          id?: string
          land_cover?: string
          latitude?: number
          longitude?: number
          name?: string
          nearby_villages?: string
          population?: number
          rainfall_24h?: number
          risk_score?: number
          slope_angle?: number
          soil_moisture?: number
          state?: string
          updated_at?: string
        }
        Relationships: []
      }
      settings: {
        Row: {
          critical_alerts: boolean
          email_notifications: boolean
          language: string
          realtime_alerts: boolean
          sms_notifications: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          critical_alerts?: boolean
          email_notifications?: boolean
          language?: string
          realtime_alerts?: boolean
          sms_notifications?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          critical_alerts?: boolean
          email_notifications?: boolean
          language?: string
          realtime_alerts?: boolean
          sms_notifications?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
