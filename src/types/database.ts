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
      approval_requests: {
        Row: {
          company_id: string
          created_at: string
          id: string
          outlet_id: string | null
          reason: string | null
          request_type: string
          requested_by: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          source_id: string
          source_type: string
          status: Database["public"]["Enums"]["approval_status"]
        }
        Insert: {
          company_id: string
          created_at?: string
          id?: string
          outlet_id?: string | null
          reason?: string | null
          request_type: string
          requested_by?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          source_id: string
          source_type: string
          status?: Database["public"]["Enums"]["approval_status"]
        }
        Update: {
          company_id?: string
          created_at?: string
          id?: string
          outlet_id?: string | null
          reason?: string | null
          request_type?: string
          requested_by?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          source_id?: string
          source_type?: string
          status?: Database["public"]["Enums"]["approval_status"]
        }
        Relationships: [
          {
            foreignKeyName: "approval_requests_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "approval_requests_outlet_id_fkey"
            columns: ["outlet_id"]
            isOneToOne: false
            referencedRelation: "outlets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "approval_requests_requested_by_fkey"
            columns: ["requested_by"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "approval_requests_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          action: string
          actor_id: string | null
          company_id: string
          created_at: string
          entity_id: string | null
          entity_type: string
          id: string
          metadata: Json
        }
        Insert: {
          action: string
          actor_id?: string | null
          company_id: string
          created_at?: string
          entity_id?: string | null
          entity_type: string
          id?: string
          metadata?: Json
        }
        Update: {
          action?: string
          actor_id?: string | null
          company_id?: string
          created_at?: string
          entity_id?: string | null
          entity_type?: string
          id?: string
          metadata?: Json
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "audit_logs_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      brands: {
        Row: {
          company_id: string
          created_at: string
          id: string
          name: string
          slug: string
        }
        Insert: {
          company_id: string
          created_at?: string
          id?: string
          name: string
          slug: string
        }
        Update: {
          company_id?: string
          created_at?: string
          id?: string
          name?: string
          slug?: string
        }
        Relationships: [
          {
            foreignKeyName: "brands_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      companies: {
        Row: {
          accent_color: string | null
          code: string
          created_at: string
          id: string
          name: string
          slug: string
          updated_at: string
        }
        Insert: {
          accent_color?: string | null
          code: string
          created_at?: string
          id?: string
          name: string
          slug: string
          updated_at?: string
        }
        Update: {
          accent_color?: string | null
          code?: string
          created_at?: string
          id?: string
          name?: string
          slug?: string
          updated_at?: string
        }
        Relationships: []
      }
      customers: {
        Row: {
          birthday: string | null
          brand_id: string | null
          company_id: string
          created_at: string
          email: string | null
          email_opt_in: boolean
          id: string
          name: string | null
          notes: string | null
          phone: string | null
          tags: string[]
          updated_at: string
          whatsapp_opt_in: boolean
        }
        Insert: {
          birthday?: string | null
          brand_id?: string | null
          company_id: string
          created_at?: string
          email?: string | null
          email_opt_in?: boolean
          id?: string
          name?: string | null
          notes?: string | null
          phone?: string | null
          tags?: string[]
          updated_at?: string
          whatsapp_opt_in?: boolean
        }
        Update: {
          birthday?: string | null
          brand_id?: string | null
          company_id?: string
          created_at?: string
          email?: string | null
          email_opt_in?: boolean
          id?: string
          name?: string | null
          notes?: string | null
          phone?: string | null
          tags?: string[]
          updated_at?: string
          whatsapp_opt_in?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "customers_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customers_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      fifo_cost_layers: {
        Row: {
          batch_code: string | null
          company_id: string
          created_at: string
          expires_at: string | null
          id: string
          inventory_item_id: string
          outlet_id: string | null
          quantity_received: number
          quantity_remaining: number
          received_at: string
          source_id: string | null
          source_type: string | null
          unit_cost: number
          warehouse_id: string | null
        }
        Insert: {
          batch_code?: string | null
          company_id: string
          created_at?: string
          expires_at?: string | null
          id?: string
          inventory_item_id: string
          outlet_id?: string | null
          quantity_received: number
          quantity_remaining: number
          received_at?: string
          source_id?: string | null
          source_type?: string | null
          unit_cost: number
          warehouse_id?: string | null
        }
        Update: {
          batch_code?: string | null
          company_id?: string
          created_at?: string
          expires_at?: string | null
          id?: string
          inventory_item_id?: string
          outlet_id?: string | null
          quantity_received?: number
          quantity_remaining?: number
          received_at?: string
          source_id?: string | null
          source_type?: string | null
          unit_cost?: number
          warehouse_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fifo_cost_layers_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fifo_cost_layers_inventory_item_id_fkey"
            columns: ["inventory_item_id"]
            isOneToOne: false
            referencedRelation: "inventory_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fifo_cost_layers_outlet_id_fkey"
            columns: ["outlet_id"]
            isOneToOne: false
            referencedRelation: "outlets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fifo_cost_layers_warehouse_id_fkey"
            columns: ["warehouse_id"]
            isOneToOne: false
            referencedRelation: "warehouses"
            referencedColumns: ["id"]
          },
        ]
      }
      held_orders: {
        Row: {
          cashier_id: string
          company_id: string
          created_at: string
          id: string
          label: string | null
          local_id: string | null
          outlet_id: string
          payload: Json
        }
        Insert: {
          cashier_id: string
          company_id: string
          created_at?: string
          id?: string
          label?: string | null
          local_id?: string | null
          outlet_id: string
          payload?: Json
        }
        Update: {
          cashier_id?: string
          company_id?: string
          created_at?: string
          id?: string
          label?: string | null
          local_id?: string | null
          outlet_id?: string
          payload?: Json
        }
        Relationships: [
          {
            foreignKeyName: "held_orders_cashier_id_fkey"
            columns: ["cashier_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "held_orders_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "held_orders_outlet_id_fkey"
            columns: ["outlet_id"]
            isOneToOne: false
            referencedRelation: "outlets"
            referencedColumns: ["id"]
          },
        ]
      }
      integration_settings: {
        Row: {
          company_id: string
          config: Json
          created_at: string
          id: string
          is_enabled: boolean
          provider: string
          updated_at: string
        }
        Insert: {
          company_id: string
          config?: Json
          created_at?: string
          id?: string
          is_enabled?: boolean
          provider: string
          updated_at?: string
        }
        Update: {
          company_id?: string
          config?: Json
          created_at?: string
          id?: string
          is_enabled?: boolean
          provider?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "integration_settings_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_items: {
        Row: {
          barcode: string | null
          base_unit: string
          category_id: string | null
          company_id: string
          created_at: string
          fifo_costing: boolean
          id: string
          is_active: boolean
          name: string
          purchase_to_base_factor: number | null
          purchase_unit: string | null
          reorder_point: number | null
          sku: string
          track_expiry: boolean
          track_stock: boolean
          type: Database["public"]["Enums"]["inventory_item_type"]
          updated_at: string
        }
        Insert: {
          barcode?: string | null
          base_unit: string
          category_id?: string | null
          company_id: string
          created_at?: string
          fifo_costing?: boolean
          id?: string
          is_active?: boolean
          name: string
          purchase_to_base_factor?: number | null
          purchase_unit?: string | null
          reorder_point?: number | null
          sku: string
          track_expiry?: boolean
          track_stock?: boolean
          type: Database["public"]["Enums"]["inventory_item_type"]
          updated_at?: string
        }
        Update: {
          barcode?: string | null
          base_unit?: string
          category_id?: string | null
          company_id?: string
          created_at?: string
          fifo_costing?: boolean
          id?: string
          is_active?: boolean
          name?: string
          purchase_to_base_factor?: number | null
          purchase_unit?: string | null
          reorder_point?: number | null
          sku?: string
          track_expiry?: boolean
          track_stock?: boolean
          type?: Database["public"]["Enums"]["inventory_item_type"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "inventory_items_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "product_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_items_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      invoice_delivery_logs: {
        Row: {
          channel: Database["public"]["Enums"]["delivery_channel"]
          company_id: string
          created_at: string
          customer_id: string | null
          error_message: string | null
          id: string
          provider_message_id: string | null
          recipient: string
          sent_by: string | null
          status: Database["public"]["Enums"]["delivery_status"]
          transaction_id: string
          updated_at: string
        }
        Insert: {
          channel: Database["public"]["Enums"]["delivery_channel"]
          company_id: string
          created_at?: string
          customer_id?: string | null
          error_message?: string | null
          id?: string
          provider_message_id?: string | null
          recipient: string
          sent_by?: string | null
          status?: Database["public"]["Enums"]["delivery_status"]
          transaction_id: string
          updated_at?: string
        }
        Update: {
          channel?: Database["public"]["Enums"]["delivery_channel"]
          company_id?: string
          created_at?: string
          customer_id?: string | null
          error_message?: string | null
          id?: string
          provider_message_id?: string | null
          recipient?: string
          sent_by?: string | null
          status?: Database["public"]["Enums"]["delivery_status"]
          transaction_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "invoice_delivery_logs_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoice_delivery_logs_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoice_delivery_logs_sent_by_fkey"
            columns: ["sent_by"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoice_delivery_logs_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      modifier_groups: {
        Row: {
          company_id: string
          id: string
          max_select: number
          min_select: number
          name: string
        }
        Insert: {
          company_id: string
          id?: string
          max_select?: number
          min_select?: number
          name: string
        }
        Update: {
          company_id?: string
          id?: string
          max_select?: number
          min_select?: number
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "modifier_groups_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      modifiers: {
        Row: {
          company_id: string
          id: string
          is_active: boolean
          modifier_group_id: string
          name: string
          price_delta: number
        }
        Insert: {
          company_id: string
          id?: string
          is_active?: boolean
          modifier_group_id: string
          name: string
          price_delta?: number
        }
        Update: {
          company_id?: string
          id?: string
          is_active?: boolean
          modifier_group_id?: string
          name?: string
          price_delta?: number
        }
        Relationships: [
          {
            foreignKeyName: "modifiers_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "modifiers_modifier_group_id_fkey"
            columns: ["modifier_group_id"]
            isOneToOne: false
            referencedRelation: "modifier_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      outlets: {
        Row: {
          address: string | null
          brand_id: string | null
          code: string
          company_id: string
          created_at: string
          id: string
          is_active: boolean
          name: string
          timezone: string
        }
        Insert: {
          address?: string | null
          brand_id?: string | null
          code: string
          company_id: string
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          timezone?: string
        }
        Update: {
          address?: string | null
          brand_id?: string | null
          code?: string
          company_id?: string
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          timezone?: string
        }
        Relationships: [
          {
            foreignKeyName: "outlets_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "outlets_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount: number
          company_id: string
          created_at: string
          id: string
          method: string
          reference: string | null
          transaction_id: string
        }
        Insert: {
          amount: number
          company_id: string
          created_at?: string
          id?: string
          method: string
          reference?: string | null
          transaction_id: string
        }
        Update: {
          amount?: number
          company_id?: string
          created_at?: string
          id?: string
          method?: string
          reference?: string | null
          transaction_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      permissions: {
        Row: {
          description: string
          key: string
        }
        Insert: {
          description: string
          key: string
        }
        Update: {
          description?: string
          key?: string
        }
        Relationships: []
      }
      pos_sessions: {
        Row: {
          closed_at: string | null
          closed_by: string | null
          closing_cash: number | null
          company_id: string
          device_id: string | null
          id: string
          opened_at: string
          opened_by: string
          opening_cash: number
          outlet_id: string
          register_id: string | null
          status: string
        }
        Insert: {
          closed_at?: string | null
          closed_by?: string | null
          closing_cash?: number | null
          company_id: string
          device_id?: string | null
          id?: string
          opened_at?: string
          opened_by: string
          opening_cash?: number
          outlet_id: string
          register_id?: string | null
          status?: string
        }
        Update: {
          closed_at?: string | null
          closed_by?: string | null
          closing_cash?: number | null
          company_id?: string
          device_id?: string | null
          id?: string
          opened_at?: string
          opened_by?: string
          opening_cash?: number
          outlet_id?: string
          register_id?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "pos_sessions_closed_by_fkey"
            columns: ["closed_by"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pos_sessions_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pos_sessions_opened_by_fkey"
            columns: ["opened_by"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pos_sessions_outlet_id_fkey"
            columns: ["outlet_id"]
            isOneToOne: false
            referencedRelation: "outlets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pos_sessions_register_id_fkey"
            columns: ["register_id"]
            isOneToOne: false
            referencedRelation: "registers"
            referencedColumns: ["id"]
          },
        ]
      }
      print_settings: {
        Row: {
          company_id: string
          esc_pos_mode: string | null
          id: string
          outlet_id: string | null
          printer_name: string | null
          updated_at: string
          use_qz_tray: boolean
        }
        Insert: {
          company_id: string
          esc_pos_mode?: string | null
          id?: string
          outlet_id?: string | null
          printer_name?: string | null
          updated_at?: string
          use_qz_tray?: boolean
        }
        Update: {
          company_id?: string
          esc_pos_mode?: string | null
          id?: string
          outlet_id?: string | null
          printer_name?: string | null
          updated_at?: string
          use_qz_tray?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "print_settings_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "print_settings_outlet_id_fkey"
            columns: ["outlet_id"]
            isOneToOne: false
            referencedRelation: "outlets"
            referencedColumns: ["id"]
          },
        ]
      }
      product_categories: {
        Row: {
          company_id: string
          created_at: string
          id: string
          name: string
          sort_order: number
        }
        Insert: {
          company_id: string
          created_at?: string
          id?: string
          name: string
          sort_order?: number
        }
        Update: {
          company_id?: string
          created_at?: string
          id?: string
          name?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "product_categories_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      product_modifier_groups: {
        Row: {
          modifier_group_id: string
          product_id: string
        }
        Insert: {
          modifier_group_id: string
          product_id: string
        }
        Update: {
          modifier_group_id?: string
          product_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_modifier_groups_modifier_group_id_fkey"
            columns: ["modifier_group_id"]
            isOneToOne: false
            referencedRelation: "modifier_groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_modifier_groups_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_variants: {
        Row: {
          company_id: string
          id: string
          is_active: boolean
          name: string
          price_delta: number
          product_id: string
          sku: string
        }
        Insert: {
          company_id: string
          id?: string
          is_active?: boolean
          name: string
          price_delta?: number
          product_id: string
          sku: string
        }
        Update: {
          company_id?: string
          id?: string
          is_active?: boolean
          name?: string
          price_delta?: number
          product_id?: string
          sku?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_variants_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_variants_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          barcode: string | null
          category_id: string | null
          company_id: string
          created_at: string
          description: string | null
          id: string
          inventory_item_id: string | null
          is_active: boolean
          is_recipe_based: boolean
          name: string
          price: number
          sku: string
          tax_rate: number
          updated_at: string
        }
        Insert: {
          barcode?: string | null
          category_id?: string | null
          company_id: string
          created_at?: string
          description?: string | null
          id?: string
          inventory_item_id?: string | null
          is_active?: boolean
          is_recipe_based?: boolean
          name: string
          price?: number
          sku: string
          tax_rate?: number
          updated_at?: string
        }
        Update: {
          barcode?: string | null
          category_id?: string | null
          company_id?: string
          created_at?: string
          description?: string | null
          id?: string
          inventory_item_id?: string | null
          is_active?: boolean
          is_recipe_based?: boolean
          name?: string
          price?: number
          sku?: string
          tax_rate?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "product_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_inventory_item_id_fkey"
            columns: ["inventory_item_id"]
            isOneToOne: false
            referencedRelation: "inventory_items"
            referencedColumns: ["id"]
          },
        ]
      }
      receipt_logs: {
        Row: {
          company_id: string
          created_at: string
          error_message: string | null
          id: string
          printer_name: string | null
          status: string
          transaction_id: string
          user_id: string | null
        }
        Insert: {
          company_id: string
          created_at?: string
          error_message?: string | null
          id?: string
          printer_name?: string | null
          status: string
          transaction_id: string
          user_id?: string | null
        }
        Update: {
          company_id?: string
          created_at?: string
          error_message?: string | null
          id?: string
          printer_name?: string | null
          status?: string
          transaction_id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "receipt_logs_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "receipt_logs_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "transactions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "receipt_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      receipt_settings: {
        Row: {
          auto_cut: boolean
          company_id: string
          copy_count: number
          footer_text: string | null
          id: string
          logo_url: string | null
          paper_width_mm: number
          store_name: string
          tax_number: string | null
          updated_at: string
        }
        Insert: {
          auto_cut?: boolean
          company_id: string
          copy_count?: number
          footer_text?: string | null
          id?: string
          logo_url?: string | null
          paper_width_mm?: number
          store_name: string
          tax_number?: string | null
          updated_at?: string
        }
        Update: {
          auto_cut?: boolean
          company_id?: string
          copy_count?: number
          footer_text?: string | null
          id?: string
          logo_url?: string | null
          paper_width_mm?: number
          store_name?: string
          tax_number?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "receipt_settings_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: true
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      recipe_byproducts: {
        Row: {
          company_id: string
          conversion_to_base_factor: number
          cost_allocation_percent: number
          expiry_days: number
          id: string
          inventory_item_id: string
          quantity: number
          recipe_id: string
          unit: string
        }
        Insert: {
          company_id: string
          conversion_to_base_factor?: number
          cost_allocation_percent?: number
          expiry_days: number
          id?: string
          inventory_item_id: string
          quantity: number
          recipe_id: string
          unit: string
        }
        Update: {
          company_id?: string
          conversion_to_base_factor?: number
          cost_allocation_percent?: number
          expiry_days?: number
          id?: string
          inventory_item_id?: string
          quantity?: number
          recipe_id?: string
          unit?: string
        }
        Relationships: [
          {
            foreignKeyName: "recipe_byproducts_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recipe_byproducts_inventory_item_id_fkey"
            columns: ["inventory_item_id"]
            isOneToOne: false
            referencedRelation: "inventory_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recipe_byproducts_recipe_id_fkey"
            columns: ["recipe_id"]
            isOneToOne: false
            referencedRelation: "recipes"
            referencedColumns: ["id"]
          },
        ]
      }
      recipe_items: {
        Row: {
          company_id: string
          conversion_to_base_factor: number
          id: string
          inventory_item_id: string
          is_optional: boolean
          modifier_id: string | null
          quantity: number
          recipe_id: string
          unit: string
        }
        Insert: {
          company_id: string
          conversion_to_base_factor?: number
          id?: string
          inventory_item_id: string
          is_optional?: boolean
          modifier_id?: string | null
          quantity: number
          recipe_id: string
          unit: string
        }
        Update: {
          company_id?: string
          conversion_to_base_factor?: number
          id?: string
          inventory_item_id?: string
          is_optional?: boolean
          modifier_id?: string | null
          quantity?: number
          recipe_id?: string
          unit?: string
        }
        Relationships: [
          {
            foreignKeyName: "recipe_items_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recipe_items_inventory_item_id_fkey"
            columns: ["inventory_item_id"]
            isOneToOne: false
            referencedRelation: "inventory_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recipe_items_modifier_id_fkey"
            columns: ["modifier_id"]
            isOneToOne: false
            referencedRelation: "modifiers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recipe_items_recipe_id_fkey"
            columns: ["recipe_id"]
            isOneToOne: false
            referencedRelation: "recipes"
            referencedColumns: ["id"]
          },
        ]
      }
      recipes: {
        Row: {
          company_id: string
          created_at: string
          id: string
          is_active: boolean
          name: string
          output_quantity: number
          output_unit: string
          product_id: string | null
          product_variant_id: string | null
          version: number
          yield_factor: number
        }
        Insert: {
          company_id: string
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          output_quantity?: number
          output_unit?: string
          product_id?: string | null
          product_variant_id?: string | null
          version?: number
          yield_factor?: number
        }
        Update: {
          company_id?: string
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          output_quantity?: number
          output_unit?: string
          product_id?: string | null
          product_variant_id?: string | null
          version?: number
          yield_factor?: number
        }
        Relationships: [
          {
            foreignKeyName: "recipes_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recipes_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recipes_product_variant_id_fkey"
            columns: ["product_variant_id"]
            isOneToOne: false
            referencedRelation: "product_variants"
            referencedColumns: ["id"]
          },
        ]
      }
      registers: {
        Row: {
          company_id: string
          created_at: string
          device_id: string | null
          id: string
          is_active: boolean
          name: string
          outlet_id: string
        }
        Insert: {
          company_id: string
          created_at?: string
          device_id?: string | null
          id?: string
          is_active?: boolean
          name: string
          outlet_id: string
        }
        Update: {
          company_id?: string
          created_at?: string
          device_id?: string | null
          id?: string
          is_active?: boolean
          name?: string
          outlet_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "registers_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "registers_outlet_id_fkey"
            columns: ["outlet_id"]
            isOneToOne: false
            referencedRelation: "outlets"
            referencedColumns: ["id"]
          },
        ]
      }
      role_permissions: {
        Row: {
          permission_key: string
          role: Database["public"]["Enums"]["app_role"]
        }
        Insert: {
          permission_key: string
          role: Database["public"]["Enums"]["app_role"]
        }
        Update: {
          permission_key?: string
          role?: Database["public"]["Enums"]["app_role"]
        }
        Relationships: [
          {
            foreignKeyName: "role_permissions_permission_key_fkey"
            columns: ["permission_key"]
            isOneToOne: false
            referencedRelation: "permissions"
            referencedColumns: ["key"]
          },
        ]
      }
      stock_count_items: {
        Row: {
          company_id: string
          counted_quantity: number
          expected_quantity: number
          id: string
          inventory_item_id: string
          reason: string | null
          stock_count_id: string
          variance_quantity: number | null
        }
        Insert: {
          company_id: string
          counted_quantity: number
          expected_quantity: number
          id?: string
          inventory_item_id: string
          reason?: string | null
          stock_count_id: string
          variance_quantity?: number | null
        }
        Update: {
          company_id?: string
          counted_quantity?: number
          expected_quantity?: number
          id?: string
          inventory_item_id?: string
          reason?: string | null
          stock_count_id?: string
          variance_quantity?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "stock_count_items_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_count_items_inventory_item_id_fkey"
            columns: ["inventory_item_id"]
            isOneToOne: false
            referencedRelation: "inventory_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_count_items_stock_count_id_fkey"
            columns: ["stock_count_id"]
            isOneToOne: false
            referencedRelation: "stock_counts"
            referencedColumns: ["id"]
          },
        ]
      }
      stock_counts: {
        Row: {
          company_id: string
          counted_by: string | null
          created_at: string
          id: string
          outlet_id: string
          pos_session_id: string | null
          status: string
          submitted_at: string | null
          warehouse_id: string | null
        }
        Insert: {
          company_id: string
          counted_by?: string | null
          created_at?: string
          id?: string
          outlet_id: string
          pos_session_id?: string | null
          status?: string
          submitted_at?: string | null
          warehouse_id?: string | null
        }
        Update: {
          company_id?: string
          counted_by?: string | null
          created_at?: string
          id?: string
          outlet_id?: string
          pos_session_id?: string | null
          status?: string
          submitted_at?: string | null
          warehouse_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "stock_counts_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_counts_counted_by_fkey"
            columns: ["counted_by"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_counts_outlet_id_fkey"
            columns: ["outlet_id"]
            isOneToOne: false
            referencedRelation: "outlets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_counts_pos_session_id_fkey"
            columns: ["pos_session_id"]
            isOneToOne: false
            referencedRelation: "pos_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_counts_warehouse_id_fkey"
            columns: ["warehouse_id"]
            isOneToOne: false
            referencedRelation: "warehouses"
            referencedColumns: ["id"]
          },
        ]
      }
      stock_ledger: {
        Row: {
          batch_code: string | null
          company_id: string
          created_at: string
          created_by: string | null
          expires_at: string | null
          fifo_cost_layer_id: string | null
          id: string
          inventory_item_id: string
          movement_type: Database["public"]["Enums"]["stock_movement_type"]
          notes: string | null
          outlet_id: string | null
          quantity_delta: number
          source_id: string | null
          source_type: string
          total_cost: number | null
          unit: string
          unit_cost: number | null
          warehouse_id: string | null
        }
        Insert: {
          batch_code?: string | null
          company_id: string
          created_at?: string
          created_by?: string | null
          expires_at?: string | null
          fifo_cost_layer_id?: string | null
          id?: string
          inventory_item_id: string
          movement_type: Database["public"]["Enums"]["stock_movement_type"]
          notes?: string | null
          outlet_id?: string | null
          quantity_delta: number
          source_id?: string | null
          source_type: string
          total_cost?: number | null
          unit: string
          unit_cost?: number | null
          warehouse_id?: string | null
        }
        Update: {
          batch_code?: string | null
          company_id?: string
          created_at?: string
          created_by?: string | null
          expires_at?: string | null
          fifo_cost_layer_id?: string | null
          id?: string
          inventory_item_id?: string
          movement_type?: Database["public"]["Enums"]["stock_movement_type"]
          notes?: string | null
          outlet_id?: string | null
          quantity_delta?: number
          source_id?: string | null
          source_type?: string
          total_cost?: number | null
          unit?: string
          unit_cost?: number | null
          warehouse_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "stock_ledger_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_ledger_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_ledger_fifo_cost_layer_id_fkey"
            columns: ["fifo_cost_layer_id"]
            isOneToOne: false
            referencedRelation: "fifo_cost_layers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_ledger_inventory_item_id_fkey"
            columns: ["inventory_item_id"]
            isOneToOne: false
            referencedRelation: "inventory_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_ledger_outlet_id_fkey"
            columns: ["outlet_id"]
            isOneToOne: false
            referencedRelation: "outlets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_ledger_warehouse_id_fkey"
            columns: ["warehouse_id"]
            isOneToOne: false
            referencedRelation: "warehouses"
            referencedColumns: ["id"]
          },
        ]
      }
      transaction_item_modifiers: {
        Row: {
          company_id: string
          id: string
          modifier_id: string
          price_delta: number
          transaction_item_id: string
        }
        Insert: {
          company_id: string
          id?: string
          modifier_id: string
          price_delta?: number
          transaction_item_id: string
        }
        Update: {
          company_id?: string
          id?: string
          modifier_id?: string
          price_delta?: number
          transaction_item_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "transaction_item_modifiers_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transaction_item_modifiers_modifier_id_fkey"
            columns: ["modifier_id"]
            isOneToOne: false
            referencedRelation: "modifiers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transaction_item_modifiers_transaction_item_id_fkey"
            columns: ["transaction_item_id"]
            isOneToOne: false
            referencedRelation: "transaction_items"
            referencedColumns: ["id"]
          },
        ]
      }
      transaction_items: {
        Row: {
          company_id: string
          discount_amount: number
          fifo_cogs: number
          id: string
          line_total: number
          notes: string | null
          product_id: string
          product_variant_id: string | null
          quantity: number
          recipe_id: string | null
          recipe_version: number | null
          tax_amount: number
          transaction_id: string
          unit_price: number
        }
        Insert: {
          company_id: string
          discount_amount?: number
          fifo_cogs?: number
          id?: string
          line_total: number
          notes?: string | null
          product_id: string
          product_variant_id?: string | null
          quantity: number
          recipe_id?: string | null
          recipe_version?: number | null
          tax_amount?: number
          transaction_id: string
          unit_price: number
        }
        Update: {
          company_id?: string
          discount_amount?: number
          fifo_cogs?: number
          id?: string
          line_total?: number
          notes?: string | null
          product_id?: string
          product_variant_id?: string | null
          quantity?: number
          recipe_id?: string | null
          recipe_version?: number | null
          tax_amount?: number
          transaction_id?: string
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "transaction_items_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transaction_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transaction_items_product_variant_id_fkey"
            columns: ["product_variant_id"]
            isOneToOne: false
            referencedRelation: "product_variants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transaction_items_recipe_id_fkey"
            columns: ["recipe_id"]
            isOneToOne: false
            referencedRelation: "recipes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transaction_items_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      transactions: {
        Row: {
          cashier_id: string
          company_id: string
          completed_at: string | null
          created_at: string
          customer_id: string | null
          discount_total: number
          fifo_cogs_total: number
          id: string
          local_id: string | null
          outlet_id: string
          pos_session_id: string | null
          receipt_number: string
          status: Database["public"]["Enums"]["transaction_status"]
          subtotal: number
          sync_metadata: Json
          sync_status: string
          tax_total: number
          total: number
        }
        Insert: {
          cashier_id: string
          company_id: string
          completed_at?: string | null
          created_at?: string
          customer_id?: string | null
          discount_total?: number
          fifo_cogs_total?: number
          id?: string
          local_id?: string | null
          outlet_id: string
          pos_session_id?: string | null
          receipt_number: string
          status?: Database["public"]["Enums"]["transaction_status"]
          subtotal?: number
          sync_metadata?: Json
          sync_status?: string
          tax_total?: number
          total?: number
        }
        Update: {
          cashier_id?: string
          company_id?: string
          completed_at?: string | null
          created_at?: string
          customer_id?: string | null
          discount_total?: number
          fifo_cogs_total?: number
          id?: string
          local_id?: string | null
          outlet_id?: string
          pos_session_id?: string | null
          receipt_number?: string
          status?: Database["public"]["Enums"]["transaction_status"]
          subtotal?: number
          sync_metadata?: Json
          sync_status?: string
          tax_total?: number
          total?: number
        }
        Relationships: [
          {
            foreignKeyName: "transactions_cashier_id_fkey"
            columns: ["cashier_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_outlet_id_fkey"
            columns: ["outlet_id"]
            isOneToOne: false
            referencedRelation: "outlets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_pos_session_id_fkey"
            columns: ["pos_session_id"]
            isOneToOne: false
            referencedRelation: "pos_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      user_invites: {
        Row: {
          accepted_at: string | null
          company_id: string
          created_at: string
          email: string
          expires_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          token: string
          username: string
        }
        Insert: {
          accepted_at?: string | null
          company_id: string
          created_at?: string
          email: string
          expires_at: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          token: string
          username: string
        }
        Update: {
          accepted_at?: string | null
          company_id?: string
          created_at?: string
          email?: string
          expires_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          token?: string
          username?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_invites_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      user_profiles: {
        Row: {
          company_id: string
          created_at: string
          default_outlet_id: string | null
          email: string | null
          full_name: string
          id: string
          is_active: boolean
          phone: string | null
          username: string
        }
        Insert: {
          company_id: string
          created_at?: string
          default_outlet_id?: string | null
          email?: string | null
          full_name: string
          id: string
          is_active?: boolean
          phone?: string | null
          username: string
        }
        Update: {
          company_id?: string
          created_at?: string
          default_outlet_id?: string | null
          email?: string | null
          full_name?: string
          id?: string
          is_active?: boolean
          phone?: string | null
          username?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_profiles_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_profiles_default_outlet_id_fkey"
            columns: ["default_outlet_id"]
            isOneToOne: false
            referencedRelation: "outlets"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          company_id: string
          created_at: string
          id: string
          outlet_id: string | null
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          company_id: string
          created_at?: string
          id?: string
          outlet_id?: string | null
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          company_id?: string
          created_at?: string
          id?: string
          outlet_id?: string | null
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_roles_outlet_id_fkey"
            columns: ["outlet_id"]
            isOneToOne: false
            referencedRelation: "outlets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_roles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      warehouses: {
        Row: {
          code: string
          company_id: string
          created_at: string
          id: string
          is_default: boolean
          name: string
          outlet_id: string | null
        }
        Insert: {
          code: string
          company_id: string
          created_at?: string
          id?: string
          is_default?: boolean
          name: string
          outlet_id?: string | null
        }
        Update: {
          code?: string
          company_id?: string
          created_at?: string
          id?: string
          is_default?: boolean
          name?: string
          outlet_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "warehouses_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "warehouses_outlet_id_fkey"
            columns: ["outlet_id"]
            isOneToOne: false
            referencedRelation: "outlets"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      current_company_id: { Args: never; Returns: string }
      has_permission: { Args: { permission: string }; Returns: boolean }
    }
    Enums: {
      app_role:
        | "cashier"
        | "barista"
        | "store_manager"
        | "inventory_staff"
        | "finance"
        | "operations_manager"
        | "commercial_analyst"
        | "company_admin"
      approval_status: "pending" | "approved" | "rejected" | "cancelled"
      delivery_channel: "email" | "whatsapp"
      delivery_status: "pending" | "sent" | "failed" | "delivered" | "read"
      inventory_item_type:
        | "raw_material"
        | "semi_finished_good"
        | "finished_good"
        | "retail_good"
        | "supply"
        | "service_non_stock"
      stock_movement_type:
        | "sale_consumption"
        | "recipe_production"
        | "byproduct_creation"
        | "purchase_receipt"
        | "transfer_out"
        | "transfer_in"
        | "wastage"
        | "stock_count_adjustment"
        | "return"
        | "manual_adjustment"
      transaction_status:
        | "draft"
        | "completed"
        | "void_requested"
        | "voided"
        | "refunded"
        | "sync_pending"
        | "sync_failed"
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
      app_role: [
        "cashier",
        "barista",
        "store_manager",
        "inventory_staff",
        "finance",
        "operations_manager",
        "commercial_analyst",
        "company_admin",
      ],
      approval_status: ["pending", "approved", "rejected", "cancelled"],
      delivery_channel: ["email", "whatsapp"],
      delivery_status: ["pending", "sent", "failed", "delivered", "read"],
      inventory_item_type: [
        "raw_material",
        "semi_finished_good",
        "finished_good",
        "retail_good",
        "supply",
        "service_non_stock",
      ],
      stock_movement_type: [
        "sale_consumption",
        "recipe_production",
        "byproduct_creation",
        "purchase_receipt",
        "transfer_out",
        "transfer_in",
        "wastage",
        "stock_count_adjustment",
        "return",
        "manual_adjustment",
      ],
      transaction_status: [
        "draft",
        "completed",
        "void_requested",
        "voided",
        "refunded",
        "sync_pending",
        "sync_failed",
      ],
    },
  },
} as const
