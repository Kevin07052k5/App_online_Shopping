export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type UserRole = 'USER' | 'CUSTOMER' | 'ADMIN' | 'SECURITY_OFFICER'
export type AuthProviderType = 'GOOGLE' | 'APPLE' | 'FACEBOOK' | 'TWITTER' | 'CREDENTIALS'
export type VoucherType = 'FREESHIP' | 'PERCENT' | 'FIXED'
export type PaymentMethodType = 'COD' | 'CREDIT_CARD' | 'QR_NAPAS' | 'E_WALLET'
export type FulfillmentStatusType =
  | 'PAID_APPROVED'
  | 'PACKAGING'
  | 'IN_TRANSIT'
  | 'DELIVERED'
  | 'HOLD_REVIEW'
  | 'CANCELLED'

export interface Database {
  public: {
    Tables: {
      todos: {
        Row: {
          id: number
          name: string
          is_completed: boolean
          created_at: string
        }
        Insert: {
          id?: number
          name: string
          is_completed?: boolean
          created_at?: string
        }
        Update: {
          id?: number
          name?: string
          is_completed?: boolean
          created_at?: string
        }
      }
      profiles: {
        Row: {
          id: string
          email: string
          name: string
          phone_number: string | null
          role: UserRole
          provider: AuthProviderType
          avatar_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          name: string
          phone_number?: string | null
          role?: UserRole
          provider?: AuthProviderType
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          name?: string
          phone_number?: string | null
          role?: UserRole
          provider?: AuthProviderType
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      categories: {
        Row: {
          id: string
          name: string
          icon: string
          description: string | null
          color: string | null
          created_at: string
        }
        Insert: {
          id: string
          name: string
          icon: string
          description?: string | null
          color?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          icon?: string
          description?: string | null
          color?: string | null
          created_at?: string
        }
      }
      products: {
        Row: {
          id: string
          name: string
          category_id: string
          price: number
          original_price: number
          discount_percent: number
          rating: number
          sold_count: number
          image: string
          stock: number
          description: string | null
          badge: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          name: string
          category_id: string
          price: number
          original_price: number
          discount_percent?: number
          rating?: number
          sold_count?: number
          image: string
          stock?: number
          description?: string | null
          badge?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          category_id?: string
          price?: number
          original_price?: number
          discount_percent?: number
          rating?: number
          sold_count?: number
          image?: string
          stock?: number
          description?: string | null
          badge?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      vouchers: {
        Row: {
          code: string
          name: string
          description: string | null
          type: VoucherType
          discount_value: number
          max_discount: number | null
          min_order_amount: number
          is_exploit_mock: boolean
          is_active: boolean
          created_at: string
        }
        Insert: {
          code: string
          name: string
          description?: string | null
          type: VoucherType
          discount_value: number
          max_discount?: number | null
          min_order_amount?: number
          is_exploit_mock?: boolean
          is_active?: boolean
          created_at?: string
        }
        Update: {
          code?: string
          name?: string
          description?: string | null
          type?: VoucherType
          discount_value?: number
          max_discount?: number | null
          min_order_amount?: number
          is_exploit_mock?: boolean
          is_active?: boolean
          created_at?: string
        }
      }
      orders: {
        Row: {
          id: string
          order_code: string
          user_id: string | null
          encrypted_pii: Json
          phone_blind_index: string
          record_checksum: string
          items: Json
          items_count: number
          subtotal_amount: number
          discount_amount: number
          shipping_fee: number
          final_total_amount: number
          applied_voucher_code: string | null
          payment_method: PaymentMethodType
          device_entropy: string | null
          client_ip: string | null
          checkout_velocity_sec: number
          ai_explanation: Json | null
          fulfillment_status: FulfillmentStatusType
          is_tampered: boolean
          tampered_description: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          order_code: string
          user_id?: string | null
          encrypted_pii: Json
          phone_blind_index: string
          record_checksum: string
          items?: Json
          items_count?: number
          subtotal_amount?: number
          discount_amount?: number
          shipping_fee?: number
          final_total_amount?: number
          applied_voucher_code?: string | null
          payment_method?: PaymentMethodType
          device_entropy?: string | null
          client_ip?: string | null
          checkout_velocity_sec?: number
          ai_explanation?: Json | null
          fulfillment_status?: FulfillmentStatusType
          is_tampered?: boolean
          tampered_description?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          order_code?: string
          user_id?: string | null
          encrypted_pii?: Json
          phone_blind_index?: string
          record_checksum?: string
          items?: Json
          items_count?: number
          subtotal_amount?: number
          discount_amount?: number
          shipping_fee?: number
          final_total_amount?: number
          applied_voucher_code?: string | null
          payment_method?: PaymentMethodType
          device_entropy?: string | null
          client_ip?: string | null
          checkout_velocity_sec?: number
          ai_explanation?: Json | null
          fulfillment_status?: FulfillmentStatusType
          is_tampered?: boolean
          tampered_description?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      biometric_profiles: {
        Row: {
          id: string
          user_id: string | null
          name: string
          role: UserRole
          embedding_128d: Json
          avatar_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          user_id?: string | null
          name: string
          role?: UserRole
          embedding_128d: Json
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          name?: string
          role?: UserRole
          embedding_128d?: Json
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      audit_logs: {
        Row: {
          id: number
          order_id: string | null
          action: string
          performed_by: string | null
          details: Json | null
          created_at: string
        }
        Insert: {
          id?: number
          order_id?: string | null
          action: string
          performed_by?: string | null
          details?: Json | null
          created_at?: string
        }
        Update: {
          id?: number
          order_id?: string | null
          action?: string
          performed_by?: string | null
          details?: Json | null
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      user_role: UserRole
      auth_provider_type: AuthProviderType
      voucher_type: VoucherType
      payment_method_type: PaymentMethodType
      fulfillment_status_type: FulfillmentStatusType
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
