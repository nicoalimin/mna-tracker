'use client';

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
  Bot,
} from 'lucide-react';
import type { DealStage } from '@/lib/types';

interface MasterDataCompany {
  id: string;
  target: string;
  segment: string;
  revenue_2022_usd_mn: number | null;
  revenue_2023_usd_mn: number | null;
  revenue_2024_usd_mn: number | null;
  ebitda_2022_usd_mn: number | null;
  ebitda_2023_usd_mn: number | null;
  ebitda_2024_usd_mn: number | null;
  ev_2024: number | null;
  created_at: string;
  pipeline_stage: DealStage | null;
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
  const [companies, setCompanies] = useState<MasterDataCompany[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [stageFilter, setStageFilter] = useState<string>('all');
  const [sectorFilter, setSectorFilter] = useState<string>('all');

  useEffect(() => {
    fetchCompanies();
  }, []);

  const fetchCompanies = async () => {
    try {
      const { data, error } = await supabase
        .from('companies')
        .select(`
          id,
          target,
          segment,
          revenue_2022_usd_mn,
          revenue_2023_usd_mn,
          revenue_2024_usd_mn,
          ebitda_2022_usd_mn,
          ebitda_2023_usd_mn,
          ebitda_2024_usd_mn,
          ev_2024,
          pipeline_stage,
          created_at
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (data) {
        const formatted: MasterDataCompany[] = data.map((company: any) => ({
          id: company.id,
          target: company.target || 'Unknown',
          segment: company.segment || '',
          revenue_2022_usd_mn: company.revenue_2022_usd_mn,
          revenue_2023_usd_mn: company.revenue_2023_usd_mn,
          revenue_2024_usd_mn: company.revenue_2024_usd_mn,
          ebitda_2022_usd_mn: company.ebitda_2022_usd_mn,
          ebitda_2023_usd_mn: company.ebitda_2023_usd_mn,
          ebitda_2024_usd_mn: company.ebitda_2024_usd_mn,
          ev_2024: company.ev_2024,
          created_at: company.created_at,
          pipeline_stage: company.pipeline_stage as DealStage | null,
        }));
        setCompanies(formatted);
      }
    } catch (error) {
      console.error('Error fetching companies:', error);
    } finally {
      setLoading(false);
    }
  };

  const getDisplayStage = (company: MasterDataCompany): DealStage | 'Acquired' | null => {
    return company.pipeline_stage;
  };

  const uniqueSectors = [...new Set(companies.map(c => c.segment).filter(Boolean))];

  const filteredCompanies = companies.filter(company => {
    const matchesSearch = company.target.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (company.segment || '').toLowerCase().includes(searchQuery.toLowerCase());

    const displayStage = getDisplayStage(company);
    const matchesStage = stageFilter === 'all' || displayStage === stageFilter;
    const matchesSector = sectorFilter === 'all' || company.segment === sectorFilter;

    return matchesSearch && matchesStage && matchesSector;
  });

  const stats = {
    total: companies.length,
    inPipeline: companies.filter(c => c.pipeline_stage !== null).length,
    notInPipeline: companies.filter(c => c.pipeline_stage === null).length,
    byStage: {
      L0: companies.filter(c => c.pipeline_stage === 'L0').length,
      L1: companies.filter(c => c.pipeline_stage === 'L1').length,
      L2: companies.filter(c => c.pipeline_stage === 'L2').length,
      L3: companies.filter(c => c.pipeline_stage === 'L3').length,
      L4: companies.filter(c => c.pipeline_stage === 'L4').length,
      L5: companies.filter(c => c.pipeline_stage === 'L5').length,
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
                <span className="text-sm text-muted-foreground">In Pipeline</span>
              </div>
              <p className="text-2xl font-bold mt-1">{stats.inPipeline}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                <span className="text-sm text-muted-foreground">Not in Pipeline</span>
              </div>
              <p className="text-2xl font-bold mt-1">{stats.notInPipeline}</p>
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
                      <TableHead>Segment</TableHead>
                      <TableHead>Stage</TableHead>
                      <TableHead className="text-right">Rev 2022</TableHead>
                      <TableHead className="text-right">Rev 2023</TableHead>
                      <TableHead className="text-right">Rev 2024</TableHead>
                      <TableHead className="text-center">Trend</TableHead>
                      <TableHead className="text-right">EBITDA 2022</TableHead>
                      <TableHead className="text-right">EBITDA 2023</TableHead>
                      <TableHead className="text-right">EBITDA 2024</TableHead>
                      <TableHead className="text-right">EV 2024</TableHead>
                      <TableHead>Added</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredCompanies.map((company) => {
                      const displayStage = getDisplayStage(company);
                      const revenueChange = getRevenueChange(company.revenue_2023_usd_mn, company.revenue_2024_usd_mn);

                      return (
                        <TableRow key={company.id}>
                          <TableCell className="font-medium">{company.target}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{company.segment}</Badge>
                          </TableCell>
                          <TableCell>
                            {displayStage ? (
                              <Badge className={`${stageColors[displayStage as DealStage]} text-white`}>
                                {`${displayStage} - ${stageLabels[displayStage as DealStage]}`}
                              </Badge>
                            ) : (
                              <Badge variant="outline">Not in Pipeline</Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-right font-mono">
                            {formatCurrency(company.revenue_2022_usd_mn)}
                          </TableCell>
                          <TableCell className="text-right font-mono">
                            {formatCurrency(company.revenue_2023_usd_mn)}
                          </TableCell>
                          <TableCell className="text-right font-mono">
                            {formatCurrency(company.revenue_2024_usd_mn)}
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
                            {formatCurrency(company.ebitda_2022_usd_mn)}
                          </TableCell>
                          <TableCell className="text-right font-mono">
                            {formatCurrency(company.ebitda_2023_usd_mn)}
                          </TableCell>
                          <TableCell className="text-right font-mono">
                            {formatCurrency(company.ebitda_2024_usd_mn)}
                          </TableCell>
                          <TableCell className="text-right font-mono">
                            {formatCurrency(company.ev_2024)}
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
