export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      commission_tiers: {
        Row: {
          bonus: number | null
          created_at: string
          id: string
          is_active: boolean | null
          label: string
          max_amount: number | null
          min_amount: number
          percentage: number
        }
        Insert: {
          bonus?: number | null
          created_at?: string
          id?: string
          is_active?: boolean | null
          label: string
          max_amount?: number | null
          min_amount: number
          percentage: number
        }
        Update: {
          bonus?: number | null
          created_at?: string
          id?: string
          is_active?: boolean | null
          label?: string
          max_amount?: number | null
          min_amount?: number
          percentage?: number
        }
        Relationships: []
      }
      email_logs: {
        Row: {
          created_at: string
          id: string
          organization_id: string
          sent_at: string
          status: string
          subject: string
          to_email: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          organization_id: string
          sent_at?: string
          status?: string
          subject: string
          to_email: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          organization_id?: string
          sent_at?: string
          status?: string
          subject?: string
          to_email?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "email_logs_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      maleta_items: {
        Row: {
          created_at: string
          id: string
          maleta_id: string
          name: string
          price: number
          product_id: number
          quantity: number
          sku: string
          status: string
          updated_at: string
          variation_attributes: Json | null
          variation_id: number | null
        }
        Insert: {
          created_at?: string
          id?: string
          maleta_id: string
          name: string
          price: number
          product_id: number
          quantity: number
          sku: string
          status?: string
          updated_at?: string
          variation_attributes?: Json | null
          variation_id?: number | null
        }
        Update: {
          created_at?: string
          id?: string
          maleta_id?: string
          name?: string
          price?: number
          product_id?: number
          quantity?: number
          sku?: string
          status?: string
          updated_at?: string
          variation_attributes?: Json | null
          variation_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "maleta_items_maleta_id_fkey"
            columns: ["maleta_id"]
            isOneToOne: false
            referencedRelation: "maletas"
            referencedColumns: ["id"]
          },
        ]
      }
      maleta_returns: {
        Row: {
          commission_amount: number | null
          created_at: string
          delay_days: number | null
          final_amount: number | null
          id: string
          items_returned: Json
          items_sold: Json
          maleta_id: string
          notes: string | null
          penalty_amount: number | null
          return_date: string
        }
        Insert: {
          commission_amount?: number | null
          created_at?: string
          delay_days?: number | null
          final_amount?: number | null
          id?: string
          items_returned?: Json
          items_sold?: Json
          maleta_id: string
          notes?: string | null
          penalty_amount?: number | null
          return_date?: string
        }
        Update: {
          commission_amount?: number | null
          created_at?: string
          delay_days?: number | null
          final_amount?: number | null
          id?: string
          items_returned?: Json
          items_sold?: Json
          maleta_id?: string
          notes?: string | null
          penalty_amount?: number | null
          return_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "maleta_returns_maleta_id_fkey"
            columns: ["maleta_id"]
            isOneToOne: false
            referencedRelation: "maletas"
            referencedColumns: ["id"]
          },
        ]
      }
      maletas: {
        Row: {
          commission_settings: Json | null
          created_at: string
          customer_email: string | null
          customer_name: string | null
          departure_date: string
          extended_date: string | null
          id: string
          notes: string | null
          number: string
          order_number: number | null
          order_url: string | null
          representative_id: string
          return_date: string
          status: string
          total_value: number | null
          updated_at: string
        }
        Insert: {
          commission_settings?: Json | null
          created_at?: string
          customer_email?: string | null
          customer_name?: string | null
          departure_date?: string
          extended_date?: string | null
          id?: string
          notes?: string | null
          number: string
          order_number?: number | null
          order_url?: string | null
          representative_id: string
          return_date: string
          status?: string
          total_value?: number | null
          updated_at?: string
        }
        Update: {
          commission_settings?: Json | null
          created_at?: string
          customer_email?: string | null
          customer_name?: string | null
          departure_date?: string
          extended_date?: string | null
          id?: string
          notes?: string | null
          number?: string
          order_number?: number | null
          order_url?: string | null
          representative_id?: string
          return_date?: string
          status?: string
          total_value?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "maletas_representative_id_fkey"
            columns: ["representative_id"]
            isOneToOne: false
            referencedRelation: "representatives"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_limits: {
        Row: {
          current_products: number
          current_stores: number
          current_users: number
          id: string
          organization_id: string
          updated_at: string
        }
        Insert: {
          current_products?: number
          current_stores?: number
          current_users?: number
          id?: string
          organization_id: string
          updated_at?: string
        }
        Update: {
          current_products?: number
          current_stores?: number
          current_users?: number
          id?: string
          organization_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_limits_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: true
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          asaas_customer_id: string | null
          created_at: string
          id: string
          name: string
          slug: string
          updated_at: string
        }
        Insert: {
          asaas_customer_id?: string | null
          created_at?: string
          id?: string
          name: string
          slug: string
          updated_at?: string
        }
        Update: {
          asaas_customer_id?: string | null
          created_at?: string
          id?: string
          name?: string
          slug?: string
          updated_at?: string
        }
        Relationships: []
      }
      payments: {
        Row: {
          amount: number
          asaas_payment_id: string
          created_at: string
          id: string
          payment_date: string | null
          status: string
          subscription_id: string
          updated_at: string
        }
        Insert: {
          amount: number
          asaas_payment_id: string
          created_at?: string
          id?: string
          payment_date?: string | null
          status: string
          subscription_id: string
          updated_at?: string
        }
        Update: {
          amount?: number
          asaas_payment_id?: string
          created_at?: string
          id?: string
          payment_date?: string | null
          status?: string
          subscription_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "subscriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      pdf_templates: {
        Row: {
          created_at: string
          css_styles: string | null
          format: string
          html_template: string
          id: string
          is_active: boolean | null
          is_default: boolean | null
          name: string
          settings: Json | null
          type: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          css_styles?: string | null
          format: string
          html_template: string
          id?: string
          is_active?: boolean | null
          is_default?: boolean | null
          name: string
          settings?: Json | null
          type: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          css_styles?: string | null
          format?: string
          html_template?: string
          id?: string
          is_active?: boolean | null
          is_default?: boolean | null
          name?: string
          settings?: Json | null
          type?: string
          updated_at?: string
        }
        Relationships: []
      }
      representatives: {
        Row: {
          commission_settings: Json | null
          created_at: string
          email: string
          id: string
          name: string
          phone: string | null
          referrer_id: string | null
          total_sales: number | null
          updated_at: string
        }
        Insert: {
          commission_settings?: Json | null
          created_at?: string
          email: string
          id?: string
          name: string
          phone?: string | null
          referrer_id?: string | null
          total_sales?: number | null
          updated_at?: string
        }
        Update: {
          commission_settings?: Json | null
          created_at?: string
          email?: string
          id?: string
          name?: string
          phone?: string | null
          referrer_id?: string | null
          total_sales?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "representatives_referrer_id_fkey"
            columns: ["referrer_id"]
            isOneToOne: false
            referencedRelation: "representatives"
            referencedColumns: ["id"]
          },
        ]
      }
      stock_history: {
        Row: {
          created_at: string
          id: string
          metadata: Json | null
          new_stock: number
          previous_stock: number
          product_id: number
          quantity_change: number
          reason: string | null
          source: string
          type: string
          user_id: string | null
          user_name: string | null
          variation_id: number | null
          wc_order_id: number | null
        }
        Insert: {
          created_at?: string
          id?: string
          metadata?: Json | null
          new_stock: number
          previous_stock: number
          product_id: number
          quantity_change: number
          reason?: string | null
          source?: string
          type: string
          user_id?: string | null
          user_name?: string | null
          variation_id?: number | null
          wc_order_id?: number | null
        }
        Update: {
          created_at?: string
          id?: string
          metadata?: Json | null
          new_stock?: number
          previous_stock?: number
          product_id?: number
          quantity_change?: number
          reason?: string | null
          source?: string
          type?: string
          user_id?: string | null
          user_name?: string | null
          variation_id?: number | null
          wc_order_id?: number | null
        }
        Relationships: []
      }
      subscription_plans: {
        Row: {
          created_at: string
          features: Json | null
          id: string
          max_products: number
          max_stores: number
          max_users: number
          name: string
          price_monthly: number
          type: Database["public"]["Enums"]["subscription_plan_type"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          features?: Json | null
          id?: string
          max_products?: number
          max_stores?: number
          max_users?: number
          name: string
          price_monthly?: number
          type: Database["public"]["Enums"]["subscription_plan_type"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          features?: Json | null
          id?: string
          max_products?: number
          max_stores?: number
          max_users?: number
          name?: string
          price_monthly?: number
          type?: Database["public"]["Enums"]["subscription_plan_type"]
          updated_at?: string
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          asaas_subscription_id: string | null
          cancel_at_period_end: boolean
          created_at: string
          current_period_end: string
          current_period_start: string
          id: string
          organization_id: string
          plan_id: string
          status: Database["public"]["Enums"]["subscription_status"]
          trial_ends_at: string | null
          updated_at: string
        }
        Insert: {
          asaas_subscription_id?: string | null
          cancel_at_period_end?: boolean
          created_at?: string
          current_period_end?: string
          current_period_start?: string
          id?: string
          organization_id: string
          plan_id: string
          status?: Database["public"]["Enums"]["subscription_status"]
          trial_ends_at?: string | null
          updated_at?: string
        }
        Update: {
          asaas_subscription_id?: string | null
          cancel_at_period_end?: boolean
          created_at?: string
          current_period_end?: string
          current_period_start?: string
          id?: string
          organization_id?: string
          plan_id?: string
          status?: Database["public"]["Enums"]["subscription_status"]
          trial_ends_at?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscriptions_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "subscription_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      user_organizations: {
        Row: {
          created_at: string
          id: string
          organization_id: string
          role: Database["public"]["Enums"]["user_role"]
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          organization_id: string
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          organization_id?: string
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_organizations_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      add_stock_history_entry: {
        Args: {
          p_product_id: number
          p_variation_id?: number
          p_type?: string
          p_quantity_change?: number
          p_previous_stock?: number
          p_new_stock?: number
          p_reason?: string
          p_source?: string
          p_user_id?: string
          p_user_name?: string
          p_wc_order_id?: number
          p_metadata?: Json
        }
        Returns: string
      }
      generate_maleta_number: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_user_organizations: {
        Args: { user_uuid?: string }
        Returns: string[]
      }
      user_belongs_to_organization: {
        Args: { org_id: string; user_uuid?: string }
        Returns: boolean
      }
    }
    Enums: {
      subscription_plan_type: "trial" | "basic" | "professional" | "enterprise"
      subscription_status:
        | "active"
        | "canceled"
        | "past_due"
        | "trialing"
        | "incomplete"
      user_role: "owner" | "admin" | "manager" | "user"
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
      subscription_plan_type: ["trial", "basic", "professional", "enterprise"],
      subscription_status: [
        "active",
        "canceled",
        "past_due",
        "trialing",
        "incomplete",
      ],
      user_role: ["owner", "admin", "manager", "user"],
    },
  },
} as const
