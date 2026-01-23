'use client';

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
  Upload,
  Bot,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Database,
} from 'lucide-react';
import CompanyDetailDialog from '@/components/pipeline/CompanyDetailDialog';

interface CompanyData {
  id: string;
  target: string | null;
  segment: string | null;
  watchlist_status: string | null;
  pipeline_stage: string | null;
  revenue_2021_usd_mn: number | null;
  revenue_2022_usd_mn: number | null;
  revenue_2023_usd_mn: number | null;
  revenue_2024_usd_mn: number | null;
  ebitda_2021_usd_mn: number | null;
  ebitda_2022_usd_mn: number | null;
  ebitda_2023_usd_mn: number | null;
  ebitda_2024_usd_mn: number | null;
  ev_2024: number | null;
  l1_screening_result: string | null;
  created_at: string;
  updated_at: string;
}

interface StageCounts {
  stage: string;
  label: string;
  count: number;
  inbound?: number;
  outbound?: number;
}

const PIPELINE_STAGES: { stage: string; label: string; color: string }[] = [
  { stage: 'L0', label: 'Sourcing', color: 'bg-blue-500' },
  { stage: 'L1', label: 'Screening', color: 'bg-purple-500' },
  { stage: 'L2', label: 'Initial Review', color: 'bg-amber-500' },
  { stage: 'L3', label: 'Due Diligence', color: 'bg-green-500' },
  { stage: 'L4', label: 'Negotiation', color: 'bg-teal-500' },
  { stage: 'L5', label: 'Closing', color: 'bg-pink-500' },
];

const statusColors: Record<string, string> = {
  pass: 'bg-green-500',
  fail: 'bg-red-500',
  pending: 'bg-yellow-500',
  default: 'bg-gray-500',
};

const getStatusColor = (status: string | null): string => {
  if (!status) return statusColors.default;
  const lower = status.toLowerCase();
  return statusColors[lower] || statusColors.default;
};

// Values in database are in USD Millions, so format accordingly
const formatCurrency = (value: number | null): string => {
  if (value === null || value === undefined) return '-';
  // Values are already in millions
  if (value >= 1000) return `$${(value / 1000).toFixed(1)}B`;
  return `$${value.toFixed(1)}M`;
};

const getRevenueChange = (year2023: number | null, year2024: number | null): { direction: 'up' | 'down' | 'flat'; percent: number } => {
  if (!year2023 || !year2024) return { direction: 'flat', percent: 0 };
  const change = ((year2024 - year2023) / year2023) * 100;
  if (change > 1) return { direction: 'up', percent: change };
  if (change < -1) return { direction: 'down', percent: Math.abs(change) };
  return { direction: 'flat', percent: 0 };
};


