-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Create Enums
DO $$ BEGIN
    CREATE TYPE screening_state AS ENUM ('pending', 'completed', 'failed');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Table: companies
CREATE TABLE IF NOT EXISTS companies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    entry_id SERIAL,
    watchlist_id INTEGER,
    target TEXT,
    segment TEXT,
    segment_related_offerings TEXT,
    company_focus TEXT,
    website TEXT,
    watchlist_status TEXT,
    pipeline_stage TEXT,
    comments TEXT,
    ownership TEXT,
    geography TEXT,
    
    -- Revenue (USD Mn)
    revenue_2021_usd_mn NUMERIC,
    revenue_2022_usd_mn NUMERIC,
    revenue_2023_usd_mn NUMERIC,
    revenue_2024_usd_mn NUMERIC,
    
    -- EBITDA (USD Mn)
    ebitda_2021_usd_mn NUMERIC,
    ebitda_2022_usd_mn NUMERIC,
    ebitda_2023_usd_mn NUMERIC,
    ebitda_2024_usd_mn NUMERIC,
    
    -- EBITDA Margin
    ebitda_margin_2021 NUMERIC,
    ebitda_margin_2022 NUMERIC,
    ebitda_margin_2023 NUMERIC,
    ebitda_margin_2024 NUMERIC,
    
    -- Valuation
    ev_2024 NUMERIC,
    ev_ebitda_2024 NUMERIC,
    
    -- FX Assumptions & Rationale
    fx_currency TEXT,
    fx_rationale TEXT,
    fx_assumed_forex_2021 NUMERIC,
    fx_assumed_forex_2022 NUMERIC,
    fx_assumed_forex_2023 NUMERIC,
    fx_assumed_forex_2024 NUMERIC,
    
    -- FX Derived Metrics
    fx_revenue_2021 NUMERIC,
    fx_revenue_2022 NUMERIC,
    fx_revenue_2023 NUMERIC,
    fx_revenue_2024 NUMERIC,
    fx_forex_change_2021_2022 NUMERIC,
    fx_forex_change_2022_2023 NUMERIC,
    fx_forex_change_2023_2024 NUMERIC,
    
    -- Growth Metrics
    revenue_cagr_2021_2022 NUMERIC,
    revenue_cagr_2022_2023 NUMERIC,
    revenue_cagr_2023_2024 NUMERIC,
    
    fx_revenue_cagr_domestic_2021_2022 NUMERIC,
    fx_revenue_cagr_domestic_2022_2023 NUMERIC,
    fx_revenue_cagr_domestic_2023_2024 NUMERIC,
    
    -- Segment Revenue
    segment_revenue NUMERIC,
    segment_ebitda NUMERIC,
    combined_segment_revenue TEXT,
    segment_revenue_total_ratio NUMERIC,
    segment_specific_revenue_pct NUMERIC,
    
    -- Screening / Logic Flags (L0/L1) - Mostly strings or numerics
    l0_revenue_2024_usd_mn NUMERIC,
    l0_ev_usd_mn NUMERIC,
    l0_ev_2024_usd_mn NUMERIC,
    l0_ev_ebitda_2024 NUMERIC,
    l0_ebitda_2024_usd_mn NUMERIC,
    
    l1_screening_result TEXT,
    l1_rationale TEXT,
    l1_vision_fit TEXT,
    l1_priority_geo_flag TEXT,
    l1_ev_below_threshold TEXT,
    l1_revenue_cagr_l3y NUMERIC,
    l1_revenue_cagr_n3y NUMERIC,
    l1_revenue_drop_count INTEGER,
    l1_revenue_no_consecutive_drop_usd TEXT,
    l1_ebitda_below_threshold_count INTEGER,
    
    fx_ebitda_above_10_l3y TEXT,
    fx_revenue_drop_count INTEGER,
    fx_revenue_no_consecutive_drop_local TEXT,
    
    revenue_from_priority_geo_flag TEXT,
    pct_from_domestic NUMERIC,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table: users
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT UNIQUE,
    name TEXT,
    password TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table: criterias
