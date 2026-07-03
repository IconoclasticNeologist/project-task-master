export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5";
  };
  public: {
    Tables: {
      access_codes: {
        Row: {
          code_hash: string;
          created_at: string;
          expires_at: string | null;
          gatekeeper_id: string;
          id: string;
          label: string | null;
          redeemed_at: string | null;
          redeemed_by: string | null;
        };
        Insert: {
          code_hash: string;
          created_at?: string;
          expires_at?: string | null;
          gatekeeper_id: string;
          id?: string;
          label?: string | null;
          redeemed_at?: string | null;
          redeemed_by?: string | null;
        };
        Update: {
          code_hash?: string;
          created_at?: string;
          expires_at?: string | null;
          gatekeeper_id?: string;
          id?: string;
          label?: string | null;
          redeemed_at?: string | null;
          redeemed_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "access_codes_gatekeeper_id_fkey";
            columns: ["gatekeeper_id"];
            isOneToOne: false;
            referencedRelation: "gatekeepers";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "access_codes_redeemed_by_fkey";
            columns: ["redeemed_by"];
            isOneToOne: false;
            referencedRelation: "survivors";
            referencedColumns: ["id"];
          },
        ];
      };
      client_access_audit: {
        Row: {
          access_grant_id: string | null;
          action: string;
          actor_auth_user_id: string | null;
          id: string;
          occurred_at: string;
          workspace_id: string;
        };
        Insert: {
          access_grant_id?: string | null;
          action: string;
          actor_auth_user_id?: string | null;
          id?: string;
          occurred_at?: string;
          workspace_id: string;
        };
        Update: {
          access_grant_id?: string | null;
          action?: string;
          actor_auth_user_id?: string | null;
          id?: string;
          occurred_at?: string;
          workspace_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "client_access_audit_access_grant_id_fkey";
            columns: ["access_grant_id"];
            isOneToOne: false;
            referencedRelation: "client_access_grants";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "client_access_audit_workspace_id_fkey";
            columns: ["workspace_id"];
            isOneToOne: false;
            referencedRelation: "client_workspaces";
            referencedColumns: ["id"];
          },
        ];
      };
      client_access_grants: {
        Row: {
          created_at: string;
          expires_at: string | null;
          id: string;
          membership_id: string;
          origin: string;
          purpose: string;
          requested_at: string;
          responded_at: string | null;
          scopes: Database["public"]["Enums"]["client_access_scope"][];
          status: Database["public"]["Enums"]["client_access_status"];
          updated_at: string;
          workspace_id: string;
        };
        Insert: {
          created_at?: string;
          expires_at?: string | null;
          id?: string;
          membership_id: string;
          origin?: string;
          purpose: string;
          requested_at?: string;
          responded_at?: string | null;
          scopes: Database["public"]["Enums"]["client_access_scope"][];
          status?: Database["public"]["Enums"]["client_access_status"];
          updated_at?: string;
          workspace_id: string;
        };
        Update: {
          created_at?: string;
          expires_at?: string | null;
          id?: string;
          membership_id?: string;
          origin?: string;
          purpose?: string;
          requested_at?: string;
          responded_at?: string | null;
          scopes?: Database["public"]["Enums"]["client_access_scope"][];
          status?: Database["public"]["Enums"]["client_access_status"];
          updated_at?: string;
          workspace_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "client_access_grants_membership_id_fkey";
            columns: ["membership_id"];
            isOneToOne: false;
            referencedRelation: "organization_memberships";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "client_access_grants_workspace_id_fkey";
            columns: ["workspace_id"];
            isOneToOne: false;
            referencedRelation: "client_workspaces";
            referencedColumns: ["id"];
          },
        ];
      };
      client_invites: {
        Row: {
          code_hash: string;
          created_at: string;
          expires_at: string | null;
          id: string;
          label: string | null;
          organization_id: string;
          purpose: string;
          redeemed_at: string | null;
          redeemed_by: string | null;
          requested_by_membership_id: string;
          scopes: Database["public"]["Enums"]["client_access_scope"][];
        };
        Insert: {
          code_hash: string;
          created_at?: string;
          expires_at?: string | null;
          id?: string;
          label?: string | null;
          organization_id: string;
          purpose: string;
          redeemed_at?: string | null;
          redeemed_by?: string | null;
          requested_by_membership_id: string;
          scopes: Database["public"]["Enums"]["client_access_scope"][];
        };
        Update: {
          code_hash?: string;
          created_at?: string;
          expires_at?: string | null;
          id?: string;
          label?: string | null;
          organization_id?: string;
          purpose?: string;
          redeemed_at?: string | null;
          redeemed_by?: string | null;
          requested_by_membership_id?: string;
          scopes?: Database["public"]["Enums"]["client_access_scope"][];
        };
        Relationships: [
          {
            foreignKeyName: "client_invites_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "client_invites_redeemed_by_fkey";
            columns: ["redeemed_by"];
            isOneToOne: false;
            referencedRelation: "survivors";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "client_invites_requested_by_membership_id_fkey";
            columns: ["requested_by_membership_id"];
            isOneToOne: false;
            referencedRelation: "organization_memberships";
            referencedColumns: ["id"];
          },
        ];
      };
      client_workspaces: {
        Row: {
          created_at: string;
          id: string;
          jurisdiction: string | null;
          label: string;
          organization_id: string;
          survivor_id: string;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          jurisdiction?: string | null;
          label?: string;
          organization_id: string;
          survivor_id: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          jurisdiction?: string | null;
          label?: string;
          organization_id?: string;
          survivor_id?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "client_workspaces_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "client_workspaces_survivor_id_fkey";
            columns: ["survivor_id"];
            isOneToOne: false;
            referencedRelation: "survivors";
            referencedColumns: ["id"];
          },
        ];
      };
      content_revisions: {
        Row: {
          edited_at: string;
          entity_id: string;
          entity_type: Database["public"]["Enums"]["revision_entity"];
          id: string;
          snapshot: Json;
          survivor_id: string;
        };
        Insert: {
          edited_at?: string;
          entity_id: string;
          entity_type: Database["public"]["Enums"]["revision_entity"];
          id?: string;
          snapshot: Json;
          survivor_id: string;
        };
        Update: {
          edited_at?: string;
          entity_id?: string;
          entity_type?: Database["public"]["Enums"]["revision_entity"];
          id?: string;
          snapshot?: Json;
          survivor_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "content_revisions_survivor_id_fkey";
            columns: ["survivor_id"];
            isOneToOne: false;
            referencedRelation: "survivors";
            referencedColumns: ["id"];
          },
        ];
      };
      court_plan_items: {
        Row: {
          category: Database["public"]["Enums"]["court_plan_category"];
          created_at: string;
          created_by_auth_user_id: string | null;
          details: string | null;
          due_date: string | null;
          id: string;
          sort_order: number;
          status: Database["public"]["Enums"]["court_plan_item_status"];
          title: string;
          updated_at: string;
          workspace_id: string;
        };
        Insert: {
          category: Database["public"]["Enums"]["court_plan_category"];
          created_at?: string;
          created_by_auth_user_id?: string | null;
          details?: string | null;
          due_date?: string | null;
          id?: string;
          sort_order?: number;
          status?: Database["public"]["Enums"]["court_plan_item_status"];
          title: string;
          updated_at?: string;
          workspace_id: string;
        };
        Update: {
          category?: Database["public"]["Enums"]["court_plan_category"];
          created_at?: string;
          created_by_auth_user_id?: string | null;
          details?: string | null;
          due_date?: string | null;
          id?: string;
          sort_order?: number;
          status?: Database["public"]["Enums"]["court_plan_item_status"];
          title?: string;
          updated_at?: string;
          workspace_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "court_plan_items_workspace_id_fkey";
            columns: ["workspace_id"];
            isOneToOne: false;
            referencedRelation: "client_workspaces";
            referencedColumns: ["id"];
          },
        ];
      };
      documents: {
        Row: {
          detected_language: string | null;
          document_type: Database["public"]["Enums"]["document_type"];
          extracted_text: string | null;
          id: string;
          note: string | null;
          storage_path: string;
          survivor_id: string;
          uploaded_at: string;
          visibility: Database["public"]["Enums"]["content_visibility"];
        };
        Insert: {
          detected_language?: string | null;
          document_type?: Database["public"]["Enums"]["document_type"];
          extracted_text?: string | null;
          id?: string;
          note?: string | null;
          storage_path: string;
          survivor_id: string;
          uploaded_at?: string;
          visibility?: Database["public"]["Enums"]["content_visibility"];
        };
        Update: {
          detected_language?: string | null;
          document_type?: Database["public"]["Enums"]["document_type"];
          extracted_text?: string | null;
          id?: string;
          note?: string | null;
          storage_path?: string;
          survivor_id?: string;
          uploaded_at?: string;
          visibility?: Database["public"]["Enums"]["content_visibility"];
        };
        Relationships: [
          {
            foreignKeyName: "documents_survivor_id_fkey";
            columns: ["survivor_id"];
            isOneToOne: false;
            referencedRelation: "survivors";
            referencedColumns: ["id"];
          },
        ];
      };
      embeddings: {
        Row: {
          chunk_text: string;
          created_at: string;
          embedding: string | null;
          id: string;
          language: string | null;
          metadata: Json;
          source_id: string;
          source_type: Database["public"]["Enums"]["embedding_source"];
          survivor_id: string;
        };
        Insert: {
          chunk_text: string;
          created_at?: string;
          embedding?: string | null;
          id?: string;
          language?: string | null;
          metadata?: Json;
          source_id: string;
          source_type: Database["public"]["Enums"]["embedding_source"];
          survivor_id: string;
        };
        Update: {
          chunk_text?: string;
          created_at?: string;
          embedding?: string | null;
          id?: string;
          language?: string | null;
          metadata?: Json;
          source_id?: string;
          source_type?: Database["public"]["Enums"]["embedding_source"];
          survivor_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "embeddings_survivor_id_fkey";
            columns: ["survivor_id"];
            isOneToOne: false;
            referencedRelation: "survivors";
            referencedColumns: ["id"];
          },
        ];
      };
      flags: {
        Row: {
          created_at: string;
          flag_type: Database["public"]["Enums"]["flag_type"];
          id: string;
          note: string | null;
          related_entity_id: string | null;
          related_entity_type: string | null;
          status: Database["public"]["Enums"]["flag_status"];
          survivor_id: string;
        };
        Insert: {
          created_at?: string;
          flag_type: Database["public"]["Enums"]["flag_type"];
          id?: string;
          note?: string | null;
          related_entity_id?: string | null;
          related_entity_type?: string | null;
          status?: Database["public"]["Enums"]["flag_status"];
          survivor_id: string;
        };
        Update: {
          created_at?: string;
          flag_type?: Database["public"]["Enums"]["flag_type"];
          id?: string;
          note?: string | null;
          related_entity_id?: string | null;
          related_entity_type?: string | null;
          status?: Database["public"]["Enums"]["flag_status"];
          survivor_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "flags_survivor_id_fkey";
            columns: ["survivor_id"];
            isOneToOne: false;
            referencedRelation: "survivors";
            referencedColumns: ["id"];
          },
        ];
      };
      gatekeepers: {
        Row: {
          auth_user_id: string | null;
          created_at: string;
          id: string;
          org_name: string | null;
          role: Database["public"]["Enums"]["gatekeeper_role"];
          updated_at: string;
        };
        Insert: {
          auth_user_id?: string | null;
          created_at?: string;
          id?: string;
          org_name?: string | null;
          role: Database["public"]["Enums"]["gatekeeper_role"];
          updated_at?: string;
        };
        Update: {
          auth_user_id?: string | null;
          created_at?: string;
          id?: string;
          org_name?: string | null;
          role?: Database["public"]["Enums"]["gatekeeper_role"];
          updated_at?: string;
        };
        Relationships: [];
      };
      knowledge_item_reviews: {
        Row: {
          created_at: string;
          decision: Database["public"]["Enums"]["knowledge_review_decision"];
          id: string;
          knowledge_item_id: string;
          notes: string | null;
          review_area: Database["public"]["Enums"]["knowledge_review_area"];
          reviewed_revision: number;
          reviewer_membership_id: string;
        };
        Insert: {
          created_at?: string;
          decision: Database["public"]["Enums"]["knowledge_review_decision"];
          id?: string;
          knowledge_item_id: string;
          notes?: string | null;
          review_area: Database["public"]["Enums"]["knowledge_review_area"];
          reviewed_revision: number;
          reviewer_membership_id: string;
        };
        Update: {
          created_at?: string;
          decision?: Database["public"]["Enums"]["knowledge_review_decision"];
          id?: string;
          knowledge_item_id?: string;
          notes?: string | null;
          review_area?: Database["public"]["Enums"]["knowledge_review_area"];
          reviewed_revision?: number;
          reviewer_membership_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "knowledge_item_reviews_knowledge_item_id_fkey";
            columns: ["knowledge_item_id"];
            isOneToOne: false;
            referencedRelation: "knowledge_items";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "knowledge_item_reviews_reviewer_membership_id_fkey";
            columns: ["reviewer_membership_id"];
            isOneToOne: false;
            referencedRelation: "organization_memberships";
            referencedColumns: ["id"];
          },
        ];
      };
      knowledge_items: {
        Row: {
          body: string;
          created_at: string;
          created_by_membership_id: string;
          id: string;
          jurisdiction: string | null;
          language: string;
          organization_id: string;
          primary_source_id: string;
          published_at: string | null;
          retired_at: string | null;
          revision: number;
          risk_class: Database["public"]["Enums"]["knowledge_risk_class"];
          status: Database["public"]["Enums"]["knowledge_item_status"];
          title: string;
          updated_at: string;
        };
        Insert: {
          body: string;
          created_at?: string;
          created_by_membership_id: string;
          id?: string;
          jurisdiction?: string | null;
          language?: string;
          organization_id: string;
          primary_source_id: string;
          published_at?: string | null;
          retired_at?: string | null;
          revision?: number;
          risk_class?: Database["public"]["Enums"]["knowledge_risk_class"];
          status?: Database["public"]["Enums"]["knowledge_item_status"];
          title: string;
          updated_at?: string;
        };
        Update: {
          body?: string;
          created_at?: string;
          created_by_membership_id?: string;
          id?: string;
          jurisdiction?: string | null;
          language?: string;
          organization_id?: string;
          primary_source_id?: string;
          published_at?: string | null;
          retired_at?: string | null;
          revision?: number;
          risk_class?: Database["public"]["Enums"]["knowledge_risk_class"];
          status?: Database["public"]["Enums"]["knowledge_item_status"];
          title?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "knowledge_items_created_by_membership_id_fkey";
            columns: ["created_by_membership_id"];
            isOneToOne: false;
            referencedRelation: "organization_memberships";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "knowledge_items_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "knowledge_items_primary_source_id_fkey";
            columns: ["primary_source_id"];
            isOneToOne: false;
            referencedRelation: "knowledge_sources";
            referencedColumns: ["id"];
          },
        ];
      };
      knowledge_sources: {
        Row: {
          created_at: string;
          created_by_membership_id: string;
          id: string;
          jurisdiction: string | null;
          organization_id: string;
          publication_date: string | null;
          publisher: string | null;
          source_notes: string | null;
          source_type: Database["public"]["Enums"]["knowledge_source_type"];
          source_url: string;
          title: string;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          created_by_membership_id: string;
          id?: string;
          jurisdiction?: string | null;
          organization_id: string;
          publication_date?: string | null;
          publisher?: string | null;
          source_notes?: string | null;
          source_type: Database["public"]["Enums"]["knowledge_source_type"];
          source_url: string;
          title: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          created_by_membership_id?: string;
          id?: string;
          jurisdiction?: string | null;
          organization_id?: string;
          publication_date?: string | null;
          publisher?: string | null;
          source_notes?: string | null;
          source_type?: Database["public"]["Enums"]["knowledge_source_type"];
          source_url?: string;
          title?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "knowledge_sources_created_by_membership_id_fkey";
            columns: ["created_by_membership_id"];
            isOneToOne: false;
            referencedRelation: "organization_memberships";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "knowledge_sources_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };
      organization_member_invites: {
        Row: {
          code_hash: string;
          created_at: string;
          expires_at: string;
          id: string;
          invited_by_membership_id: string;
          organization_id: string;
          redeemed_at: string | null;
          redeemed_by_membership_id: string | null;
          role: Database["public"]["Enums"]["organization_member_role"];
        };
        Insert: {
          code_hash: string;
          created_at?: string;
          expires_at: string;
          id?: string;
          invited_by_membership_id: string;
          organization_id: string;
          redeemed_at?: string | null;
          redeemed_by_membership_id?: string | null;
          role: Database["public"]["Enums"]["organization_member_role"];
        };
        Update: {
          code_hash?: string;
          created_at?: string;
          expires_at?: string;
          id?: string;
          invited_by_membership_id?: string;
          organization_id?: string;
          redeemed_at?: string | null;
          redeemed_by_membership_id?: string | null;
          role?: Database["public"]["Enums"]["organization_member_role"];
        };
        Relationships: [
          {
            foreignKeyName: "organization_member_invites_invited_by_membership_id_fkey";
            columns: ["invited_by_membership_id"];
            isOneToOne: false;
            referencedRelation: "organization_memberships";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "organization_member_invites_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "organization_member_invites_redeemed_by_membership_id_fkey";
            columns: ["redeemed_by_membership_id"];
            isOneToOne: true;
            referencedRelation: "organization_memberships";
            referencedColumns: ["id"];
          },
        ];
      };
      organization_memberships: {
        Row: {
          auth_user_id: string;
          created_at: string;
          display_name: string | null;
          id: string;
          organization_id: string;
          role: Database["public"]["Enums"]["organization_member_role"];
          status: Database["public"]["Enums"]["organization_membership_status"];
          updated_at: string;
        };
        Insert: {
          auth_user_id: string;
          created_at?: string;
          display_name?: string | null;
          id?: string;
          organization_id: string;
          role: Database["public"]["Enums"]["organization_member_role"];
          status?: Database["public"]["Enums"]["organization_membership_status"];
          updated_at?: string;
        };
        Update: {
          auth_user_id?: string;
          created_at?: string;
          display_name?: string | null;
          id?: string;
          organization_id?: string;
          role?: Database["public"]["Enums"]["organization_member_role"];
          status?: Database["public"]["Enums"]["organization_membership_status"];
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "organization_memberships_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };
      organizations: {
        Row: {
          created_at: string;
          default_jurisdiction: string | null;
          id: string;
          legacy_gatekeeper_id: string | null;
          name: string;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          default_jurisdiction?: string | null;
          id?: string;
          legacy_gatekeeper_id?: string | null;
          name: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          default_jurisdiction?: string | null;
          id?: string;
          legacy_gatekeeper_id?: string | null;
          name?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "organizations_legacy_gatekeeper_id_fkey";
            columns: ["legacy_gatekeeper_id"];
            isOneToOne: true;
            referencedRelation: "gatekeepers";
            referencedColumns: ["id"];
          },
        ];
      };
      professional_approvals: {
        Row: {
          approved_at: string;
          auth_user_id: string;
          organization_creation_allowed: boolean;
          revoked_at: string | null;
        };
        Insert: {
          approved_at?: string;
          auth_user_id: string;
          organization_creation_allowed?: boolean;
          revoked_at?: string | null;
        };
        Update: {
          approved_at?: string;
          auth_user_id?: string;
          organization_creation_allowed?: boolean;
          revoked_at?: string | null;
        };
        Relationships: [];
      };
      resource_directory_entries: {
        Row: {
          category: Database["public"]["Enums"]["resource_category"];
          created_at: string;
          created_by_membership_id: string;
          description: string | null;
          eligibility: string | null;
          geographic_scope: string | null;
          hours: string | null;
          id: string;
          languages: string | null;
          name: string;
          organization_id: string;
          phone: string | null;
          published_at: string | null;
          retired_at: string | null;
          source_url: string;
          status: Database["public"]["Enums"]["resource_status"];
          text_contact: string | null;
          updated_at: string;
          website_url: string | null;
        };
        Insert: {
          category: Database["public"]["Enums"]["resource_category"];
          created_at?: string;
          created_by_membership_id: string;
          description?: string | null;
          eligibility?: string | null;
          geographic_scope?: string | null;
          hours?: string | null;
          id?: string;
          languages?: string | null;
          name: string;
          organization_id: string;
          phone?: string | null;
          published_at?: string | null;
          retired_at?: string | null;
          source_url: string;
          status?: Database["public"]["Enums"]["resource_status"];
          text_contact?: string | null;
          updated_at?: string;
          website_url?: string | null;
        };
        Update: {
          category?: Database["public"]["Enums"]["resource_category"];
          created_at?: string;
          created_by_membership_id?: string;
          description?: string | null;
          eligibility?: string | null;
          geographic_scope?: string | null;
          hours?: string | null;
          id?: string;
          languages?: string | null;
          name?: string;
          organization_id?: string;
          phone?: string | null;
          published_at?: string | null;
          retired_at?: string | null;
          source_url?: string;
          status?: Database["public"]["Enums"]["resource_status"];
          text_contact?: string | null;
          updated_at?: string;
          website_url?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "resource_directory_entries_created_by_membership_id_fkey";
            columns: ["created_by_membership_id"];
            isOneToOne: false;
            referencedRelation: "organization_memberships";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "resource_directory_entries_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };
      resource_verifications: {
        Row: {
          decision: Database["public"]["Enums"]["resource_verification_decision"];
          id: string;
          next_review_at: string | null;
          notes: string | null;
          resource_entry_id: string;
          reviewer_membership_id: string;
          verified_at: string;
        };
        Insert: {
          decision: Database["public"]["Enums"]["resource_verification_decision"];
          id?: string;
          next_review_at?: string | null;
          notes?: string | null;
          resource_entry_id: string;
          reviewer_membership_id: string;
          verified_at?: string;
        };
        Update: {
          decision?: Database["public"]["Enums"]["resource_verification_decision"];
          id?: string;
          next_review_at?: string | null;
          notes?: string | null;
          resource_entry_id?: string;
          reviewer_membership_id?: string;
          verified_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "resource_verifications_resource_entry_id_fkey";
            columns: ["resource_entry_id"];
            isOneToOne: false;
            referencedRelation: "resource_directory_entries";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "resource_verifications_reviewer_membership_id_fkey";
            columns: ["reviewer_membership_id"];
            isOneToOne: false;
            referencedRelation: "organization_memberships";
            referencedColumns: ["id"];
          },
        ];
      };
      statements: {
        Row: {
          created_at: string;
          id: string;
          language: string | null;
          raw_text: string;
          session_id: string | null;
          survivor_id: string;
          updated_at: string;
          visibility: Database["public"]["Enums"]["content_visibility"];
        };
        Insert: {
          created_at?: string;
          id?: string;
          language?: string | null;
          raw_text: string;
          session_id?: string | null;
          survivor_id: string;
          updated_at?: string;
          visibility?: Database["public"]["Enums"]["content_visibility"];
        };
        Update: {
          created_at?: string;
          id?: string;
          language?: string | null;
          raw_text?: string;
          session_id?: string | null;
          survivor_id?: string;
          updated_at?: string;
          visibility?: Database["public"]["Enums"]["content_visibility"];
        };
        Relationships: [
          {
            foreignKeyName: "statements_survivor_id_fkey";
            columns: ["survivor_id"];
            isOneToOne: false;
            referencedRelation: "survivors";
            referencedColumns: ["id"];
          },
        ];
      };
      survivors: {
        Row: {
          auth_user_id: string | null;
          calming_anchor: string | null;
          created_at: string;
          default_visibility: Database["public"]["Enums"]["content_visibility"];
          first_name: string | null;
          gatekeeper_id: string | null;
          id: string;
          legacy_gatekeeper_revoked_at: string | null;
          onboarded_at: string | null;
          preferred_language: string | null;
          session_length_pref: string | null;
          support_contact_name: string | null;
          support_contact_phone_enc: string | null;
          updated_at: string;
        };
        Insert: {
          auth_user_id?: string | null;
          calming_anchor?: string | null;
          created_at?: string;
          default_visibility?: Database["public"]["Enums"]["content_visibility"];
          first_name?: string | null;
          gatekeeper_id?: string | null;
          id?: string;
          legacy_gatekeeper_revoked_at?: string | null;
          onboarded_at?: string | null;
          preferred_language?: string | null;
          session_length_pref?: string | null;
          support_contact_name?: string | null;
          support_contact_phone_enc?: string | null;
          updated_at?: string;
        };
        Update: {
          auth_user_id?: string | null;
          calming_anchor?: string | null;
          created_at?: string;
          default_visibility?: Database["public"]["Enums"]["content_visibility"];
          first_name?: string | null;
          gatekeeper_id?: string | null;
          id?: string;
          legacy_gatekeeper_revoked_at?: string | null;
          onboarded_at?: string | null;
          preferred_language?: string | null;
          session_length_pref?: string | null;
          support_contact_name?: string | null;
          support_contact_phone_enc?: string | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "survivors_gatekeeper_id_fkey";
            columns: ["gatekeeper_id"];
            isOneToOne: false;
            referencedRelation: "gatekeepers";
            referencedColumns: ["id"];
          },
        ];
      };
      timeline_events: {
        Row: {
          after_event_id: string | null;
          before_event_id: string | null;
          created_at: string;
          description: string | null;
          event_date: string | null;
          id: string;
          order_index: number;
          relative_anchor: string | null;
          source_document_id: string | null;
          source_statement_id: string | null;
          survivor_id: string;
          title: string | null;
          updated_at: string;
          visibility: Database["public"]["Enums"]["content_visibility"];
        };
        Insert: {
          after_event_id?: string | null;
          before_event_id?: string | null;
          created_at?: string;
          description?: string | null;
          event_date?: string | null;
          id?: string;
          order_index?: number;
          relative_anchor?: string | null;
          source_document_id?: string | null;
          source_statement_id?: string | null;
          survivor_id: string;
          title?: string | null;
          updated_at?: string;
          visibility?: Database["public"]["Enums"]["content_visibility"];
        };
        Update: {
          after_event_id?: string | null;
          before_event_id?: string | null;
          created_at?: string;
          description?: string | null;
          event_date?: string | null;
          id?: string;
          order_index?: number;
          relative_anchor?: string | null;
          source_document_id?: string | null;
          source_statement_id?: string | null;
          survivor_id?: string;
          title?: string | null;
          updated_at?: string;
          visibility?: Database["public"]["Enums"]["content_visibility"];
        };
        Relationships: [
          {
            foreignKeyName: "timeline_events_after_event_id_fkey";
            columns: ["after_event_id"];
            isOneToOne: false;
            referencedRelation: "timeline_events";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "timeline_events_before_event_id_fkey";
            columns: ["before_event_id"];
            isOneToOne: false;
            referencedRelation: "timeline_events";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "timeline_events_source_document_id_fkey";
            columns: ["source_document_id"];
            isOneToOne: false;
            referencedRelation: "documents";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "timeline_events_source_statement_id_fkey";
            columns: ["source_statement_id"];
            isOneToOne: false;
            referencedRelation: "statements";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "timeline_events_survivor_id_fkey";
            columns: ["survivor_id"];
            isOneToOne: false;
            referencedRelation: "survivors";
            referencedColumns: ["id"];
          },
        ];
      };
      voice_session_counters: {
        Row: {
          day: string;
          session_count: number;
          updated_at: string;
        };
        Insert: {
          day: string;
          session_count?: number;
          updated_at?: string;
        };
        Update: {
          day?: string;
          session_count?: number;
          updated_at?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      app_secret: { Args: { p_name: string }; Returns: string };
      can_create_organization: { Args: never; Returns: boolean };
      can_manage_organization_clients: {
        Args: { p_organization_id: string };
        Returns: boolean;
      };
      can_manage_organization_knowledge: {
        Args: { p_organization_id: string };
        Returns: boolean;
      };
      can_review_knowledge: {
        Args: {
          p_area: Database["public"]["Enums"]["knowledge_review_area"];
          p_organization_id: string;
        };
        Returns: boolean;
      };
      create_client_invite: {
        Args: {
          p_code: string;
          p_expires_at?: string;
          p_label: string;
          p_organization_id: string;
          p_purpose: string;
          p_scopes: Database["public"]["Enums"]["client_access_scope"][];
        };
        Returns: string;
      };
      create_court_plan_item: {
        Args: {
          p_category: Database["public"]["Enums"]["court_plan_category"];
          p_details?: string;
          p_due_date?: string;
          p_title: string;
          p_workspace_id: string;
        };
        Returns: string;
      };
      create_knowledge_item: {
        Args: {
          p_body: string;
          p_jurisdiction?: string;
          p_language?: string;
          p_organization_id: string;
          p_primary_source_id: string;
          p_risk_class: Database["public"]["Enums"]["knowledge_risk_class"];
          p_title: string;
        };
        Returns: string;
      };
      create_knowledge_source: {
        Args: {
          p_jurisdiction?: string;
          p_organization_id: string;
          p_publication_date?: string;
          p_publisher: string;
          p_source_notes?: string;
          p_source_type: Database["public"]["Enums"]["knowledge_source_type"];
          p_source_url: string;
          p_title: string;
        };
        Returns: string;
      };
      create_organization: {
        Args: {
          p_default_jurisdiction?: string;
          p_display_name?: string;
          p_name: string;
        };
        Returns: string;
      };
      create_organization_member_invite: {
        Args: {
          p_code: string;
          p_expires_at: string;
          p_organization_id: string;
          p_role: Database["public"]["Enums"]["organization_member_role"];
        };
        Returns: string;
      };
      create_resource_directory_entry: {
        Args: {
          p_category: Database["public"]["Enums"]["resource_category"];
          p_description?: string;
          p_eligibility?: string;
          p_geographic_scope?: string;
          p_hours?: string;
          p_languages?: string;
          p_name: string;
          p_organization_id: string;
          p_phone?: string;
          p_source_url: string;
          p_text_contact?: string;
          p_website_url?: string;
        };
        Returns: string;
      };
      current_gatekeeper_id: { Args: never; Returns: string };
      current_organization_membership_id: {
        Args: { p_organization_id: string };
        Returns: string;
      };
      current_survivor_id: { Args: never; Returns: string };
      get_my_court_plan_workspace: { Args: never; Returns: string };
      get_support_contact: {
        Args: { p_survivor_id: string };
        Returns: {
          name: string;
          phone: string;
        }[];
      };
      has_active_client_access: {
        Args: {
          p_scope?: Database["public"]["Enums"]["client_access_scope"];
          p_workspace_id: string;
        };
        Returns: boolean;
      };
      has_active_court_plan_access: {
        Args: {
          p_category: Database["public"]["Enums"]["court_plan_category"];
          p_workspace_id: string;
        };
        Returns: boolean;
      };
      increment_voice_session_count: { Args: { _cap: number }; Returns: number };
      is_active_organization_member: {
        Args: { p_organization_id: string };
        Returns: boolean;
      };
      is_approved_professional: { Args: never; Returns: boolean };
      is_gatekeeper_for: { Args: { p_survivor_id: string }; Returns: boolean };
      is_non_anonymous_user: { Args: never; Returns: boolean };
      is_organization_admin: {
        Args: { p_organization_id: string };
        Returns: boolean;
      };
      list_court_plan_items_for_workspace: {
        Args: { p_workspace_id: string };
        Returns: {
          category: Database["public"]["Enums"]["court_plan_category"];
          court_plan_item_id: string;
          details: string;
          due_date: string;
          sort_order: number;
          status: Database["public"]["Enums"]["court_plan_item_status"];
          title: string;
        }[];
      };
      list_my_client_access_grants: {
        Args: never;
        Returns: {
          expires_at: string;
          grant_id: string;
          organization_name: string;
          origin: string;
          professional_name: string;
          professional_role: Database["public"]["Enums"]["organization_member_role"];
          purpose: string;
          requested_at: string;
          responded_at: string;
          scopes: Database["public"]["Enums"]["client_access_scope"][];
          status: Database["public"]["Enums"]["client_access_status"];
        }[];
      };
      list_my_client_workspaces: {
        Args: never;
        Returns: {
          client_name: string;
          organization_name: string;
          scopes: Database["public"]["Enums"]["client_access_scope"][];
          workspace_id: string;
        }[];
      };
      list_my_court_plan_items: {
        Args: never;
        Returns: {
          category: Database["public"]["Enums"]["court_plan_category"];
          court_plan_item_id: string;
          details: string;
          due_date: string;
          sort_order: number;
          status: Database["public"]["Enums"]["court_plan_item_status"];
          title: string;
          workspace_id: string;
        }[];
      };
      list_my_organizations: {
        Args: never;
        Returns: {
          default_jurisdiction: string;
          organization_id: string;
          organization_name: string;
          role: Database["public"]["Enums"]["organization_member_role"];
        }[];
      };
      list_my_published_resources: {
        Args: never;
        Returns: {
          category: Database["public"]["Enums"]["resource_category"];
          description: string;
          eligibility: string;
          geographic_scope: string;
          hours: string;
          languages: string;
          name: string;
          phone: string;
          resource_entry_id: string;
          text_contact: string;
          website_url: string;
        }[];
      };
      list_organization_knowledge: {
        Args: { p_organization_id: string };
        Returns: {
          body: string;
          jurisdiction: string;
          knowledge_item_id: string;
          language: string;
          revision: number;
          risk_class: Database["public"]["Enums"]["knowledge_risk_class"];
          source_id: string;
          source_title: string;
          source_type: Database["public"]["Enums"]["knowledge_source_type"];
          source_url: string;
          status: Database["public"]["Enums"]["knowledge_item_status"];
          title: string;
        }[];
      };
      list_organization_knowledge_sources: {
        Args: { p_organization_id: string };
        Returns: {
          jurisdiction: string;
          publication_date: string;
          publisher: string;
          source_id: string;
          source_type: Database["public"]["Enums"]["knowledge_source_type"];
          source_url: string;
          title: string;
        }[];
      };
      list_organization_resources: {
        Args: { p_organization_id: string };
        Returns: {
          category: Database["public"]["Enums"]["resource_category"];
          description: string;
          eligibility: string;
          geographic_scope: string;
          hours: string;
          languages: string;
          name: string;
          phone: string;
          resource_entry_id: string;
          source_url: string;
          status: Database["public"]["Enums"]["resource_status"];
          text_contact: string;
          website_url: string;
        }[];
      };
      list_published_knowledge_for_workspace: {
        Args: { p_jurisdiction?: string; p_workspace_id: string };
        Returns: {
          body: string;
          jurisdiction: string;
          knowledge_item_id: string;
          language: string;
          source_title: string;
          source_type: Database["public"]["Enums"]["knowledge_source_type"];
          source_url: string;
          title: string;
        }[];
      };
      match_embeddings: {
        Args: { match_count: number; query_embedding: string };
        Returns: {
          chunk_text: string;
          language: string;
          score: number;
          source_id: string;
          source_type: Database["public"]["Enums"]["embedding_source"];
        }[];
      };
      mint_access_code: {
        Args: { p_code: string; p_expires_at: string; p_label: string };
        Returns: string;
      };
      publish_knowledge_item: {
        Args: { p_knowledge_item_id: string };
        Returns: undefined;
      };
      publish_resource_directory_entry: {
        Args: { p_resource_entry_id: string };
        Returns: undefined;
      };
      redeem_access_code: { Args: { p_code: string }; Returns: string };
      redeem_client_invite: { Args: { p_code: string }; Returns: string };
      redeem_organization_member_invite: {
        Args: { p_code: string; p_display_name: string };
        Returns: string;
      };
      request_knowledge_review: {
        Args: { p_knowledge_item_id: string };
        Returns: undefined;
      };
      respond_to_client_access_grant: {
        Args: { p_decision: string; p_grant_id: string };
        Returns: undefined;
      };
      review_knowledge_item: {
        Args: {
          p_decision: Database["public"]["Enums"]["knowledge_review_decision"];
          p_knowledge_item_id: string;
          p_notes?: string;
          p_review_area: Database["public"]["Enums"]["knowledge_review_area"];
        };
        Returns: undefined;
      };
      revise_knowledge_item: {
        Args: {
          p_body: string;
          p_jurisdiction?: string;
          p_knowledge_item_id: string;
          p_language?: string;
          p_primary_source_id: string;
          p_risk_class: Database["public"]["Enums"]["knowledge_risk_class"];
          p_title: string;
        };
        Returns: undefined;
      };
      set_support_contact: {
        Args: { p_name: string; p_phone: string; p_survivor_id: string };
        Returns: undefined;
      };
      update_court_plan_item_status: {
        Args: {
          p_court_plan_item_id: string;
          p_status: Database["public"]["Enums"]["court_plan_item_status"];
        };
        Returns: undefined;
      };
      verify_access_code: { Args: { p_code: string }; Returns: string };
      verify_client_invite: { Args: { p_code: string }; Returns: string };
      verify_resource_directory_entry: {
        Args: {
          p_decision: Database["public"]["Enums"]["resource_verification_decision"];
          p_next_review_at?: string;
          p_notes?: string;
          p_resource_entry_id: string;
        };
        Returns: undefined;
      };
    };
    Enums: {
      client_access_scope:
        | "logistics"
        | "support_plan"
        | "shared_statements"
        | "shared_timeline"
        | "shared_documents"
        | "client_questions";
      client_access_status: "pending" | "active" | "declined" | "revoked" | "expired";
      content_visibility: "shareable" | "private";
      court_plan_category: "hearing_details" | "travel" | "accommodation" | "support" | "question";
      court_plan_item_status: "not_started" | "in_progress" | "done";
      document_type:
        | "identification"
        | "legal"
        | "medical"
        | "correspondence"
        | "evidence"
        | "other";
      embedding_source: "statement" | "document";
      flag_status: "open" | "reviewed" | "resolved" | "dismissed";
      flag_type: "gap" | "inconsistency" | "trauma" | "other";
      gatekeeper_role: "advocate" | "attorney" | "prosecutor" | "case_manager";
      knowledge_item_status: "draft" | "in_review" | "published" | "retired";
      knowledge_review_area: "legal" | "wellbeing" | "lived_experience";
      knowledge_review_decision: "approved" | "changes_requested" | "rejected";
      knowledge_risk_class: "low" | "legal_sensitive" | "wellbeing_sensitive" | "critical";
      knowledge_source_type:
        | "law_or_rule"
        | "official_guidance"
        | "research"
        | "professional_practice"
        | "local_operations";
      organization_member_role:
        | "owner"
        | "admin"
        | "content_editor"
        | "legal_reviewer"
        | "wellbeing_reviewer"
        | "lived_experience_reviewer"
        | "legal_professional"
        | "advocate"
        | "case_worker"
        | "clinical_professional"
        | "justice_partner";
      organization_membership_status: "active" | "suspended";
      resource_category: "crisis" | "legal" | "local" | "court" | "accommodation";
      resource_status: "draft" | "published" | "retired";
      resource_verification_decision: "verified" | "needs_update";
      revision_entity: "statement" | "timeline_event";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {
      client_access_scope: [
        "logistics",
        "support_plan",
        "shared_statements",
        "shared_timeline",
        "shared_documents",
        "client_questions",
      ],
      client_access_status: ["pending", "active", "declined", "revoked", "expired"],
      content_visibility: ["shareable", "private"],
      court_plan_category: ["hearing_details", "travel", "accommodation", "support", "question"],
      court_plan_item_status: ["not_started", "in_progress", "done"],
      document_type: ["identification", "legal", "medical", "correspondence", "evidence", "other"],
      embedding_source: ["statement", "document"],
      flag_status: ["open", "reviewed", "resolved", "dismissed"],
      flag_type: ["gap", "inconsistency", "trauma", "other"],
      gatekeeper_role: ["advocate", "attorney", "prosecutor", "case_manager"],
      knowledge_item_status: ["draft", "in_review", "published", "retired"],
      knowledge_review_area: ["legal", "wellbeing", "lived_experience"],
      knowledge_review_decision: ["approved", "changes_requested", "rejected"],
      knowledge_risk_class: ["low", "legal_sensitive", "wellbeing_sensitive", "critical"],
      knowledge_source_type: [
        "law_or_rule",
        "official_guidance",
        "research",
        "professional_practice",
        "local_operations",
      ],
      organization_member_role: [
        "owner",
        "admin",
        "content_editor",
        "legal_reviewer",
        "wellbeing_reviewer",
        "lived_experience_reviewer",
        "legal_professional",
        "advocate",
        "case_worker",
        "clinical_professional",
        "justice_partner",
      ],
      organization_membership_status: ["active", "suspended"],
      resource_category: ["crisis", "legal", "local", "court", "accommodation"],
      resource_status: ["draft", "published", "retired"],
      resource_verification_decision: ["verified", "needs_update"],
      revision_entity: ["statement", "timeline_event"],
    },
  },
} as const;
