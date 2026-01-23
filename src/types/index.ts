export type PipelineStage = 'L0' | 'L1' | 'L2' | 'L3' | 'L4' | 'L5';

export interface Company {
  id: string;
  company_name: string;
  sector: string;
  source: string;
  status: PipelineStage;
  revenue_y1: number;
  revenue_y2: number;
  revenue_y3: number;
  trend: string;
  ebitda_y1: number;
  ebitda_y2: number;
  ebitda_y3: number;
  valuation: number;
  added_at: string;
}

export interface Filter {
  id: string;
  company_id: string;
  content: string;
  created_at: string;
}

export interface CompanyWithFilters extends Company {
  filters: Filter[];
}
