"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { supabase } from '@/integrations/supabase/client';
import {
  Building2,
  TrendingUp,
  TrendingDown,
  Minus,
  Clock,
  ArrowUpRight,
  Database,
  Loader2,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import type { DealStage, L1Status } from '@/lib/types';
import CompanyDetailDialog from '@/components/pipeline/CompanyDetailDialog';

interface StageCount {
  stage: DealStage;
  count: number;
  inbound?: number;
  outbound?: number;
}

interface RecentDeal {
  id: string;
  company_name: string;
  current_stage: DealStage;
  source: string;
  updated_at: string;
}

interface CompanyMetric {
  id: string;
  company_id: string;
  name: string;
  sector: string;
  source: string;
  revenue_year1: number | null;
  revenue_year2: number | null;
  revenue_year3: number | null;
  ebitda_year1: number | null;
  ebitda_year2: number | null;
  ebitda_year3: number | null;
  valuation: number | null;
  current_stage: DealStage;
  l1_status: L1Status | null;
  l1_filter_results: any;
  created_at: string;
  updated_at: string;
}

const stageLabels: Record<DealStage, string> = {
  L0: 'Sourcing',
  L1: 'Screening',
  L2: 'Initial Review',
  L3: 'Due Diligence',
  L4: 'Negotiation',
  L5: 'Closing',
};

const stageColors: Record<DealStage, string> = {
  L0: 'bg-stage-l0',
  L1: 'bg-stage-l1',
  L2: 'bg-stage-l2',
  L3: 'bg-stage-l3',
  L4: 'bg-stage-l4',
  L5: 'bg-stage-l5',
};

const formatCurrency = (value: number | null): string => {
  if (value === null || value === undefined) return '-';
  if (value >= 1000000000) return `$${(value / 1000000000).toFixed(1)}B`;
  if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
  if (value >= 1000) return `$${(value / 1000).toFixed(1)}K`;
  return `$${value.toFixed(0)}`;
};

const getRevenueChange = (year2: number | null, year3: number | null): { direction: 'up' | 'down' | 'flat'; percent: number } => {
  if (!year2 || !year3) return { direction: 'flat', percent: 0 };
  const change = ((year3 - year2) / year2) * 100;
  if (change > 1) return { direction: 'up', percent: change };
  if (change < -1) return { direction: 'down', percent: Math.abs(change) };
  return { direction: 'flat', percent: 0 };
};

// Mock data for preview
const mockStageCounts: StageCount[] = [
  { stage: 'L0', count: 24, inbound: 14, outbound: 10 },
  { stage: 'L1', count: 18, inbound: 10, outbound: 8 },
  { stage: 'L2', count: 12, inbound: 7, outbound: 5 },
  { stage: 'L3', count: 8, inbound: 5, outbound: 3 },
  { stage: 'L4', count: 5, inbound: 3, outbound: 2 },
  { stage: 'L5', count: 3, inbound: 2, outbound: 1 },
];

const mockRecentDeals: RecentDeal[] = [
  { id: '1', company_name: 'TechFlow Analytics', current_stage: 'L3', source: 'outbound', updated_at: new Date().toISOString() },
  { id: '2', company_name: 'DataSphere Inc', current_stage: 'L2', source: 'inbound', updated_at: new Date(Date.now() - 86400000).toISOString() },
  { id: '3', company_name: 'CloudNine Solutions', current_stage: 'L4', source: 'inbound', updated_at: new Date(Date.now() - 172800000).toISOString() },
  { id: '4', company_name: 'QuantumLeap AI', current_stage: 'L1', source: 'outbound', updated_at: new Date(Date.now() - 259200000).toISOString() },
  { id: '5', company_name: 'NexGen Robotics', current_stage: 'L2', source: 'inbound', updated_at: new Date(Date.now() - 345600000).toISOString() },
];

const mockCompanyMetrics: CompanyMetric[] = [
  { id: '1', company_id: 'c1', name: 'TechFlow Analytics', sector: 'Enterprise Software', source: 'outbound', revenue_year1: 45000000, revenue_year2: 58000000, revenue_year3: 72000000, ebitda_year1: 9000000, ebitda_year2: 12000000, ebitda_year3: 15000000, valuation: 280000000, current_stage: 'L3', l1_status: 'Pass', l1_filter_results: null, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: '2', company_id: 'c2', name: 'DataSphere Inc', sector: 'Data Analytics', source: 'inbound', revenue_year1: 32000000, revenue_year2: 41000000, revenue_year3: 53000000, ebitda_year1: 6400000, ebitda_year2: 8200000, ebitda_year3: 10600000, valuation: 195000000, current_stage: 'L2', l1_status: 'Pass', l1_filter_results: null, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: '3', company_id: 'c3', name: 'CloudNine Solutions', sector: 'Cloud Infrastructure', source: 'inbound', revenue_year1: 89000000, revenue_year2: 112000000, revenue_year3: 145000000, ebitda_year1: 17800000, ebitda_year2: 22400000, ebitda_year3: 29000000, valuation: 520000000, current_stage: 'L4', l1_status: 'Pass', l1_filter_results: null, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: '4', company_id: 'c4', name: 'QuantumLeap AI', sector: 'Artificial Intelligence', source: 'outbound', revenue_year1: 18000000, revenue_year2: 28000000, revenue_year3: 42000000, ebitda_year1: 3600000, ebitda_year2: 5600000, ebitda_year3: 8400000, valuation: 165000000, current_stage: 'L1', l1_status: null, l1_filter_results: null, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: '5', company_id: 'c5', name: 'NexGen Robotics', sector: 'Industrial Automation', source: 'inbound', revenue_year1: 67000000, revenue_year2: 78000000, revenue_year3: 91000000, ebitda_year1: 13400000, ebitda_year2: 15600000, ebitda_year3: 18200000, valuation: 340000000, current_stage: 'L2', l1_status: 'Pass', l1_filter_results: null, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: '6', company_id: 'c6', name: 'FinStack Technologies', sector: 'Fintech', source: 'outbound', revenue_year1: 23000000, revenue_year2: 35000000, revenue_year3: 48000000, ebitda_year1: 4600000, ebitda_year2: 7000000, ebitda_year3: 9600000, valuation: 180000000, current_stage: 'L1', l1_status: null, l1_filter_results: null, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: '7', company_id: 'c7', name: 'SecureNet Cyber', sector: 'Cybersecurity', source: 'inbound', revenue_year1: 56000000, revenue_year2: 68000000, revenue_year3: 82000000, ebitda_year1: 11200000, ebitda_year2: 13600000, ebitda_year3: 16400000, valuation: 305000000, current_stage: 'L3', l1_status: 'Pass', l1_filter_results: null, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: '8', company_id: 'c8', name: 'HealthBridge Systems', sector: 'Healthcare IT', source: 'inbound', revenue_year1: 38000000, revenue_year2: 44000000, revenue_year3: 51000000, ebitda_year1: 7600000, ebitda_year2: 8800000, ebitda_year3: 10200000, valuation: 190000000, current_stage: 'L2', l1_status: 'Pass', l1_filter_results: null, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
];

export default function Dashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [stageCounts, setStageCounts] = useState<StageCount[]>([]);
  const [totalDeals, setTotalDeals] = useState(0);
  const [recentDeals, setRecentDeals] = useState<RecentDeal[]>([]);
  const [sourceBreakdown, setSourceBreakdown] = useState({ inbound: 0, outbound: 0 });
  const [companyMetrics, setCompanyMetrics] = useState<CompanyMetric[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedCompany, setSelectedCompany] = useState<CompanyMetric | null>(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const itemsPerPage = 5;

  const handleStageClick = (stage: DealStage) => {
    router.push(`/pipeline?stage=${stage}`);
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      // Fetch all deals with company info
      const { data: deals, error } = await supabase
        .from('deals')
        .select(`
          id,
          current_stage,
          updated_at,
          company:companies (
            id,
            name,
            sector,
            source,
            revenue_year1,
            revenue_year2,
            revenue_year3,
            ebitda_year1,
            ebitda_year2,
            ebitda_year3,
            valuation
          )
        `)
        .eq('is_active', true)
        .order('updated_at', { ascending: false });

      if (error) throw error;

      // If no real data, use mock data for preview
      if (!deals || deals.length === 0) {
        setStageCounts(mockStageCounts);
        setTotalDeals(70);
        setSourceBreakdown({ inbound: 41, outbound: 29 });
        setRecentDeals(mockRecentDeals);
        setCompanyMetrics(mockCompanyMetrics);
        setLoading(false);
        return;
      }

      if (deals) {
        // Calculate stage counts with source breakdown for L0
        const counts: Record<DealStage, { total: number; inbound: number; outbound: number }> = {
          L0: { total: 0, inbound: 0, outbound: 0 },
          L1: { total: 0, inbound: 0, outbound: 0 },
          L2: { total: 0, inbound: 0, outbound: 0 },
          L3: { total: 0, inbound: 0, outbound: 0 },
          L4: { total: 0, inbound: 0, outbound: 0 },
          L5: { total: 0, inbound: 0, outbound: 0 },
        };
        let inbound = 0;
        let outbound = 0;

        deals.forEach((deal: any) => {
          const stage = deal.current_stage as DealStage;
          counts[stage].total++;
          if (deal.company?.source === 'inbound') {
            inbound++;
            counts[stage].inbound++;
          } else if (deal.company?.source === 'outbound') {
            outbound++;
            counts[stage].outbound++;
          }
        });

        setStageCounts(
          Object.entries(counts).map(([stage, data]) => ({
            stage: stage as DealStage,
            count: data.total,
            inbound: data.inbound,
            outbound: data.outbound,
          }))
        );

        setTotalDeals(deals.length);
        setSourceBreakdown({ inbound, outbound });

        // Get recent deals
        const recent = deals.slice(0, 5).map((deal: any) => ({
          id: deal.id,
          company_name: deal.company?.name || 'Unknown',
          current_stage: deal.current_stage,
          source: deal.company?.source || 'unknown',
          updated_at: deal.updated_at,
        }));
        setRecentDeals(recent);

        // Get company metrics for table
        const metrics = deals.map((deal: any) => ({
          id: deal.id,
          company_id: deal.company?.id || '',
          name: deal.company?.name || 'Unknown',
          sector: deal.company?.sector || '',
          source: deal.company?.source || 'unknown',
          revenue_year1: deal.company?.revenue_year1,
          revenue_year2: deal.company?.revenue_year2,
          revenue_year3: deal.company?.revenue_year3,
          ebitda_year1: deal.company?.ebitda_year1,
          ebitda_year2: deal.company?.ebitda_year2,
          ebitda_year3: deal.company?.ebitda_year3,
          valuation: deal.company?.valuation,
          current_stage: deal.current_stage as DealStage,
          l1_status: deal.l1_status || null,
          l1_filter_results: deal.l1_filter_results || null,
          created_at: deal.created_at,
          updated_at: deal.updated_at,
        }));
        setCompanyMetrics(metrics);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      // On error, also show mock data
      setStageCounts(mockStageCounts);
      setTotalDeals(70);
      setSourceBreakdown({ inbound: 41, outbound: 29 });
      setRecentDeals(mockRecentDeals);
      setCompanyMetrics(mockCompanyMetrics);
    } finally {
      setLoading(false);
    }
  };

  // Pagination logic
  const totalPages = Math.ceil(companyMetrics.length / itemsPerPage);
  const paginatedMetrics = companyMetrics.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex h-full items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6 animate-fade-in">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
            <p className="text-muted-foreground">Overview of your M&A deal pipeline</p>
          </div>
        </div>

        {/* Pipeline Funnel */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Pipeline Stages
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end gap-4 justify-between" style={{ height: '280px' }}>
              {stageCounts.map((item, index) => {
                const maxCount = Math.max(...stageCounts.map(s => s.count), 1);
                const l0Count = stageCounts.find(s => s.stage === 'L0')?.count || 1;
                const conversionPercent = l0Count > 0 ? Math.round((item.count / l0Count) * 100) : 0;

                // Calculate bar height - max height is 180px
                const barMaxHeight = 180;
                const barHeight = Math.max((item.count / maxCount) * barMaxHeight, 40);

                if (item.stage === 'L0') {
                  const inboundRatio = item.count > 0 ? (item.inbound || 0) / item.count : 0.5;
                  const outboundRatio = item.count > 0 ? (item.outbound || 0) / item.count : 0.5;

                  return (
                    <div
                      key={item.stage}
                      className="flex-1 flex flex-col items-center cursor-pointer group"
                      onClick={() => handleStageClick(item.stage)}
                    >
                      {/* Count */}
                      <span className="text-2xl font-bold mb-1">{item.count}</span>
                      {/* Conversion Badge */}
                      <Badge variant="secondary" className="mb-3 text-xs bg-primary/10 text-primary">
                        100%
                      </Badge>
                      {/* Stacked Bar */}
                      <div
                        className="w-full rounded-xl overflow-hidden flex flex-col transition-transform group-hover:scale-105"
                        style={{ height: `${barHeight}px` }}
                      >
                        {/* Inbound (top) - using primary color */}
                        <div
                          className="w-full bg-stage-l0 flex items-center justify-center"
                          style={{ height: `${inboundRatio * 100}%` }}
                        >
                          <div className="text-white text-xs font-medium text-center px-1">
                            <div className="opacity-80 text-[10px]">INBOUND</div>
                            <div className="font-bold">{item.inbound || 0}</div>
                          </div>
                        </div>
                        {/* Outbound (bottom) - darker shade */}
                        <div
                          className="w-full flex items-center justify-center"
                          style={{
                            height: `${outboundRatio * 100}%`,
                            backgroundColor: 'hsl(217, 91%, 45%)'
                          }}
                        >
                          <div className="text-white text-xs font-medium text-center px-1">
                            <div className="opacity-80 text-[10px]">OUTBOUND</div>
                            <div className="font-bold">{item.outbound || 0}</div>
                          </div>
                        </div>
                      </div>
                      {/* Stage Label */}
                      <div className="text-center mt-3">
                        <div className="text-sm font-semibold">{item.stage}</div>
                        <div className="text-xs text-muted-foreground">{stageLabels[item.stage]}</div>
                      </div>
                    </div>
                  );
                }

                return (
                  <div
                    key={item.stage}
                    className="flex-1 flex flex-col items-center cursor-pointer group"
                    onClick={() => handleStageClick(item.stage)}
                  >
                    {/* Count */}
                    <span className="text-2xl font-bold mb-1">{item.count}</span>
                    {/* Conversion Badge */}
                    <Badge variant="secondary" className="mb-3 text-xs bg-muted text-muted-foreground">
                      {conversionPercent}%
                    </Badge>
                    {/* Bar with stage color */}
                    <div
                      className={`w-full rounded-xl flex items-center justify-center transition-transform group-hover:scale-105 ${stageColors[item.stage]}`}
                      style={{ height: `${barHeight}px` }}
                    >
                      {item.count > 0 && (
                        <span className="text-white font-bold text-lg">{item.count}</span>
                      )}
                    </div>
                    {/* Stage Label */}
                    <div className="text-center mt-3">
                      <div className="text-sm font-semibold">{item.stage}</div>
                      <div className="text-xs text-muted-foreground">{stageLabels[item.stage]}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Two Column Layout: Company Metrics + Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Company Overview Table */}
          <Card className="lg:col-span-2">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Company Overview
              </CardTitle>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/master-data">
                  View All <ArrowUpRight className="ml-1 h-4 w-4" />
                </Link>
              </Button>
            </CardHeader>
            <CardContent>
              {companyMetrics.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Building2 className="mx-auto h-12 w-12 mb-4 opacity-50" />
                  <p>No companies yet.</p>
                </div>
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Company</TableHead>
                          <TableHead>Stage</TableHead>
                          <TableHead className="text-right">Rev Y1</TableHead>
                          <TableHead className="text-right">Rev Y2</TableHead>
                          <TableHead className="text-right">Rev Y3</TableHead>
                          <TableHead className="text-center">Trend</TableHead>
                          <TableHead className="text-right">EBITDA Y3</TableHead>
                          <TableHead className="text-right">Valuation</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {paginatedMetrics.map((company) => {
                          const revenueChange = getRevenueChange(company.revenue_year2, company.revenue_year3);
                          return (
                            <TableRow key={company.id}>
                              <TableCell>
                                <div>
                                  <button
                                    onClick={() => {
                                      setSelectedCompany(company);
                                      setDetailDialogOpen(true);
                                    }}
                                    className="font-medium text-left hover:text-primary hover:underline transition-colors"
                                  >
                                    {company.name}
                                  </button>
                                  <p className="text-xs text-muted-foreground">{company.sector}</p>
                                </div>
                              </TableCell>
                              <TableCell>
                                <Badge className={`${stageColors[company.current_stage]} text-white text-xs`}>
                                  {company.current_stage}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-right font-mono text-sm">
                                {formatCurrency(company.revenue_year1)}
                              </TableCell>
                              <TableCell className="text-right font-mono text-sm">
                                {formatCurrency(company.revenue_year2)}
                              </TableCell>
                              <TableCell className="text-right font-mono text-sm">
                                {formatCurrency(company.revenue_year3)}
                              </TableCell>
                              <TableCell className="text-center">
                                {revenueChange.direction === 'up' && (
                                  <span className="flex items-center justify-center text-green-600">
                                    <TrendingUp className="h-4 w-4" />
                                  </span>
                                )}
                                {revenueChange.direction === 'down' && (
                                  <span className="flex items-center justify-center text-red-600">
                                    <TrendingDown className="h-4 w-4" />
                                  </span>
                                )}
                                {revenueChange.direction === 'flat' && (
                                  <Minus className="h-4 w-4 mx-auto text-muted-foreground" />
                                )}
                              </TableCell>
                              <TableCell className="text-right font-mono text-sm">
                                {formatCurrency(company.ebitda_year3)}
                              </TableCell>
                              <TableCell className="text-right font-mono text-sm">
                                {formatCurrency(company.valuation)}
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="flex items-center justify-between mt-4 pt-4 border-t">
                      <p className="text-sm text-muted-foreground">
                        Page {currentPage} of {totalPages} ({companyMetrics.length} companies)
                      </p>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                          disabled={currentPage === 1}
                        >
                          <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                          disabled={currentPage === totalPages}
                        >
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              )}

              {selectedCompany && (
                <CompanyDetailDialog
                  company={{
                    id: selectedCompany.id,
                    company_id: selectedCompany.company_id,
                    name: selectedCompany.name,
                    sector: selectedCompany.sector,
                    source: selectedCompany.source,
                    revenue_year1: selectedCompany.revenue_year1,
                    revenue_year2: selectedCompany.revenue_year2,
                    revenue_year3: selectedCompany.revenue_year3,
                    ebitda_year1: selectedCompany.ebitda_year1,
                    ebitda_year2: selectedCompany.ebitda_year2,
                    ebitda_year3: selectedCompany.ebitda_year3,
                    valuation: selectedCompany.valuation,
                    current_stage: selectedCompany.current_stage,
                    l1_status: selectedCompany.l1_status,
                    l1_filter_results: selectedCompany.l1_filter_results,
                    created_at: selectedCompany.created_at,
                    updated_at: selectedCompany.updated_at,
                  }}
                  open={detailDialogOpen}
                  onOpenChange={setDetailDialogOpen}
                  onUpdate={() => fetchDashboardData()}
                />
              )}
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Recent Activity
              </CardTitle>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/pipeline">
                  View All <ArrowUpRight className="ml-1 h-4 w-4" />
                </Link>
              </Button>
            </CardHeader>
            <CardContent>
              {recentDeals.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Building2 className="mx-auto h-12 w-12 mb-4 opacity-50" />
                  <p>No deals yet. Start by adding companies in the Pipeline!</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {recentDeals.map((deal) => (
                    <div
                      key={deal.id}
                      className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-2 h-2 rounded-full ${stageColors[deal.current_stage]}`} />
                        <div>
                          <p className="font-medium text-sm">{deal.company_name}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(deal.updated_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <Badge className={`${stageColors[deal.current_stage]} text-white text-xs`}>
                        {deal.current_stage}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
