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
      access_codes: {
        Row: {
          code_hash: string
          created_at: string
          expires_at: string | null
          gatekeeper_id: string
          id: string
          label: string | null
          redeemed_at: string | null
          redeemed_by: string | null
        }
        Insert: {
          code_hash: string
          created_at?: string
          expires_at?: string | null
          gatekeeper_id: string
          id?: string
          label?: string | null
          redeemed_at?: string | null
          redeemed_by?: string | null
        }
        Update: {
          code_hash?: string
          created_at?: string
          expires_at?: string | null
          gatekeeper_id?: string
          id?: string
          label?: string | null
          redeemed_at?: string | null
          redeemed_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "access_codes_gatekeeper_id_fkey"
            columns: ["gatekeeper_id"]
            isOneToOne: false
            referencedRelation: "gatekeepers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "access_codes_redeemed_by_fkey"
            columns: ["redeemed_by"]
            isOneToOne: false
            referencedRelation: "survivors"
            referencedColumns: ["id"]
          },
        ]
      }
      content_revisions: {
        Row: {
          edited_at: string
          entity_id: string
          entity_type: Database["public"]["Enums"]["revision_entity"]
          id: string
          snapshot: Json
          survivor_id: string
        }
        Insert: {
          edited_at?: string
          entity_id: string
          entity_type: Database["public"]["Enums"]["revision_entity"]
          id?: string
          snapshot: Json
          survivor_id: string
        }
        Update: {
          edited_at?: string
          entity_id?: string
          entity_type?: Database["public"]["Enums"]["revision_entity"]
          id?: string
          snapshot?: Json
          survivor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "content_revisions_survivor_id_fkey"
            columns: ["survivor_id"]
            isOneToOne: false
            referencedRelation: "survivors"
            referencedColumns: ["id"]
          },
        ]
      }
      documents: {
        Row: {
          detected_language: string | null
          document_type: Database["public"]["Enums"]["document_type"]
          extracted_text: string | null
          id: string
          storage_path: string
          survivor_id: string
          uploaded_at: string
          visibility: Database["public"]["Enums"]["content_visibility"]
        }
        Insert: {
          detected_language?: string | null
          document_type?: Database["public"]["Enums"]["document_type"]
          extracted_text?: string | null
          id?: string
          storage_path: string
          survivor_id: string
          uploaded_at?: string
          visibility?: Database["public"]["Enums"]["content_visibility"]
        }
        Update: {
          detected_language?: string | null
          document_type?: Database["public"]["Enums"]["document_type"]
          extracted_text?: string | null
          id?: string
          storage_path?: string
          survivor_id?: string
          uploaded_at?: string
          visibility?: Database["public"]["Enums"]["content_visibility"]
        }
        Relationships: [
          {
            foreignKeyName: "documents_survivor_id_fkey"
            columns: ["survivor_id"]
            isOneToOne: false
            referencedRelation: "survivors"
            referencedColumns: ["id"]
          },
        ]
      }
      embeddings: {
        Row: {
          chunk_text: string
          created_at: string
          embedding: string | null
          id: string
          language: string | null
          metadata: Json
          source_id: string
          source_type: Database["public"]["Enums"]["embedding_source"]
          survivor_id: string
        }
        Insert: {
          chunk_text: string
          created_at?: string
          embedding?: string | null
          id?: string
          language?: string | null
          metadata?: Json
          source_id: string
          source_type: Database["public"]["Enums"]["embedding_source"]
          survivor_id: string
        }
        Update: {
          chunk_text?: string
          created_at?: string
          embedding?: string | null
          id?: string
          language?: string | null
          metadata?: Json
          source_id?: string
          source_type?: Database["public"]["Enums"]["embedding_source"]
          survivor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "embeddings_survivor_id_fkey"
            columns: ["survivor_id"]
            isOneToOne: false
            referencedRelation: "survivors"
            referencedColumns: ["id"]
          },
        ]
      }
      flags: {
        Row: {
          created_at: string
          flag_type: Database["public"]["Enums"]["flag_type"]
          id: string
          note: string | null
          related_entity_id: string | null
          related_entity_type: string | null
          status: Database["public"]["Enums"]["flag_status"]
          survivor_id: string
        }
        Insert: {
          created_at?: string
          flag_type: Database["public"]["Enums"]["flag_type"]
          id?: string
          note?: string | null
          related_entity_id?: string | null
          related_entity_type?: string | null
          status?: Database["public"]["Enums"]["flag_status"]
          survivor_id: string
        }
        Update: {
          created_at?: string
          flag_type?: Database["public"]["Enums"]["flag_type"]
          id?: string
          note?: string | null
          related_entity_id?: string | null
          related_entity_type?: string | null
          status?: Database["public"]["Enums"]["flag_status"]
          survivor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "flags_survivor_id_fkey"
            columns: ["survivor_id"]
            isOneToOne: false
            referencedRelation: "survivors"
            referencedColumns: ["id"]
          },
        ]
      }
      gatekeepers: {
        Row: {
          auth_user_id: string | null
          created_at: string
          id: string
          org_name: string | null
          role: Database["public"]["Enums"]["gatekeeper_role"]
          updated_at: string
        }
        Insert: {
          auth_user_id?: string | null
          created_at?: string
          id?: string
          org_name?: string | null
          role: Database["public"]["Enums"]["gatekeeper_role"]
          updated_at?: string
        }
        Update: {
          auth_user_id?: string | null
          created_at?: string
          id?: string
          org_name?: string | null
          role?: Database["public"]["Enums"]["gatekeeper_role"]
          updated_at?: string
        }
        Relationships: []
      }
      statements: {
        Row: {
          created_at: string
          id: string
          language: string | null
          raw_text: string
          session_id: string | null
          survivor_id: string
          updated_at: string
          visibility: Database["public"]["Enums"]["content_visibility"]
        }
        Insert: {
          created_at?: string
          id?: string
          language?: string | null
          raw_text: string
          session_id?: string | null
          survivor_id: string
          updated_at?: string
          visibility?: Database["public"]["Enums"]["content_visibility"]
        }
        Update: {
          created_at?: string
          id?: string
          language?: string | null
          raw_text?: string
          session_id?: string | null
          survivor_id?: string
          updated_at?: string
          visibility?: Database["public"]["Enums"]["content_visibility"]
        }
        Relationships: [
          {
            foreignKeyName: "statements_survivor_id_fkey"
            columns: ["survivor_id"]
            isOneToOne: false
            referencedRelation: "survivors"
            referencedColumns: ["id"]
          },
        ]
      }
      survivors: {
        Row: {
          auth_user_id: string | null
          created_at: string
          first_name: string | null
          gatekeeper_id: string
          id: string
          preferred_language: string | null
          session_length_pref: string | null
          support_contact_name: string | null
          support_contact_phone_enc: string | null
          updated_at: string
        }
        Insert: {
          auth_user_id?: string | null
          created_at?: string
          first_name?: string | null
          gatekeeper_id: string
          id?: string
          preferred_language?: string | null
          session_length_pref?: string | null
          support_contact_name?: string | null
          support_contact_phone_enc?: string | null
          updated_at?: string
        }
        Update: {
          auth_user_id?: string | null
          created_at?: string
          first_name?: string | null
          gatekeeper_id?: string
          id?: string
          preferred_language?: string | null
          session_length_pref?: string | null
          support_contact_name?: string | null
          support_contact_phone_enc?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "survivors_gatekeeper_id_fkey"
            columns: ["gatekeeper_id"]
            isOneToOne: false
            referencedRelation: "gatekeepers"
            referencedColumns: ["id"]
          },
        ]
      }
      timeline_events: {
        Row: {
          after_event_id: string | null
          before_event_id: string | null
          created_at: string
          description: string | null
          event_date: string | null
          id: string
          order_index: number
          source_document_id: string | null
          source_statement_id: string | null
          survivor_id: string
          title: string
          updated_at: string
          visibility: Database["public"]["Enums"]["content_visibility"]
        }
        Insert: {
          after_event_id?: string | null
          before_event_id?: string | null
          created_at?: string
          description?: string | null
          event_date?: string | null
          id?: string
          order_index?: number
          source_document_id?: string | null
          source_statement_id?: string | null
          survivor_id: string
          title: string
          updated_at?: string
          visibility?: Database["public"]["Enums"]["content_visibility"]
        }
        Update: {
          after_event_id?: string | null
          before_event_id?: string | null
          created_at?: string
          description?: string | null
          event_date?: string | null
          id?: string
          order_index?: number
          source_document_id?: string | null
          source_statement_id?: string | null
          survivor_id?: string
          title?: string
          updated_at?: string
          visibility?: Database["public"]["Enums"]["content_visibility"]
        }
        Relationships: [
          {
            foreignKeyName: "timeline_events_after_event_id_fkey"
            columns: ["after_event_id"]
            isOneToOne: false
            referencedRelation: "timeline_events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "timeline_events_before_event_id_fkey"
            columns: ["before_event_id"]
            isOneToOne: false
            referencedRelation: "timeline_events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "timeline_events_source_document_id_fkey"
            columns: ["source_document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "timeline_events_source_statement_id_fkey"
            columns: ["source_statement_id"]
            isOneToOne: false
            referencedRelation: "statements"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "timeline_events_survivor_id_fkey"
            columns: ["survivor_id"]
            isOneToOne: false
            referencedRelation: "survivors"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      app_secret: { Args: { p_name: string }; Returns: string }
      current_gatekeeper_id: { Args: never; Returns: string }
      current_survivor_id: { Args: never; Returns: string }
      get_support_contact: {
        Args: { p_survivor_id: string }
        Returns: {
          name: string
          phone: string
        }[]
      }
      is_gatekeeper_for: { Args: { p_survivor_id: string }; Returns: boolean }
      mint_access_code: {
        Args: { p_code: string; p_expires_at: string; p_label: string }
        Returns: string
      }
      set_support_contact: {
        Args: { p_name: string; p_phone: string; p_survivor_id: string }
        Returns: undefined
      }
      redeem_access_code: { Args: { p_code: string }; Returns: string }
      verify_access_code: { Args: { p_code: string }; Returns: string }
    }
    Enums: {
      content_visibility: "shareable" | "private"
      document_type:
        | "identification"
        | "legal"
        | "medical"
        | "correspondence"
        | "evidence"
        | "other"
      embedding_source: "statement" | "document"
      flag_status: "open" | "reviewed" | "resolved" | "dismissed"
      flag_type: "gap" | "inconsistency" | "trauma" | "other"
      gatekeeper_role: "advocate" | "attorney" | "prosecutor" | "case_manager"
      revision_entity: "statement" | "timeline_event"
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
    Enums: {
      content_visibility: ["shareable", "private"],
      document_type: [
        "identification",
        "legal",
        "medical",
        "correspondence",
        "evidence",
        "other",
      ],
      embedding_source: ["statement", "document"],
      flag_status: ["open", "reviewed", "resolved", "dismissed"],
      flag_type: ["gap", "inconsistency", "trauma", "other"],
      gatekeeper_role: ["advocate", "attorney", "prosecutor", "case_manager"],
      revision_entity: ["statement", "timeline_event"],
    },
  },
} as const
