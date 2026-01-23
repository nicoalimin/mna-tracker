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
  const [segmentCounts, setSegmentCounts] = useState<{ segment: string; count: number }[]>([]);
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

        // Calculate segment counts
        const segmentMap = new Map<string, number>();
        companiesData.forEach((company) => {
          const segment = company.segment || 'Unknown';
          segmentMap.set(segment, (segmentMap.get(segment) || 0) + 1);
        });
        
        const counts = Array.from(segmentMap.entries())
          .map(([segment, count]) => ({ segment, count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 6); // Top 6 segments
        setSegmentCounts(counts);
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

        {/* Segment Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Companies by Segment
            </CardTitle>
          </CardHeader>
          <CardContent>
            {segmentCounts.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Building2 className="mx-auto h-12 w-12 mb-4 opacity-50" />
                <p>No companies in database yet.</p>
              </div>
            ) : (
              <div className="flex items-end gap-4 justify-between" style={{ height: '280px' }}>
                {segmentCounts.map((item, index) => {
                  const maxCount = Math.max(...segmentCounts.map(s => s.count), 1);
                  const barMaxHeight = 180;
                  const barHeight = Math.max((item.count / maxCount) * barMaxHeight, 40);

                  const colors = [
                    'bg-blue-500',
                    'bg-green-500',
                    'bg-purple-500',
                    'bg-orange-500',
                    'bg-pink-500',
                    'bg-teal-500',
                  ];

                  return (
                    <div
                      key={item.segment}
                      className="flex-1 flex flex-col items-center group"
                    >
                      <span className="text-2xl font-bold mb-1">{item.count}</span>
                      <Badge variant="secondary" className="mb-3 text-xs bg-muted text-muted-foreground">
                        {totalCompanies > 0 ? Math.round((item.count / totalCompanies) * 100) : 0}%
                      </Badge>
                      <div
                        className={`w-full rounded-xl flex items-center justify-center transition-transform group-hover:scale-105 ${colors[index % colors.length]}`}
                        style={{ height: `${barHeight}px` }}
                      >
                        {item.count > 0 && (
                          <span className="text-white font-bold text-lg">{item.count}</span>
                        )}
                      </div>
                      <div className="text-center mt-3">
                        <div className="text-xs text-muted-foreground truncate max-w-[80px]" title={item.segment}>
                          {item.segment}
                        </div>
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
