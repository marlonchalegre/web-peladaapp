export interface Organization {
  id: string;
  name: string;
  owner_id?: string | null;
  priority_confirmation_limit_hours?: number | null;
  default_max_players?: number | null;
  default_location?: string | null;
  waha_api_url?: string | null;
  waha_instance?: string | null;
  waha_group_id?: string | null;
  waha_enabled?: boolean | null;
  waha_start_msg_enabled?: boolean | null;
  waha_end_msg_enabled?: boolean | null;
  waha_attendance_reminder_enabled?: boolean | null;
  waha_vote_reminder_enabled?: boolean | null;
  waha_vote_ended_msg_enabled?: boolean | null;
  waha_use_all_mention?: boolean | null;
  is_blocked?: boolean;
}
export interface GeoLocationSuggestion {
  place_id: number | string;
  display_name: string;
  name?: string;
  lat?: string;
  lon?: string;
}
export interface OrganizationFeatureFlags {
  organization_id: string;
  finance_control: boolean;
  waha_communications: boolean;
  player_characteristics: boolean;
  monthly_substitutions: boolean;
  org_statistics: boolean;
  peer_voting: boolean;
  unlimited_members: boolean;
  unlimited_peladas: boolean;
}
export interface User {
  id: string;
  name: string;
  username: string;
  email?: string;
  phone?: string | null;
  admin_orgs?: string[];
  position?: string;
  avatar_filename?: string | null;
  is_super_admin?: boolean;
  is_blocked?: boolean;
  allow_org_creation?: boolean;
  receive_non_mensalista_updates?: boolean;
  stats?: {
    goals: number;
    assists: number;
    matches: number;
    attendance_rate?: number | null;
    current_streak?: number | null;
  };
}
export interface Player {
  id: string;
  user_id: string;
  organization_id: string;
  grade?: number | null;
  position?: string | null;
  position_id?: string | null;
  member_type?:
    | "mensalista"
    | "diarista"
    | "convidado"
    | "mensalista_temporario"
    | "diarista_temporario";
  user_name?: string;
  user_username?: string;
  user_position?: string;
  user_avatar_filename?: string | null;
  position_name?: string;
  passing?: number;
  ball_control?: number;
  velocity?: number;
  shooting?: number;
  dribbling?: number;
  defending?: number;
  user_email?: string;
}
export interface MonthlyPlayerSubstitution {
  id: string;
  organization_id: string;
  permanent_player_id: string;
  temporary_player_id: string;
  start_date: string;
  end_date?: string | null;
  active: boolean;
  permanent_player_name?: string;
  temporary_player_name?: string;
  created_at?: string;
}
export interface MonthlyWaitlistEntry {
  id: string;
  organization_id: string;
  player_id: string;
  user_id: string;
  user_name?: string;
  user_username?: string;
  user_avatar_filename?: string;
  position?: string;
  member_type?: Player["member_type"];
  created_at: string;
}
export interface MonthlyWaitlistStatus {
  in_queue: boolean;
  entry?: MonthlyWaitlistEntry;
}
export interface OrganizationAdmin {
  id: string;
  organization_id: string;
  user_id: string;
  user_name?: string;
  user_username?: string;
  user_email?: string;
  user_position?: string;
  user_avatar_filename?: string | null;
  organization_name?: string;
  created_at?: string;
}

export type TimerStatus = "stopped" | "running" | "paused";

export interface Pelada {
  id: string;
  organization_id: string;
  organization_name?: string;
  scheduled_at?: string | null;
  when?: string | null;
  num_teams?: number | null;
  players_per_team?: number | null;
  max_players?: number | null;
  location?: string | null;
  confirmed_count?: number | null;
  confirmed_preview?: string | null;
  creator_id?: string | null;
  fixed_goalkeepers?: boolean | null;
  home_fixed_goalkeeper_id?: string | null;
  away_fixed_goalkeeper_id?: string | null;
  notify_casual_players?: boolean | null;
  status?: string | null;
  closed_at?: string | null;
  is_admin?: boolean;
  has_schedule_plan?: boolean;
  timer_started_at?: string | null;
  timer_accumulated_ms?: number | null;
  timer_status?: TimerStatus | null;
  user_attendance_status?: AttendanceStatus | null;
}