CREATE TABLE IF NOT EXISTS criterias (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    prompt TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table: company_criterias
CREATE TABLE IF NOT EXISTS company_criterias (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    criteria_id UUID REFERENCES criterias(id) ON DELETE CASCADE,
    result TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table: company_logs
CREATE TABLE IF NOT EXISTS company_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID REFERENCES companies(id),
    user_id UUID REFERENCES users(id),
    action TEXT NOT NULL,
    -- ... lots of optional snapshot fields ...
    -- Simplified for brevity, usually stores snapshot of company state
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table: deal_documents
CREATE TABLE IF NOT EXISTS deal_documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    deal_id UUID REFERENCES companies(id),
    file_name TEXT NOT NULL,
    file_path TEXT NOT NULL,
    file_size BIGINT,
    mime_type TEXT,
    stage TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table: deal_links
CREATE TABLE IF NOT EXISTS deal_links (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    deal_id UUID REFERENCES companies(id),
    url TEXT NOT NULL,
    title TEXT,
    stage TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table: deal_notes
CREATE TABLE IF NOT EXISTS deal_notes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    deal_id UUID REFERENCES companies(id),
    content TEXT NOT NULL,
    stage TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table: deal_stage_history
CREATE TABLE IF NOT EXISTS deal_stage_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    deal_id UUID REFERENCES companies(id),
    stage TEXT NOT NULL,
    entered_at TIMESTAMP WITH TIME ZONE,
    exited_at TIMESTAMP WITH TIME ZONE,
    duration_seconds INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table: investment_thesis
CREATE TABLE IF NOT EXISTS investment_thesis (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    is_active BOOLEAN DEFAULT false,
    scan_frequency TEXT,
    last_scan_at TIMESTAMP WITH TIME ZONE,
    next_scan_at TIMESTAMP WITH TIME ZONE,
    sources_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table: market_screening_results
CREATE TABLE IF NOT EXISTS market_screening_results (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_name TEXT NOT NULL,
    match_score NUMERIC,
    match_reason TEXT,
    sector TEXT,
    website TEXT,
    description TEXT,
    estimated_revenue TEXT,
    estimated_valuation TEXT,
    is_added_to_pipeline BOOLEAN DEFAULT false,
    discovered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table: screenings
CREATE TABLE IF NOT EXISTS screenings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID REFERENCES companies(id),
    criteria_id UUID REFERENCES criterias(id),
    result TEXT,
    remarks TEXT,
    state screening_state DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table: past_acquisitions (from types.ts + usage)
CREATE TABLE IF NOT EXISTS past_acquisitions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    no TEXT,
    project_name TEXT,
    project_type TEXT,
    target_co_partner TEXT,
    seller TEXT,
    country TEXT,
    sector TEXT,
    year TEXT,
    status TEXT,
    internal_stage TEXT,
    
    -- Financials (kept as text based on types.ts, should ideally be numeric but sticking to types)
    revenue_usd_m TEXT,
    ebitda_usd_m TEXT,
    ev_100_pct_usd_m TEXT,
    equity_value TEXT,
    estimated_debt_usd_m TEXT,
    investment_value TEXT,
    ebitda_margin_pct TEXT,
    nim_pct TEXT,
    fcf_conv TEXT,
    
    -- Historical
    revenue_2021_usd_m TEXT,
    revenue_2022_usd_m TEXT,
    revenue_2023_usd_m TEXT,
    revenue_2024_usd_m TEXT,
    
    ebitda_2021_usd_m TEXT,
    ebitda_2022_usd_m TEXT,
    ebitda_2023_usd_m TEXT,
    ebitda_2024_usd_m TEXT,
    
    ebitda_margin_2021 TEXT,
    ebitda_margin_2022 TEXT,
    ebitda_margin_2023 TEXT,
    ebitda_margin_2024 TEXT,
    
    -- Growth
    cagr_2021_2022 TEXT,
    cagr_2022_2023 TEXT,
    cagr_2023_2024 TEXT,
    revenue_cagr_l3y TEXT,
    revenue_drop_count TEXT,
    revenue_stability_no_consecutive_drop TEXT,
    
    -- Screening
    pass_l0_screening TEXT,
    reason_to_drop TEXT,
    on_hold_reason TEXT,
    l0_date TEXT,
    pass_all_5_l1_criteria TEXT,
    
    -- L1 Criteria
    vision_alignment_25pct_revenue TEXT,
    priority_geography_50pct_revenue TEXT,
    ev_value_under_1b TEXT,
    ebitda_over_10pct_l3y TEXT,
    willingness_to_sell TEXT,
    
    -- Product/Strat
    main_products TEXT,
    company_website TEXT,
    fit_with_priority_product_groups TEXT,
    details_on_product_fit TEXT,
    pct_revenue_from_priority_segments TEXT,
    geography_breakdown_of_revenue TEXT,
    
    source TEXT,
    type_of_source TEXT,
    internal_source TEXT,
    name_of_advisors TEXT,
    prioritization TEXT,
    stake TEXT,
    company_website_url TEXT, -- duplicate check? types had company_website
    
    comments TEXT,
    assumption TEXT,
    description TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table: minutes_of_meeting (Inferred)
CREATE TABLE IF NOT EXISTS minutes_of_meeting (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    file_name TEXT NOT NULL,
    file_link TEXT NOT NULL,
    processing_status TEXT DEFAULT 'processing', -- processing, completed, failed
    file_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    raw_notes TEXT,
    structured_notes JSONB,
    tags TEXT[],
    matched_companies JSONB,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table: inven_cache (Inferred)
CREATE TABLE IF NOT EXISTS inven_cache (
    -- Assuming inven_company_id is unique enough to be PK or we use an internal ID
    inven_company_id TEXT PRIMARY KEY, 
    domain TEXT,
    inven_company_name TEXT,
    website TEXT,
    linkedin TEXT,
    description TEXT,
    logo_url TEXT,
    
    headcount_min INTEGER,
    headcount_max INTEGER,
    employee_count INTEGER,
    
    revenue_estimate_usd_millions TEXT, -- Use text to be safe or NUMERIC
    ownership TEXT,
    founded_year INTEGER,
    
    headquarters_city TEXT,
    headquarters_state TEXT,
    headquarters_country_code TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
