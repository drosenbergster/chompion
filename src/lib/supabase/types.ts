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
          display_name: string;
          username: string;
          avatar_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          display_name?: string;
          username: string;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          display_name?: string;
          username?: string;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      passion_foods: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          theme_key: string;
          is_default: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          theme_key?: string;
          is_default?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          theme_key?: string;
          is_default?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      subtypes: {
        Row: {
          id: string;
          passion_food_id: string;
          name: string;
          sort_order: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          passion_food_id: string;
          name: string;
          sort_order?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          passion_food_id?: string;
          name?: string;
          sort_order?: number;
          created_at?: string;
        };
      };
      rating_categories: {
        Row: {
          id: string;
          passion_food_id: string;
          name: string;
          weight: number;
          sort_order: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          passion_food_id: string;
          name: string;
          weight: number;
          sort_order?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          passion_food_id?: string;
          name?: string;
          weight?: number;
          sort_order?: number;
          created_at?: string;
        };
      };
      entries: {
        Row: {
          id: string;
          passion_food_id: string | null;
          user_id: string;
          restaurant_name: string;
          city: string;
          address: string | null;
          phone_number: string | null;
          location_notes: string | null;
          subtype_id: string | null;
          quantity: number | null;
          cost: number | null;
          composite_score: number | null;
          notes: string | null;
          cuisine: string | null;
          eaten_at: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          passion_food_id?: string | null;
          user_id: string;
          restaurant_name: string;
          city: string;
          address?: string | null;
          phone_number?: string | null;
          location_notes?: string | null;
          subtype_id?: string | null;
          quantity?: number | null;
          cost?: number | null;
          composite_score?: number | null;
          notes?: string | null;
          cuisine?: string | null;
          eaten_at?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          passion_food_id?: string | null;
          user_id?: string;
          restaurant_name?: string;
          city?: string;
          address?: string | null;
          phone_number?: string | null;
          location_notes?: string | null;
          subtype_id?: string | null;
          quantity?: number | null;
          cost?: number | null;
          composite_score?: number | null;
          notes?: string | null;
          cuisine?: string | null;
          eaten_at?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      entry_dishes: {
        Row: {
          id: string;
          entry_id: string;
          name: string;
          rating: number | null;
          notes: string | null;
          sort_order: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          entry_id: string;
          name: string;
          rating?: number | null;
          notes?: string | null;
          sort_order?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          entry_id?: string;
          name?: string;
          rating?: number | null;
          notes?: string | null;
          sort_order?: number;
          created_at?: string;
        };
      };
      entry_ratings: {
        Row: {
          id: string;
          entry_id: string;
          rating_category_id: string;
          score: number;
        };
        Insert: {
          id?: string;
          entry_id: string;
          rating_category_id: string;
          score: number;
        };
        Update: {
          id?: string;
          entry_id?: string;
          rating_category_id?: string;
          score?: number;
        };
      };
      follows: {
        Row: {
          follower_id: string;
          following_id: string;
          created_at: string;
        };
        Insert: {
          follower_id: string;
          following_id: string;
          created_at?: string;
        };
        Update: {
          follower_id?: string;
          following_id?: string;
          created_at?: string;
        };
      };
      notifications: {
        Row: {
          id: string;
          user_id: string;
          type: string;
          actor_id: string;
          data: Record<string, unknown>;
          read: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          type: string;
          actor_id: string;
          data?: Record<string, unknown>;
          read?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          type?: string;
          actor_id?: string;
          data?: Record<string, unknown>;
          read?: boolean;
          created_at?: string;
        };
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
}

// Convenience type aliases
export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type PassionFood = Database["public"]["Tables"]["passion_foods"]["Row"];
export type Subtype = Database["public"]["Tables"]["subtypes"]["Row"];
export type RatingCategory = Database["public"]["Tables"]["rating_categories"]["Row"];
export type Entry = Database["public"]["Tables"]["entries"]["Row"];
export type EntryRating = Database["public"]["Tables"]["entry_ratings"]["Row"];
export type EntryDish = Database["public"]["Tables"]["entry_dishes"]["Row"];
export type Follow = Database["public"]["Tables"]["follows"]["Row"];
export type Notification = Database["public"]["Tables"]["notifications"]["Row"];

// Entry with joined data for display
export type EntryWithDetails = Entry & {
  subtype?: Subtype | null;
  entry_ratings: (EntryRating & {
    rating_category: RatingCategory;
  })[];
};
