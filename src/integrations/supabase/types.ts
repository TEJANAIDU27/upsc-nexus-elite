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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      dashboard_cache: {
        Row: {
          id: string
          news_data: Json
          updated_at: string
          user_id: string
        }
        Insert: {
          id?: string
          news_data?: Json
          updated_at?: string
          user_id: string
        }
        Update: {
          id?: string
          news_data?: Json
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      mock_test_history: {
        Row: {
          created_at: string
          id: string
          score: number
          test_metadata: Json | null
          total_questions: number
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          score?: number
          test_metadata?: Json | null
          total_questions?: number
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          score?: number
          test_metadata?: Json | null
          total_questions?: number
          user_id?: string
        }
        Relationships: []
      }
      morning_digest: {
        Row: {
          category_tag: string | null
          created_at: string | null
          detailed_brief: string | null
          gs_paper: string | null
          id: number
          image_url: string | null
          published_date: string | null
          short_snippet: string | null
          source_link: string | null
          title: string
        }
        Insert: {
          category_tag?: string | null
          created_at?: string | null
          detailed_brief?: string | null
          gs_paper?: string | null
          id?: never
          image_url?: string | null
          published_date?: string | null
          short_snippet?: string | null
          source_link?: string | null
          title: string
        }
        Update: {
          category_tag?: string | null
          created_at?: string | null
          detailed_brief?: string | null
          gs_paper?: string | null
          id?: never
          image_url?: string | null
          published_date?: string | null
          short_snippet?: string | null
          source_link?: string | null
          title?: string
        }
        Relationships: []
      }
      prelims_ultimate_mock: {
        Row: {
          correct_option: text | null
          explanation: text | null
          id: text
          options: Json | null
          question_text: text | null
          subject_category: text | null
          test_id: string | null
        }
        Insert: {
          correct_option?: text | null
          explanation?: text | null
          id?: string
          options?: Json | null
          question_text?: text | null
          subject_category?: text | null
          test_id?: string | null
        }
        Update: {
          correct_option?: text | null
          explanation?: text | null
          id?: string
          options?: Json | null
          question_text?: text | null
          subject_category?: text | null
          test_id?: string | null

        }
        Relationships: []
      }
      saved_news: {
        Row: {
          created_at: string
          date: string | null
          gs_tag: string | null
          headline: string
          id: string
          summary: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          date?: string | null
          gs_tag?: string | null
          headline: string
          id?: string
          summary?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          date?: string | null
          gs_tag?: string | null
          headline?: string
          id?: string
          summary?: string | null
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
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
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
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