export default function Dashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [companies, setCompanies] = useState<CompanyData[]>([]);
  const [totalCompanies, setTotalCompanies] = useState(0);
  const [stageCounts, setStageCounts] = useState<StageCounts[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedCompany, setSelectedCompany] = useState<CompanyData | null>(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const itemsPerPage = 5;

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      // Fetch all companies
      const { data: companiesData, error } = await supabase
        .from('companies')
        .select(`
          id,
          target,
          segment,
          watchlist_status,
          pipeline_stage,
          revenue_2021_usd_mn,
          revenue_2022_usd_mn,
          revenue_2023_usd_mn,
          revenue_2024_usd_mn,
          ebitda_2021_usd_mn,
          ebitda_2022_usd_mn,
          ebitda_2023_usd_mn,
          ebitda_2024_usd_mn,
          ev_2024,
          l1_screening_result,
          created_at,
          updated_at
        `)
        .order('updated_at', { ascending: false });

      if (error) throw error;

      if (companiesData) {
        setCompanies(companiesData);
        setTotalCompanies(companiesData.length);

        // Calculate pipeline stage counts
        const stageMap = new Map<string, { count: number; inbound: number; outbound: number }>();
        
        // Initialize all stages
        PIPELINE_STAGES.forEach(({ stage }) => {
          stageMap.set(stage, { count: 0, inbound: 0, outbound: 0 });
        });
        
        companiesData.forEach((company) => {
          const stage = company.pipeline_stage || 'L0';
          const current = stageMap.get(stage) || { count: 0, inbound: 0, outbound: 0 };
          current.count += 1;
          
          // For L0, track inbound vs outbound based on watchlist_status
          if (stage === 'L0') {
            const status = company.watchlist_status?.toLowerCase() || '';
            if (status.includes('inbound') || status === 'active') {
              current.inbound += 1;
            } else {
              current.outbound += 1;
            }
          }
          
          stageMap.set(stage, current);
        });
        
        const counts: StageCounts[] = PIPELINE_STAGES.map(({ stage, label }) => {
          const data = stageMap.get(stage) || { count: 0, inbound: 0, outbound: 0 };
          return {
            stage,
            label,
            count: data.count,
            inbound: data.inbound,
            outbound: data.outbound,
          };
        });
        
        setStageCounts(counts);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Pagination logic
  const totalPages = Math.ceil(companies.length / itemsPerPage);
  const paginatedCompanies = companies.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Get recent companies (last 5 updated)
  const recentCompanies = companies.slice(0, 5);

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

        {/* Pipeline Stages */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Pipeline Stages
            </CardTitle>
          </CardHeader>
          <CardContent>
            {totalCompanies === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Building2 className="mx-auto h-12 w-12 mb-4 opacity-50" />
                <p>No companies in database yet.</p>
              </div>
            ) : (
              <div className="flex items-end gap-4 justify-between" style={{ height: '320px' }}>
                {stageCounts.map((item, index) => {
                  const l0Count = stageCounts[0]?.count || 1;
                  const percentage = l0Count > 0 ? Math.round((item.count / l0Count) * 100) : 0;
                  const barMaxHeight = 200;
                  const barHeight = Math.max((item.count / l0Count) * barMaxHeight, item.count > 0 ? 50 : 20);
                  const stageConfig = PIPELINE_STAGES[index];

                  // Special handling for L0 - show inbound/outbound split
                  if (item.stage === 'L0') {
                    const inboundHeight = item.inbound && item.count > 0 
                      ? (item.inbound / item.count) * barHeight 
                      : barHeight / 2;
                    const outboundHeight = barHeight - inboundHeight;

                    return (
                      <div
                        key={item.stage}
                        className="flex-1 flex flex-col items-center group"
                      >
                        <span className="text-2xl font-bold mb-1">{item.count}</span>
                        <Badge variant="secondary" className="mb-3 text-xs bg-muted text-muted-foreground">
                          100%
                        </Badge>
                        <div
                          className="w-full rounded-xl overflow-hidden transition-transform group-hover:scale-105 flex flex-col"
                          style={{ height: `${barHeight}px` }}
                        >
                          {/* Inbound section */}
                          <div
                            className="w-full bg-blue-600 flex flex-col items-center justify-center"
                            style={{ height: `${inboundHeight}px` }}
                          >
                            <span className="text-white text-[10px] font-medium uppercase tracking-wide">Inbound</span>
                            <span className="text-white font-bold">{item.inbound || 0}</span>
                          </div>
                          {/* Outbound section */}
                          <div
                            className="w-full bg-blue-400 flex flex-col items-center justify-center"
                            style={{ height: `${outboundHeight}px` }}
                          >
                            <span className="text-white text-[10px] font-medium uppercase tracking-wide">Outbound</span>
                            <span className="text-white font-bold">{item.outbound || 0}</span>
                          </div>
                        </div>
                        <div className="text-center mt-3">
                          <div className="font-medium text-sm">{item.stage}</div>
                          <div className="text-xs text-muted-foreground">{item.label}</div>
                        </div>
                      </div>
                    );
                  }

                  return (
                    <div
                      key={item.stage}
                      className="flex-1 flex flex-col items-center group"
                    >
                      <span className="text-2xl font-bold mb-1">{item.count}</span>
                      <Badge variant="secondary" className="mb-3 text-xs bg-muted text-muted-foreground">
                        {percentage}%
                      </Badge>
                      <div
                        className={`w-full rounded-xl flex items-center justify-center transition-transform group-hover:scale-105 ${stageConfig.color}`}
                        style={{ height: `${barHeight}px` }}
                      >
                        {item.count > 0 && (
                          <span className="text-white font-bold text-lg">{item.count}</span>
                        )}
                      </div>
                      <div className="text-center mt-3">
                        <div className="font-medium text-sm">{item.stage}</div>
                        <div className="text-xs text-muted-foreground">{item.label}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Two Column Layout: Company Overview + Recent Activity */}
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
              {companies.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Building2 className="mx-auto h-12 w-12 mb-4 opacity-50" />
                  <p>No companies yet. Import data to get started.</p>
                </div>
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Company</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="text-right">Rev 2022</TableHead>
                          <TableHead className="text-right">Rev 2023</TableHead>
                          <TableHead className="text-right">Rev 2024</TableHead>
                          <TableHead className="text-center">Trend</TableHead>
                          <TableHead className="text-right">EBITDA 2024</TableHead>
                          <TableHead className="text-right">EV 2024</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {paginatedCompanies.map((company) => {
                          const revenueChange = getRevenueChange(company.revenue_2023_usd_mn, company.revenue_2024_usd_mn);
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
                                    {company.target || 'Unknown'}
                                  </button>
                                  <p className="text-xs text-muted-foreground">{company.segment || '-'}</p>
                                </div>
                              </TableCell>
                              <TableCell>
                                {company.l1_screening_result ? (
                                  <Badge className={`${getStatusColor(company.l1_screening_result)} text-white text-xs`}>
                                    {company.l1_screening_result}
                                  </Badge>
                                ) : (
                                  <Badge variant="secondary" className="text-xs">
                                    Pending
                                  </Badge>
                                )}
                              </TableCell>
                              <TableCell className="text-right font-mono text-sm">
                                {formatCurrency(company.revenue_2022_usd_mn)}
                              </TableCell>
                              <TableCell className="text-right font-mono text-sm">
                                {formatCurrency(company.revenue_2023_usd_mn)}
                              </TableCell>
                              <TableCell className="text-right font-mono text-sm">
                                {formatCurrency(company.revenue_2024_usd_mn)}
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
                                {formatCurrency(company.ebitda_2024_usd_mn)}
                              </TableCell>
                              <TableCell className="text-right font-mono text-sm">
                                {formatCurrency(company.ev_2024)}
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
                        Page {currentPage} of {totalPages} ({companies.length} companies)
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
                  company={selectedCompany}
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
                Recent Updates
              </CardTitle>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/master-data">
                  View All <ArrowUpRight className="ml-1 h-4 w-4" />
                </Link>
              </Button>
            </CardHeader>
            <CardContent>
              {recentCompanies.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Building2 className="mx-auto h-12 w-12 mb-4 opacity-50" />
                  <p>No companies yet. Import data to get started.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {recentCompanies.map((company) => (
                    <div
                      key={company.id}
                      className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-2 h-2 rounded-full ${getStatusColor(company.l1_screening_result)}`} />
                        <div>
                          <p className="font-medium text-sm">{company.target || 'Unknown'}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(company.updated_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      {company.l1_screening_result ? (
                        <Badge className={`${getStatusColor(company.l1_screening_result)} text-white text-xs`}>
                          {company.l1_screening_result}
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="text-xs">
                          Pending
                        </Badge>
                      )}
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
