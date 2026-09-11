/**
 * Kiểu dữ liệu của database, viết tay khớp với các file supabase/schema*.sql.
 *
 * Khi schema đổi, sinh lại bằng:
 *   npx supabase gen types typescript --project-id <id> > lib/database.types.ts
 */
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type DeckLevel = "beginner" | "intermediate" | "advanced";

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          display_name: string | null;
          daily_goal: number;
          reminder_hour: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          display_name?: string | null;
          daily_goal?: number;
          reminder_hour?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          display_name?: string | null;
          daily_goal?: number;
          reminder_hour?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      decks: {
        Row: {
          id: string;
          owner_id: string | null;
          slug: string | null;
          name: string;
          description: string | null;
          level: DeckLevel | null;
          position: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          owner_id?: string | null;
          slug?: string | null;
          name: string;
          description?: string | null;
          level?: DeckLevel | null;
          position?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          owner_id?: string | null;
          slug?: string | null;
          name?: string;
          description?: string | null;
          level?: DeckLevel | null;
          position?: number;
          created_at?: string;
        };
        Relationships: [];
      };
      words: {
        Row: {
          id: string;
          deck_id: string;
          term: string;
          phonetic: string | null;
          meaning_vi: string;
          example_en: string | null;
          example_vi: string | null;
          position: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          deck_id: string;
          term: string;
          phonetic?: string | null;
          meaning_vi: string;
          example_en?: string | null;
          example_vi?: string | null;
          position?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          deck_id?: string;
          term?: string;
          phonetic?: string | null;
          meaning_vi?: string;
          example_en?: string | null;
          example_vi?: string | null;
          position?: number;
          created_at?: string;
        };
        Relationships: [];
      };
      word_progress: {
        Row: {
          user_id: string;
          word_id: string;
          box: number;
          due_on: string;
          review_count: number;
          correct_count: number;
          last_reviewed_at: string | null;
        };
        Insert: {
          user_id: string;
          word_id: string;
          box?: number;
          due_on?: string;
          review_count?: number;
          correct_count?: number;
          last_reviewed_at?: string | null;
        };
        Update: {
          user_id?: string;
          word_id?: string;
          box?: number;
          due_on?: string;
          review_count?: number;
          correct_count?: number;
          last_reviewed_at?: string | null;
        };
        Relationships: [];
      };
      review_log: {
        Row: {
          id: string;
          user_id: string;
          word_id: string;
          day: string;
          remembered: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          word_id: string;
          day: string;
          remembered: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          word_id?: string;
          day?: string;
          remembered?: boolean;
          created_at?: string;
        };
        Relationships: [];
      };
      push_subscriptions: {
        Row: {
          endpoint: string;
          user_id: string;
          p256dh: string;
          auth: string;
          created_at: string;
        };
        Insert: {
          endpoint: string;
          user_id: string;
          p256dh: string;
          auth: string;
          created_at?: string;
        };
        Update: {
          endpoint?: string;
          user_id?: string;
          p256dh?: string;
          auth?: string;
          created_at?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      /** Gộp review_log theo ngày. Chỉ đọc. */
      study_days: {
        Row: {
          user_id: string;
          day: string;
          reviews: number;
          correct: number;
          words: number;
        };
        Relationships: [];
      };
    };
    Functions: Record<never, never>;
    Enums: Record<never, never>;
    CompositeTypes: Record<never, never>;
  };
};

export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type Deck = Database["public"]["Tables"]["decks"]["Row"];
export type Word = Database["public"]["Tables"]["words"]["Row"];
export type WordProgress = Database["public"]["Tables"]["word_progress"]["Row"];