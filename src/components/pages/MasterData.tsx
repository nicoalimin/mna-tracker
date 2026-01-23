"use client";

import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import {
  Database,
  Search,
  Loader2,
  Building2,
  TrendingUp,
  TrendingDown,
  Minus,
  CheckCircle2,
} from 'lucide-react';
import type { DealStage } from '@/lib/types';

interface CompanyWithDeal {
  id: string;
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
  created_at: string;
  deal_id: string;
  current_stage: DealStage;
  is_active: boolean;
}

const stageLabels: Record<DealStage | 'Acquired', string> = {
  L0: 'Sourcing',
  L1: 'Screening',
  L2: 'Initial Review',
  L3: 'Due Diligence',
  L4: 'Negotiation',
  L5: 'Closing',
  Acquired: 'Acquired',
};

const stageColors: Record<DealStage | 'Acquired', string> = {
  L0: 'bg-stage-l0',
  L1: 'bg-stage-l1',
  L2: 'bg-stage-l2',
  L3: 'bg-stage-l3',
  L4: 'bg-stage-l4',
  L5: 'bg-stage-l5',
  Acquired: 'bg-green-600',
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

export default function MasterData() {
  const [companies, setCompanies] = useState<CompanyWithDeal[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [stageFilter, setStageFilter] = useState<string>('all');
  const [sectorFilter, setSectorFilter] = useState<string>('all');
  const [sourceFilter, setSourceFilter] = useState<string>('all');

  useEffect(() => {
    fetchCompanies();
  }, []);

  const fetchCompanies = async () => {
    try {
      const { data, error } = await supabase
        .from('deals')
        .select(`
          id,
          current_stage,
          is_active,
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
            valuation,
            created_at
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (data) {
        const formatted = data.map((deal: any) => ({
          id: deal.company?.id,
          name: deal.company?.name || 'Unknown',
          sector: deal.company?.sector || '',
          source: deal.company?.source || '',
          revenue_year1: deal.company?.revenue_year1,
          revenue_year2: deal.company?.revenue_year2,
          revenue_year3: deal.company?.revenue_year3,
          ebitda_year1: deal.company?.ebitda_year1,
          ebitda_year2: deal.company?.ebitda_year2,
          ebitda_year3: deal.company?.ebitda_year3,
          valuation: deal.company?.valuation,
          created_at: deal.company?.created_at,
          deal_id: deal.id,
          current_stage: deal.current_stage as DealStage,
          is_active: deal.is_active,
        }));
        setCompanies(formatted);
      }
    } catch (error) {
      console.error('Error fetching companies:', error);
    } finally {
      setLoading(false);
    }
  };

  const getDisplayStage = (company: CompanyWithDeal): DealStage | 'Acquired' => {
    if (!company.is_active && company.current_stage === 'L5') {
      return 'Acquired';
    }
    return company.current_stage;
  };

  const uniqueSectors = [...new Set(companies.map(c => c.sector).filter(Boolean))];

  const filteredCompanies = companies.filter(company => {
    const matchesSearch = company.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      company.sector.toLowerCase().includes(searchQuery.toLowerCase());

    const displayStage = getDisplayStage(company);
    const matchesStage = stageFilter === 'all' || displayStage === stageFilter;
    const matchesSector = sectorFilter === 'all' || company.sector === sectorFilter;
    const matchesSource = sourceFilter === 'all' || company.source === sourceFilter;

    return matchesSearch && matchesStage && matchesSector && matchesSource;
  });

  const stats = {
    total: companies.length,
    active: companies.filter(c => c.is_active).length,
    acquired: companies.filter(c => !c.is_active && c.current_stage === 'L5').length,
    byStage: {
      L0: companies.filter(c => c.current_stage === 'L0' && c.is_active).length,
      L1: companies.filter(c => c.current_stage === 'L1' && c.is_active).length,
      L2: companies.filter(c => c.current_stage === 'L2' && c.is_active).length,
      L3: companies.filter(c => c.current_stage === 'L3' && c.is_active).length,
      L4: companies.filter(c => c.current_stage === 'L4' && c.is_active).length,
      L5: companies.filter(c => c.current_stage === 'L5' && c.is_active).length,
    },
  };

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
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Master Data</h1>
            <p className="text-muted-foreground">Complete overview of all companies in the system</p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2">
                <Database className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Total</span>
              </div>
              <p className="text-2xl font-bold mt-1">{stats.total}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4 text-blue-500" />
                <span className="text-sm text-muted-foreground">Active</span>
              </div>
              <p className="text-2xl font-bold mt-1">{stats.active}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                <span className="text-sm text-muted-foreground">Acquired</span>
              </div>
              <p className="text-2xl font-bold mt-1">{stats.acquired}</p>
            </CardContent>
          </Card>
          <Card className="col-span-2">
            <CardContent className="pt-4">
              <div className="text-sm text-muted-foreground mb-2">By Stage</div>
              <div className="flex gap-2 flex-wrap">
                {Object.entries(stats.byStage).map(([stage, count]) => (
                  <Badge key={stage} variant="secondary" className="text-xs">
                    {stage}: {count}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="pt-4">
            <div className="flex flex-wrap gap-4">
              <div className="flex-1 min-w-[200px]">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search companies..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>
              <Select value={stageFilter} onValueChange={setStageFilter}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Stage" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Stages</SelectItem>
                  <SelectItem value="L0">L0 - Sourcing</SelectItem>
                  <SelectItem value="L1">L1 - Screening</SelectItem>
                  <SelectItem value="L2">L2 - Initial Review</SelectItem>
                  <SelectItem value="L3">L3 - Due Diligence</SelectItem>
                  <SelectItem value="L4">L4 - Negotiation</SelectItem>
                  <SelectItem value="L5">L5 - Closing</SelectItem>
                  <SelectItem value="Acquired">Acquired</SelectItem>
                </SelectContent>
              </Select>
              <Select value={sectorFilter} onValueChange={setSectorFilter}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Sector" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Sectors</SelectItem>
                  {uniqueSectors.map(sector => (
                    <SelectItem key={sector} value={sector}>{sector}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={sourceFilter} onValueChange={setSourceFilter}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Source" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Sources</SelectItem>
                  <SelectItem value="inbound">Inbound</SelectItem>
                  <SelectItem value="outbound">Outbound</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Companies Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              All Companies ({filteredCompanies.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {filteredCompanies.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Building2 className="mx-auto h-12 w-12 mb-4 opacity-50" />
                <p>No companies found matching your filters.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Company</TableHead>
                      <TableHead>Sector</TableHead>
                      <TableHead>Source</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Rev Y1</TableHead>
                      <TableHead className="text-right">Rev Y2</TableHead>
                      <TableHead className="text-right">Rev Y3</TableHead>
                      <TableHead className="text-center">Trend</TableHead>
                      <TableHead className="text-right">EBITDA Y1</TableHead>
                      <TableHead className="text-right">EBITDA Y2</TableHead>
                      <TableHead className="text-right">EBITDA Y3</TableHead>
                      <TableHead className="text-right">Valuation</TableHead>
                      <TableHead>Added</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredCompanies.map((company) => {
                      const displayStage = getDisplayStage(company);
                      const revenueChange = getRevenueChange(company.revenue_year2, company.revenue_year3);

                      return (
                        <TableRow key={company.deal_id}>
                          <TableCell className="font-medium">{company.name}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{company.sector}</Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary" className="capitalize">
                              {company.source}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge className={`${stageColors[displayStage]} text-white`}>
                              {displayStage === 'Acquired' ? (
                                <span className="flex items-center gap-1">
                                  <CheckCircle2 className="h-3 w-3" />
                                  Acquired
                                </span>
                              ) : (
                                `${displayStage} - ${stageLabels[displayStage]}`
                              )}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right font-mono">
                            {formatCurrency(company.revenue_year1)}
                          </TableCell>
                          <TableCell className="text-right font-mono">
                            {formatCurrency(company.revenue_year2)}
                          </TableCell>
                          <TableCell className="text-right font-mono">
                            {formatCurrency(company.revenue_year3)}
                          </TableCell>
                          <TableCell className="text-center">
                            {revenueChange.direction === 'up' && (
                              <span className="flex items-center justify-center text-green-600">
                                <TrendingUp className="h-4 w-4 mr-1" />
                                {revenueChange.percent.toFixed(0)}%
                              </span>
                            )}
                            {revenueChange.direction === 'down' && (
                              <span className="flex items-center justify-center text-red-600">
                                <TrendingDown className="h-4 w-4 mr-1" />
                                {revenueChange.percent.toFixed(0)}%
                              </span>
                            )}
                            {revenueChange.direction === 'flat' && (
                              <Minus className="h-4 w-4 mx-auto text-muted-foreground" />
                            )}
                          </TableCell>
                          <TableCell className="text-right font-mono">
                            {formatCurrency(company.ebitda_year1)}
                          </TableCell>
                          <TableCell className="text-right font-mono">
                            {formatCurrency(company.ebitda_year2)}
                          </TableCell>
                          <TableCell className="text-right font-mono">
                            {formatCurrency(company.ebitda_year3)}
                          </TableCell>
                          <TableCell className="text-right font-mono">
                            {formatCurrency(company.valuation)}
                          </TableCell>
                          <TableCell className="text-muted-foreground text-sm">
                            {new Date(company.created_at).toLocaleDateString()}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
