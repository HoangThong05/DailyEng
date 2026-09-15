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

/** Nhóm bộ từ, khớp constraint decks_category_check trong schema-07. */
export type DeckCategory =
  | "giao-tiep"
  | "cong-viec"
  | "toeic"
  | "cot-loi"
  | "hoc-thuat"
  | "khac";

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          display_name: string | null;
          daily_goal: number;
          reminder_hour: number;
          hide_rank: boolean;
          celebrated_goal_on: string | null;
          celebrated_level: number;
          is_admin: boolean;
          avatar_url: string | null;
          bio: string | null;
          cover: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          display_name?: string | null;
          daily_goal?: number;
          reminder_hour?: number;
          hide_rank?: boolean;
          celebrated_goal_on?: string | null;
          celebrated_level?: number;
          is_admin?: boolean;
          avatar_url?: string | null;
          bio?: string | null;
          cover?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          display_name?: string | null;
          daily_goal?: number;
          reminder_hour?: number;
          hide_rank?: boolean;
          celebrated_goal_on?: string | null;
          celebrated_level?: number;
          is_admin?: boolean;
          avatar_url?: string | null;
          bio?: string | null;
          cover?: string;
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
          category: DeckCategory;
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
          category?: DeckCategory;
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
          category?: DeckCategory;
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
      feedback: {
        Row: {
          id: string;
          user_id: string | null;
          email: string | null;
          message: string;
          page: string | null;
          handled: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          email?: string | null;
          message: string;
          page?: string | null;
          handled?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          email?: string | null;
          message?: string;
          page?: string | null;
          handled?: boolean;
          created_at?: string;
        };
        Relationships: [];
      };
      mock_results: {
        Row: {
          id: string;
          user_id: string;
          kind: string;
          score: number;
          total: number;
          seconds: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          kind?: string;
          score: number;
          total: number;
          seconds: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          kind?: string;
          score?: number;
          total?: number;
          seconds?: number;
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
    Functions: {
      /** Mỗi bộ một hàng kèm tổng từ / đã học / đến hạn của người gọi. */
      deck_summaries: {
        Args: { today: string };
        Returns: {
          id: string;
          slug: string | null;
          name: string;
          description: string | null;
          level: DeckLevel | null;
          category: DeckCategory;
          position: number;
          is_own: boolean;
          word_count: number;
          learned_count: number;
          due_count: number;
        }[];
      };
      /** Người gọi có phải admin không (đặt bằng SQL, schema-11). */
      is_admin: { Args: Record<string, never>; Returns: boolean };
      admin_overview: {
        Args: Record<string, never>;
        Returns: {
          users_total: number;
          users_new_7d: number;
          users_active_7d: number;
          users_active_today: number;
          reviews_total: number;
          reviews_7d: number;
          mock_tests_total: number;
          feedback_pending: number;
          decks_public: number;
          words_public: number;
        }[];
      };
      admin_signups_daily: {
        Args: { days: number };
        Returns: { day: string; signups: number; active: number }[];
      };
      admin_users: {
        Args: { top_n: number };
        Returns: {
          id: string;
          email: string;
          display_name: string | null;
          created_at: string;
          last_day: string | null;
          reviews: number;
          xp: number;
          is_admin: boolean;
          hide_rank: boolean;
        }[];
      };
      admin_set_admin: { Args: { target: string; flag: boolean }; Returns: undefined };
      admin_decks: {
        Args: Record<string, never>;
        Returns: {
          id: string;
          slug: string | null;
          name: string;
          category: string;
          words: number;
          learners: number;
        }[];
      };
      /** Top XP (tuần hoặc toàn thời gian) + hàng của chính mình nếu ngoài top. */
      leaderboard: {
        Args: { period: "week" | "all"; top_n: number };
        Returns: {
          display_name: string;
          avatar_url: string | null;
          xp: number;
          rank: number;
          is_me: boolean;
        }[];
      };
    };
    Enums: Record<never, never>;
    CompositeTypes: Record<never, never>;
  };
};

export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type Deck = Database["public"]["Tables"]["decks"]["Row"];
export type Word = Database["public"]["Tables"]["words"]["Row"];
export type WordProgress = Database["public"]["Tables"]["word_progress"]["Row"];