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

/** Lượt trả lời đến từ đâu (review_log.source). */
export type ReviewSource = "hoc" | "game" | "chep-cau" | "shadowing";

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
          placement: Json | null;
          badges: Json;
          /** Lúc qua màn chào mừng; null = người mới, cần vào /chao-mung. */
          onboarded_at: string | null;
          /** Khung avatar / danh hiệu đang trang bị (khoá trong lib/shop.ts). */
          frame: string | null;
          title: string | null;
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
          placement?: Json | null;
          badges?: Json;
          onboarded_at?: string | null;
          frame?: string | null;
          title?: string | null;
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
          placement?: Json | null;
          badges?: Json;
          onboarded_at?: string | null;
          frame?: string | null;
          title?: string | null;
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
          source: ReviewSource;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          word_id: string;
          day: string;
          remembered: boolean;
          source?: ReviewSource;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          word_id?: string;
          day?: string;
          remembered?: boolean;
          source?: ReviewSource;
          created_at?: string;
        };
        Relationships: [];
      };
      ai_chat_log: {
        Row: {
          id: string;
          user_id: string;
          day: string;
          input_tokens: number;
          output_tokens: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          day: string;
          input_tokens?: number;
          output_tokens?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          day?: string;
          input_tokens?: number;
          output_tokens?: number;
          created_at?: string;
        };
        Relationships: [];
      };
      friendships: {
        Row: {
          requester: string;
          addressee: string;
          status: "pending" | "accepted";
          created_at: string;
          responded_at: string | null;
        };
        Insert: {
          requester: string;
          addressee: string;
          status?: "pending" | "accepted";
          created_at?: string;
          responded_at?: string | null;
        };
        Update: {
          requester?: string;
          addressee?: string;
          status?: "pending" | "accepted";
          created_at?: string;
          responded_at?: string | null;
        };
        Relationships: [];
      };
      shop_items: {
        Row: { key: string; kind: string; name: string; price: number; limited_until: string | null };
        Insert: { key: string; kind: string; name: string; price: number; limited_until?: string | null };
        Update: { key?: string; kind?: string; name?: string; price?: number; limited_until?: string | null };
        Relationships: [];
      };
      seed_ledger: {
        Row: { id: number; user_id: string; amount: number; reason: string; ref: string; created_at: string };
        Insert: { id?: number; user_id: string; amount: number; reason: string; ref: string; created_at?: string };
        Update: { id?: number; user_id?: string; amount?: number; reason?: string; ref?: string; created_at?: string };
        Relationships: [];
      };
      inventory: {
        Row: { user_id: string; item_key: string; bought_at: string };
        Insert: { user_id: string; item_key: string; bought_at?: string };
        Update: { user_id?: string; item_key?: string; bought_at?: string };
        Relationships: [];
      };
      streak_shields: {
        Row: { user_id: string; day: string };
        Insert: { user_id: string; day: string };
        Update: { user_id?: string; day?: string };
        Relationships: [];
      };
      task_completions: {
        Row: {
          user_id: string;
          day: string;
          task_key: string;
          xp: number;
          created_at: string;
        };
        Insert: {
          user_id: string;
          day: string;
          task_key: string;
          xp: number;
          created_at?: string;
        };
        Update: {
          user_id?: string;
          day?: string;
          task_key?: string;
          xp?: number;
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
      /** Bạn bè (schema-24). */
      friend_list: {
        Args: Record<string, never>;
        Returns: {
          user_id: string;
          display_name: string;
          avatar_url: string | null;
          frame: string | null;
          title: string | null;
          badges: Json;
          xp: number;
          streak_days: number;
          studied_today: boolean;
          kind: string;
          since: string;
        }[];
      };
      friend_leaderboard: {
        Args: { period: "week" | "all" };
        Returns: {
          user_id: string;
          display_name: string;
          avatar_url: string | null;
          xp: number;
          rank: number;
          is_me: boolean;
          badges: Json;
          frame: string | null;
          title: string | null;
        }[];
      };
      friend_status: { Args: { target: string }; Returns: string };
      accept_friend: { Args: { target: string }; Returns: undefined };
      /** Cửa hàng Hạt (schema-23). */
      seed_balance: { Args: Record<string, never>; Returns: number };
      claim_seeds: { Args: Record<string, never>; Returns: number };
      my_freezes: { Args: Record<string, never>; Returns: number };
      buy_item: { Args: { p_key: string }; Returns: undefined };
      equip_item: { Args: { p_kind: string; p_key: string | null }; Returns: undefined };
      use_streak_freeze: { Args: Record<string, never>; Returns: boolean };
      /** Xóa tài khoản của chính người gọi (schema-21); dữ liệu cascade theo. */
      delete_own_account: { Args: Record<string, never>; Returns: undefined };
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
      public_profile: {
        Args: { target: string };
        Returns: {
          user_id: string;
          display_name: string;
          avatar_url: string | null;
          cover: string | null;
          bio: string | null;
          badges: Json;
          xp: number;
          words_seen: number;
          words_mastered: number;
          reviews: number;
          recent_days: string[];
          joined_at: string;
          frame: string | null;
          title: string | null;
        }[];
      };
      leaderboard: {
        Args: { period: "week" | "all"; top_n: number };
        Returns: {
          user_id?: string;
          display_name: string;
          avatar_url: string | null;
          xp: number;
          rank: number;
          is_me: boolean;
          badges?: Json;
          frame?: string | null;
          title?: string | null;
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