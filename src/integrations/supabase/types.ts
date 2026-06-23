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
      asset_computer_specs: {
        Row: {
          asset_id: string
          created_at: string
          hostname: string | null
          ip_address: unknown
          mac_address: unknown
          operating_system: string | null
          processor: string | null
          ram: string | null
          storage: string | null
          updated_at: string
        }
        Insert: {
          asset_id: string
          created_at?: string
          hostname?: string | null
          ip_address?: unknown
          mac_address?: unknown
          operating_system?: string | null
          processor?: string | null
          ram?: string | null
          storage?: string | null
          updated_at?: string
        }
        Update: {
          asset_id?: string
          created_at?: string
          hostname?: string | null
          ip_address?: unknown
          mac_address?: unknown
          operating_system?: string | null
          processor?: string | null
          ram?: string | null
          storage?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "asset_computer_specs_asset_id_fkey"
            columns: ["asset_id"]
            isOneToOne: true
            referencedRelation: "assets"
            referencedColumns: ["id"]
          },
        ]
      }
      asset_printer_specs: {
        Row: {
          asset_id: string
          color: boolean
          created_at: string
          network: boolean
          print_type: Database["public"]["Enums"]["print_type"] | null
          updated_at: string
        }
        Insert: {
          asset_id: string
          color?: boolean
          created_at?: string
          network?: boolean
          print_type?: Database["public"]["Enums"]["print_type"] | null
          updated_at?: string
        }
        Update: {
          asset_id?: string
          color?: boolean
          created_at?: string
          network?: boolean
          print_type?: Database["public"]["Enums"]["print_type"] | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "asset_printer_specs_asset_id_fkey"
            columns: ["asset_id"]
            isOneToOne: true
            referencedRelation: "assets"
            referencedColumns: ["id"]
          },
        ]
      }
      assets: {
        Row: {
          acquisition_date: string | null
          acquisition_value: number | null
          brand: string
          created_at: string
          id: string
          location_id: string | null
          model: string
          notes: string | null
          patrimony: string
          responsible_name: string | null
          responsible_profile_id: string | null
          sector_id: string | null
          serial_number: string
          status: Database["public"]["Enums"]["asset_status"]
          type: Database["public"]["Enums"]["asset_type"]
          updated_at: string
        }
        Insert: {
          acquisition_date?: string | null
          acquisition_value?: number | null
          brand: string
          created_at?: string
          id?: string
          location_id?: string | null
          model: string
          notes?: string | null
          patrimony: string
          responsible_name?: string | null
          responsible_profile_id?: string | null
          sector_id?: string | null
          serial_number: string
          status?: Database["public"]["Enums"]["asset_status"]
          type: Database["public"]["Enums"]["asset_type"]
          updated_at?: string
        }
        Update: {
          acquisition_date?: string | null
          acquisition_value?: number | null
          brand?: string
          created_at?: string
          id?: string
          location_id?: string | null
          model?: string
          notes?: string | null
          patrimony?: string
          responsible_name?: string | null
          responsible_profile_id?: string | null
          sector_id?: string | null
          serial_number?: string
          status?: Database["public"]["Enums"]["asset_status"]
          type?: Database["public"]["Enums"]["asset_type"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "assets_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assets_responsible_profile_id_fkey"
            columns: ["responsible_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assets_sector_id_fkey"
            columns: ["sector_id"]
            isOneToOne: false
            referencedRelation: "sectors"
            referencedColumns: ["id"]
          },
        ]
      }
      locations: {
        Row: {
          created_at: string
          descricao: string | null
          endereco: string | null
          id: string
          nome: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          descricao?: string | null
          endereco?: string | null
          id?: string
          nome: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          descricao?: string | null
          endereco?: string | null
          id?: string
          nome?: string
          updated_at?: string
        }
        Relationships: []
      }
      maintenances: {
        Row: {
          asset_id: string
          created_at: string
          custo: number | null
          data_fim: string | null
          data_inicio: string
          descricao: string
          id: string
          observacoes: string | null
          status: Database["public"]["Enums"]["maintenance_status"]
          tecnico: string | null
          tipo: string
          updated_at: string
        }
        Insert: {
          asset_id: string
          created_at?: string
          custo?: number | null
          data_fim?: string | null
          data_inicio?: string
          descricao: string
          id?: string
          observacoes?: string | null
          status?: Database["public"]["Enums"]["maintenance_status"]
          tecnico?: string | null
          tipo: string
          updated_at?: string
        }
        Update: {
          asset_id?: string
          created_at?: string
          custo?: number | null
          data_fim?: string | null
          data_inicio?: string
          descricao?: string
          id?: string
          observacoes?: string | null
          status?: Database["public"]["Enums"]["maintenance_status"]
          tecnico?: string | null
          tipo?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "maintenances_asset_id_fkey"
            columns: ["asset_id"]
            isOneToOne: false
            referencedRelation: "assets"
            referencedColumns: ["id"]
          },
        ]
      }
      movements: {
        Row: {
          asset_id: string
          created_at: string
          data: string
          executed_by: string | null
          from_location_id: string | null
          from_responsible_id: string | null
          id: string
          motivo: string | null
          observacoes: string | null
          tipo: Database["public"]["Enums"]["movement_type"]
          to_location_id: string | null
          to_responsible_id: string | null
        }
        Insert: {
          asset_id: string
          created_at?: string
          data?: string
          executed_by?: string | null
          from_location_id?: string | null
          from_responsible_id?: string | null
          id?: string
          motivo?: string | null
          observacoes?: string | null
          tipo: Database["public"]["Enums"]["movement_type"]
          to_location_id?: string | null
          to_responsible_id?: string | null
        }
        Update: {
          asset_id?: string
          created_at?: string
          data?: string
          executed_by?: string | null
          from_location_id?: string | null
          from_responsible_id?: string | null
          id?: string
          motivo?: string | null
          observacoes?: string | null
          tipo?: Database["public"]["Enums"]["movement_type"]
          to_location_id?: string | null
          to_responsible_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "movements_asset_id_fkey"
            columns: ["asset_id"]
            isOneToOne: false
            referencedRelation: "assets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "movements_executed_by_fkey"
            columns: ["executed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "movements_from_location_id_fkey"
            columns: ["from_location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "movements_from_responsible_id_fkey"
            columns: ["from_responsible_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "movements_to_location_id_fkey"
            columns: ["to_location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "movements_to_responsible_id_fkey"
            columns: ["to_responsible_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          active: boolean
          created_at: string
          email: string
          id: string
          last_login: string | null
          nome: string
          updated_at: string
          user_id: string
          username: string | null
        }
        Insert: {
          active?: boolean
          created_at?: string
          email: string
          id?: string
          last_login?: string | null
          nome: string
          updated_at?: string
          user_id: string
          username?: string | null
        }
        Update: {
          active?: boolean
          created_at?: string
          email?: string
          id?: string
          last_login?: string | null
          nome?: string
          updated_at?: string
          user_id?: string
          username?: string | null
        }
        Relationships: []
      }
      role_audit_log: {
        Row: {
          changed_by: string
          created_at: string
          id: string
          new_role: Database["public"]["Enums"]["app_role"]
          previous_role: Database["public"]["Enums"]["app_role"] | null
          target_user_id: string
        }
        Insert: {
          changed_by: string
          created_at?: string
          id?: string
          new_role: Database["public"]["Enums"]["app_role"]
          previous_role?: Database["public"]["Enums"]["app_role"] | null
          target_user_id: string
        }
        Update: {
          changed_by?: string
          created_at?: string
          id?: string
          new_role?: Database["public"]["Enums"]["app_role"]
          previous_role?: Database["public"]["Enums"]["app_role"] | null
          target_user_id?: string
        }
        Relationships: []
      }
      sectors: {
        Row: {
          created_at: string
          id: string
          nome: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          nome: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          nome?: string
          updated_at?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      count_active_admins: { Args: never; Returns: number }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "gerente" | "usuario"
      asset_status: "em_uso" | "estoque" | "manutencao" | "baixado"
      asset_type: "computador" | "notebook" | "impressora"
      maintenance_status: "aberta" | "em_andamento" | "concluida" | "cancelada"
      movement_type:
        | "entrada"
        | "saida"
        | "transferencia"
        | "manutencao"
        | "baixa"
      print_type: "laser" | "jato_tinta" | "termica" | "matricial"
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
      app_role: ["admin", "gerente", "usuario"],
      asset_status: ["em_uso", "estoque", "manutencao", "baixado"],
      asset_type: ["computador", "notebook", "impressora"],
      maintenance_status: ["aberta", "em_andamento", "concluida", "cancelada"],
      movement_type: [
        "entrada",
        "saida",
        "transferencia",
        "manutencao",
        "baixa",
      ],
      print_type: ["laser", "jato_tinta", "termica", "matricial"],
    },
  },
} as const