export interface PeladaHistoryUserLine {
  player_id: string;
  player_name: string;
  team_name?: string | null;
  team_position?: number | null;
  goals: number;
  assists: number;
  own_goals: number;
  avg_stars?: number | null;
  is_mvp: boolean;
  is_garcom: boolean;
}

export interface PeladaHistoryEntry {
  id: string;
  scheduled_at?: string | null;
  location?: string | null;
  max_players?: number | null;
  matches_count: number;
  players_count: number;
  champion_team_name?: string | null;
  user?: PeladaHistoryUserLine | null;
}

export interface ProfileSummary {
  avg_rating: number | null;
  avg_stars: number | null;
  matches_played: number;
  goals: number;
  assists: number;
  titles: number;
  mvp_count: number;
  garcom_count: number;
  attendance_rate: number | null;
}

export interface ProfileSkills {
  passing: number | null;
  ball_control: number | null;
  velocity: number | null;
  shooting: number | null;
  dribbling: number | null;
  defending: number | null;
  ratings_count: number;
}

export interface ProfileGroupStat {
  organization_id: string;
  organization_name: string;
  peladas_played: number;
  goals: number;
  assists: number;
  titles: number;
}

export interface ProfilePresenceWeek {
  week_start: string;
  status: "present" | "absent" | "no_game";
}

export type ProfileRecentPelada = PeladaHistoryEntry & {
  organization_id: string;
  organization_name: string;
};

export interface UserProfileDashboard {
  year: number;
  summary: ProfileSummary;
  skills: ProfileSkills;
  groups: ProfileGroupStat[];
  presence: ProfilePresenceWeek[];
  recent_peladas: ProfileRecentPelada[];
}

export interface Team {
  id: string;
  pelada_id: string;
  name: string;
}
export interface TeamPlayer {
  team_id: string;
  player_id: string;
  is_goalkeeper?: boolean;
}
export interface Match {
  id: string;
  pelada_id: string;
  sequence: number;
  status?: string | null;
  home_team_id: string;
  away_team_id: string;
  home_score: number;
  away_score: number;
  timer_started_at?: string | null;
  timer_accumulated_ms?: number | null;
  timer_status?: TimerStatus | null;
  support_camera_player_id?: string | null;
  support_stats_player_id?: string | null;
}
export type MatchEventType =
  | "assist"
  | "goal"
  | "own_goal"
  | "drible"
  | "chute"
  | "falta"
  | "furada"
  | "defesa"
  | "vish";
export interface MatchEvent {
  id: string;
  match_id: string;
  player_id: string;
  event_type: MatchEventType;
  created_at?: string;
  session_time_ms?: number | null;
  match_time_ms?: number | null;
  parent_event_id?: string | null;
  team_id?: string | null;
}

export interface PlayerStats {
  player_id: string;
  user_id: string;
  name: string;
  goals: number;
  assists: number;
  own_goals: number;
}
export interface OrganizationPlayerStats {
  player_id: string;
  user_id?: string;
  player_name: string;
  player_position?: string;
  avatar_filename?: string | null;
  peladas_played: number;
  goal: number;
  assist: number;
  own_goal: number;
  avg_rating: number;
  titles?: number;
  total_peladas?: number;
}

