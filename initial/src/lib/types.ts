export type DealStage = 'L0' | 'L1' | 'L2' | 'L3' | 'L4' | 'L5';

export type L1Status = 'Pass' | 'No' | 'Exception' | 'WatchList' | 'TBC' | 'Duplicate';

export type CompanySource = 'inbound' | 'outbound';

export interface Company {
  id: string;
  name: string;
  sector: string;
  revenue_year1: number | null;
  revenue_year2: number | null;
  revenue_year3: number | null;
  ebitda_year1: number | null;
  ebitda_year2: number | null;
  ebitda_year3: number | null;
  valuation: number | null;
  source: CompanySource;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface Deal {
  id: string;
  company_id: string;
  current_stage: DealStage;
  l1_status: L1Status | null;
  l1_filter_results: L1FilterResults | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  company?: Company;
}

export interface L1FilterResults {
  ebitda_margin_pass: boolean;
  revenue_not_declining: boolean;
  valuation_under_1b: boolean;
  is_duplicate: boolean;
  all_passed: boolean;
}

export interface DealStageHistory {
  id: string;
  deal_id: string;
  stage: DealStage;
  entered_at: string;
  exited_at: string | null;
  duration_seconds: number | null;
}

export interface DealNote {
  id: string;
  deal_id: string;
  stage: DealStage;
  content: string;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface DealDocument {
  id: string;
  deal_id: string;
  stage: DealStage;
  file_name: string;
  file_path: string;
  file_size: number | null;
  mime_type: string | null;
  created_by: string | null;
  created_at: string;
}

export interface DealLink {
  id: string;
  deal_id: string;
  stage: DealStage;
  url: string;
  title: string | null;
  created_by: string | null;
  created_at: string;
}

export interface AIChatMessage {
  id: string;
  user_id: string | null;
  query: string;
  response: string | null;
  companies_suggested: SuggestedCompany[] | null;
  created_at: string;
}

export interface SuggestedCompany {
  name: string;
  sector: string;
  description?: string;
  estimated_revenue?: string;
  estimated_valuation?: string;
}

export interface PipelineStats {
  stage: DealStage;
  count: number;
  avgDuration: number;
}

export interface FunnelData {
  stage: DealStage;
  count: number;
  conversionRate: number;
}
