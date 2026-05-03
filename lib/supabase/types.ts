export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          full_name: string | null;
          avatar_url: string | null;
          email: string | null;
          created_at: string;
        };
        Insert: {
          id: string;
          full_name?: string | null;
          avatar_url?: string | null;
          email?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          full_name?: string | null;
          avatar_url?: string | null;
          email?: string | null;
          created_at?: string;
        };
      };
      knowledge_categories: {
        Row: {
          id: string;
          name: string;
          slug: string;
          icon: string;
          sort_order: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          icon: string;
          sort_order?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          slug?: string;
          icon?: string;
          sort_order?: number;
        };
      };
      knowledge_articles: {
        Row: {
          id: string;
          title: string;
          slug: string;
          content: string;
          category_id: string;
          created_by: string;
          updated_at: string;
          created_at: string;
          is_published: boolean;
        };
        Insert: {
          id?: string;
          title: string;
          slug: string;
          content: string;
          category_id: string;
          created_by: string;
          updated_at?: string;
          created_at?: string;
          is_published?: boolean;
        };
        Update: {
          id?: string;
          title?: string;
          slug?: string;
          content?: string;
          category_id?: string;
          updated_at?: string;
          is_published?: boolean;
        };
      };
      trips: {
        Row: {
          id: string;
          name: string;
          start_date: string;
          end_date: string;
          notes: string | null;
          created_by: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          start_date: string;
          end_date: string;
          notes?: string | null;
          created_by: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          start_date?: string;
          end_date?: string;
          notes?: string | null;
        };
      };
      trip_attendees: {
        Row: {
          trip_id: string;
          user_id: string;
        };
        Insert: {
          trip_id: string;
          user_id: string;
        };
        Update: {
          trip_id?: string;
          user_id?: string;
        };
      };
      meals: {
        Row: {
          id: string;
          trip_id: string;
          name: string;
          meal_type: "breakfast" | "lunch" | "dinner" | "snack";
          date: string;
          notes: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          trip_id: string;
          name: string;
          meal_type: "breakfast" | "lunch" | "dinner" | "snack";
          date: string;
          notes?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          meal_type?: "breakfast" | "lunch" | "dinner" | "snack";
          date?: string;
          notes?: string | null;
        };
      };
      meal_items: {
        Row: {
          id: string;
          meal_id: string;
          name: string;
          quantity: string | null;
          unit: string | null;
          assigned_to: string | null;
          cost: number | null;
          is_brought: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          meal_id: string;
          name: string;
          quantity?: string | null;
          unit?: string | null;
          assigned_to?: string | null;
          cost?: number | null;
          is_brought?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          quantity?: string | null;
          unit?: string | null;
          assigned_to?: string | null;
          cost?: number | null;
          is_brought?: boolean;
        };
      };
      supply_items: {
        Row: {
          id: string;
          trip_id: string;
          name: string;
          category: "food" | "water" | "alcohol" | "supplies" | "other";
          quantity: string | null;
          unit: string | null;
          assigned_to: string | null;
          cost: number | null;
          is_brought: boolean;
          is_at_cottage: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          trip_id: string;
          name: string;
          category: "food" | "water" | "alcohol" | "supplies" | "other";
          quantity?: string | null;
          unit?: string | null;
          assigned_to?: string | null;
          cost?: number | null;
          is_brought?: boolean;
          is_at_cottage?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          category?: "food" | "water" | "alcohol" | "supplies" | "other";
          quantity?: string | null;
          unit?: string | null;
          assigned_to?: string | null;
          cost?: number | null;
          is_brought?: boolean;
          is_at_cottage?: boolean;
        };
      };
      pantry_items: {
        Row: {
          id: string;
          name: string;
          category: string;
          quantity: string | null;
          unit: string | null;
          last_updated_by: string | null;
          last_updated_at: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          category: string;
          quantity?: string | null;
          unit?: string | null;
          last_updated_by?: string | null;
          last_updated_at?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          category?: string;
          quantity?: string | null;
          unit?: string | null;
          last_updated_by?: string | null;
          last_updated_at?: string;
        };
      };
      maintenance_tasks: {
        Row: {
          id: string;
          title: string;
          description: string | null;
          category: string;
          frequency: "annual" | "seasonal" | "monthly" | "as-needed";
          month_due: number | null;
          priority: "low" | "medium" | "high";
          notes: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          description?: string | null;
          category: string;
          frequency: "annual" | "seasonal" | "monthly" | "as-needed";
          month_due?: number | null;
          priority?: "low" | "medium" | "high";
          notes?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          description?: string | null;
          category?: string;
          frequency?: "annual" | "seasonal" | "monthly" | "as-needed";
          month_due?: number | null;
          priority?: "low" | "medium" | "high";
          notes?: string | null;
        };
      };
      maintenance_logs: {
        Row: {
          id: string;
          task_id: string;
          completed_by: string;
          completed_date: string;
          notes: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          task_id: string;
          completed_by: string;
          completed_date: string;
          notes?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          notes?: string | null;
        };
      };
      improvements: {
        Row: {
          id: string;
          title: string;
          description: string | null;
          status: "idea" | "planned" | "in-progress" | "done";
          priority: "low" | "medium" | "high";
          suggested_by: string;
          estimated_cost: number | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          description?: string | null;
          status?: "idea" | "planned" | "in-progress" | "done";
          priority?: "low" | "medium" | "high";
          suggested_by: string;
          estimated_cost?: number | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          description?: string | null;
          status?: "idea" | "planned" | "in-progress" | "done";
          priority?: "low" | "medium" | "high";
          estimated_cost?: number | null;
          notes?: string | null;
          updated_at?: string;
        };
      };
      cottage_stays: {
        Row: {
          id: string;
          user_id: string;
          start_date: string;
          end_date: string;
          notes: string | null;
          is_confirmed: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          start_date: string;
          end_date: string;
          notes?: string | null;
          is_confirmed?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          start_date?: string;
          end_date?: string;
          notes?: string | null;
          is_confirmed?: boolean;
        };
      };
      expenses: {
        Row: {
          id: string;
          trip_id: string;
          description: string;
          amount: number;
          paid_by: string;
          date: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          trip_id: string;
          description: string;
          amount: number;
          paid_by: string;
          date: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          description?: string;
          amount?: number;
          paid_by?: string;
          date?: string;
        };
      };
      expense_splits: {
        Row: {
          id: string;
          expense_id: string;
          user_id: string;
          amount_owed: number;
          is_settled: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          expense_id: string;
          user_id: string;
          amount_owed: number;
          is_settled?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          amount_owed?: number;
          is_settled?: boolean;
        };
      };
    };
  };
}