export interface WeeklyPresence {
  week_start: string;
  confirmed: number;
}
export type MatchLineupEntry = TeamPlayer;
export interface PeladaDashboardDataResponse {
  pelada: Pelada;
  matches: Match[];
  teams: Team[];
  users: User[];
  organization_players: Player[];
  match_events: MatchEvent[];
  player_stats: PlayerStats[] | null;
  pelada_transactions?: Transaction[];
  team_players_map: Record<string, TeamPlayer[]>;
  match_lineups_map: Record<string, Record<string, MatchLineupEntry[]>>;
  attendance?: { player_id: string; status: string; updated_at?: string }[];
}
export interface VotingInfo {
  can_vote: boolean;
  has_voted: boolean;
  eligible_players: {
    player_id: string;
    user_id?: string;
    name: string;
    position?: string;
    avatar_filename?: string | null;
    voting_enabled?: boolean;
    goals?: number;
    assists?: number;
    own_goals?: number;
  }[];
  is_admin?: boolean;
  current_votes?: { target_id: string; stars: number }[];
  voter_player_id?: string | null;
  message?: string;
}

export interface PlayerResult {
  player_id: string;
  user_id?: string;
  name: string;
  position?: string;
  avatar_filename?: string | null;
  average_stars: number;
  goals: number;
  assists: number;
  own_goals: number;
}

export interface VoterStatusItem {
  player_id: string;
  user_id?: string;
  avatar_filename?: string | null;
  name: string;
  has_voted: boolean;
}

export interface VotingResults {
  mvp: PlayerResult[];
  striker: PlayerResult[];
  garcom: PlayerResult[];
  voters: VoterStatusItem[];
  total_eligible: number;
  total_voted: number;
  organization_id?: string;
  organization_name?: string;
}

export interface VotingStatus {
  voters: VoterStatusItem[];
  total_eligible: number;
  total_voted: number;
}

export interface BatchVotePayload {
  voter_id: string;
  votes: { target_id: string; stars: number }[];
}
export interface BatchVoteResponse {
  votes_cast: number;
}

export interface OrganizationFinance {
  id: string;
  organization_id: string;
  mensalista_price: number;
  diarista_price: number;
  monthly_fine_amount?: number;
  monthly_cut_off_day?: number;
  currency: string;
}

export interface Transaction {
  id: string;
  organization_id: string;
  player_id?: string | null;
  player_name?: string | null;
  pelada_id?: string | null;
  amount: number;
  fine_amount?: number | null;
  type: "income" | "expense";
  category: string;
  description?: string | null;
  payment_date: string;
  pelada_date?: string | null;
  created_by?: string | null;
  creator_name?: string | null;
  created_at?: string;
  status?: "paid" | "reversed";
}

export interface MonthlyPayment {
  id?: string;
  organization_id: string;
  player_id: string;
  player_name: string;
  member_type: string;
  year: number;
  month: number;
  transaction_id?: string | null;
  fine_transaction_id?: string | null;
  amount?: number;
  fine_amount?: number;
  fine_status?: "paid" | "reversed";
  paid: boolean;
}

export interface FinanceSummary {
  total_balance: number;
  total_income: number;
  total_expense: number;
}

export type AttendanceStatus =
  | "confirmed"
  | "declined"
  | "pending"
  | "waitlist";
export interface Attendance {
  id?: string;
  pelada_id?: string;
  player_id: string;
  "player-id"?: string;
  playerId?: string;
  status: string;
  Status?: string;
  avatar_filename?: string | null;
  updated_at?: string;
  voting_enabled?: boolean;
  player?: Player & { user: User };
}

export interface OrganizationInvitation {
  id: string;
  organization_id: string;
  organization_name?: string;
  email?: string;
  token: string;
  status: "pending" | "accepted" | "rejected";
  created_at: string;
}

export interface PeladaFullDetailsResponse {
  pelada: Pelada;
  teams: (Team & {
    players: (Player & { user: User; is_goalkeeper?: boolean })[];
  })[];
  available_players: (Player & {
    user: User;
    attendance_status?: AttendanceStatus;
  })[];
  scores: Record<string, number>;
  attendance: Attendance[];
  pelada_transactions?: Transaction[];
  users_map: Record<string, User>;
  org_players_map: Record<string, Player>;
  voting_info: VotingInfo | null;
}

/**
 * Team draw algorithms.
 * - `classic`: the original balance-by-grade shuffle.
 * - `gemini`: cost-driven chemistry draw.
 * - `gpt`: constraint-first tactical draw.
 */
export const DRAW_ALGORITHMS = ["classic", "gemini", "gpt"] as const;

export type DrawAlgorithm = (typeof DRAW_ALGORITHMS)[number];

export interface DrawPlayer {
  id: string;
  name: string;
  position: string;
  position_code: string;
  grade: number;
  is_anchor?: boolean;
  short_history?: boolean;
  overall?: number;
  offense?: number;
  defense?: number;
  titles?: number;
  drought?: number;
  matches?: number;
  goals?: number;
  assists?: number;
  bayes_vote?: number | null;
}

export interface DrawPairEvidence {
  players: [string, string] | string[];
  nights_together?: number;
  nights_both_present?: number;
  titles_together?: number;
  title_opportunities?: number;
  faced_each_other?: number;
}

interface DrawTeamBase {
  index: number;
  name: string;
  mean: number;
  formation: string;
  players: DrawPlayer[];
  champion_pairs?: DrawPairEvidence[];
}

export interface DrawTacticalTeam extends DrawTeamBase {
  total?: number;
  diff_to_squad_mean?: number;
  main_sector?: string;
  sector_means?: Record<string, number>;
  anchors?: string[];
  short_history?: string[];
  titles?: { name: string; titles: number; title_opportunities: number }[];
  top_pairs?: DrawPairEvidence[];
  rarest_pair?: DrawPairEvidence | null;
  assist_links?: { from: string; to: string; count: number }[];
}

export interface DrawChemistryTeam extends DrawTeamBase {
  overall?: number;
  defense?: number;
  offense?: number;
  titles_total?: number;
  drought_total?: number;
  top_winner?: { name: string; titles: number } | null;
  longest_drought?: { name: string; drought: number } | null;
  new_pairs?: DrawPairEvidence[];
}

export type DrawTeamReport = DrawTacticalTeam | DrawChemistryTeam;

export interface DrawTacticalMetrics {
  squad_mean?: number;
  team_mean_gap?: number;
  sector_gap?: number;
  main_sector?: string;
  tolerance?: number;
  tolerance_respected?: boolean;
  anchors_respected?: boolean;
  max_short_history_per_team?: number;
  short_history_threshold?: number;
  anchors?: string[];
  short_history_players?: string[];
  restarts?: number;
}

export interface DrawChemistryMetrics {
  squad_mean?: number;
  cost?: number;
  grade_gap?: number;
  overall_gap?: number;
  defense_gap?: number;
  offense_gap?: number;
  overall_means?: number[];
  defense_means?: number[];
  offense_means?: number[];
  titles_spread?: number;
  drought_spread?: number;
  champion_penalty?: number;
  novelty_bonus?: number;
  titles_penalty?: number;
  drought_penalty?: number;
  restarts?: number;
  steps?: number;
}

interface DrawJustificationBase {
  benched: { name: string; grade: number }[];
  use_history: boolean;
  players_considered: number;
  source: "confirmed_attendance" | "board";
  history: {
    enabled: boolean;
    weight?: number;
    penalty?: number;
    baseline_penalty?: number;
    components?: Record<string, number>;
    baseline_components?: Record<string, number>;
    changed_vs_baseline?: boolean;
    moves?: { name: string; from: number; to: number }[];
    coverage?: Record<string, number>;
    champion_duo_threshold?: number;
    novelty_opposition_threshold?: number;
  };
}

export interface DrawTacticalJustification extends DrawJustificationBase {
  algorithm: "gpt";
  teams: DrawTacticalTeam[];
  metrics: DrawTacticalMetrics;
}

export interface DrawChemistryJustification extends DrawJustificationBase {
  algorithm: "gemini";
  teams: DrawChemistryTeam[];
  metrics: DrawChemistryMetrics;
}

export type DrawJustification =
  | DrawTacticalJustification
  | DrawChemistryJustification;

export interface RandomizeTeamsResponse {
  success: boolean;
  algorithm: DrawAlgorithm;
  justification: DrawJustification | null;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
}
