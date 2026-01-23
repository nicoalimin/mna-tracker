'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import {
  Search,
  ChevronRight,
  Building2,
  TrendingUp,
  TrendingDown,
  Minus,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Clock,
  FileText,
  Loader2,
  Plus,
  Sparkles,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
} from 'lucide-react';
import PromoteDialog from '@/components/pipeline/PromoteDialog';
import { DealStage, L1Status } from '@/lib/types';
import { formatDistanceToNow } from 'date-fns';
import L0AddCompany from '@/components/pipeline/L0AddCompany';
import CompanyDetailDialog from '@/components/pipeline/CompanyDetailDialog';
import AIScreeningDialog from '@/components/pipeline/AIScreeningDialog';
import MarketScreeningStatus from '@/components/pipeline/MarketScreeningStatus';
import MarketScreeningResults from '@/components/pipeline/MarketScreeningResults';

interface CompanyWithDeal {
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

const STAGES: DealStage[] = ['L0', 'L1', 'L2', 'L3', 'L4', 'L5'];

const stageDescriptions: Record<DealStage, string> = {
  L0: 'Company Sourcing - Inbound & Outbound companies',
  L1: 'Automated Screening - Filter evaluation',
  L2: 'Initial Review - Manual assessment',
  L3: 'Deep Dive - Detailed analysis',
  L4: 'Due Diligence - Final verification',
  L5: 'Closing - Deal completion',
};

const stageColors: Record<DealStage, { bg: string; text: string; bgLight: string; textLight: string }> = {
  L0: { bg: 'bg-stage-l0', text: 'text-white', bgLight: 'bg-stage-l0/15', textLight: 'text-stage-l0' },
  L1: { bg: 'bg-stage-l1', text: 'text-white', bgLight: 'bg-stage-l1/15', textLight: 'text-stage-l1' },
  L2: { bg: 'bg-stage-l2', text: 'text-white', bgLight: 'bg-stage-l2/15', textLight: 'text-stage-l2' },
  L3: { bg: 'bg-stage-l3', text: 'text-white', bgLight: 'bg-stage-l3/15', textLight: 'text-stage-l3' },
  L4: { bg: 'bg-stage-l4', text: 'text-white', bgLight: 'bg-stage-l4/15', textLight: 'text-stage-l4' },
  L5: { bg: 'bg-stage-l5', text: 'text-white', bgLight: 'bg-stage-l5/15', textLight: 'text-stage-l5' },
};

const formatCurrency = (value: number | null) => {
  if (value === null) return '-';
  if (value >= 1_000_000_000) return `$${(value / 1_000_000_000).toFixed(1)}B`;
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `$${(value / 1_000).toFixed(1)}K`;
  return `$${value.toFixed(0)}`;
};

const getRevenueChange = (year2: number | null, year3: number | null) => {
  if (year2 === null || year3 === null || year2 === 0) return null;
  return ((year3 - year2) / year2) * 100;
};

const L1StatusBadge = ({ status }: { status: L1Status | null }) => {
  if (!status) return <Badge variant="outline">Pending</Badge>;

  const getStatusStyles = (status: L1Status) => {
    switch (status) {
      case 'Pass':
        return 'bg-blue-500/20 text-blue-600 border-blue-500/30 hover:bg-blue-500/30';
      case 'Exception':
        return 'bg-amber-500/20 text-amber-600 border-amber-500/30 hover:bg-amber-500/30';
      case 'No':
      case 'Duplicate':
        return 'bg-red-500/20 text-red-600 border-red-500/30 hover:bg-red-500/30';
      case 'WatchList':
      case 'TBC':
      default:
        return '';
    }
  };

  const icons: Record<L1Status, any> = {
    Pass: CheckCircle2,
    No: XCircle,
    Exception: AlertCircle,
    WatchList: Clock,
    TBC: FileText,
    Duplicate: AlertCircle,
  };

  const Icon = icons[status];
  const customStyles = getStatusStyles(status);

  return (
    <Badge variant="outline" className={`gap-1 ${customStyles}`}>
      <Icon className="h-3 w-3" />
      {status}
    </Badge>
  );
};

export default function Pipeline() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialTab = searchParams.get('stage') || 'L0';
  const [activeTab, setActiveTab] = useState<DealStage>(initialTab as DealStage);
  const [companies, setCompanies] = useState<CompanyWithDeal[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [sourceFilter, setSourceFilter] = useState<'all' | 'inbound' | 'outbound'>('all');
  const [selectedCompany, setSelectedCompany] = useState<CompanyWithDeal | null>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showScreeningDialog, setShowScreeningDialog] = useState(false);
  const [marketScreeningRefresh, setMarketScreeningRefresh] = useState(0);
  const [newCandidatesCount, setNewCandidatesCount] = useState(0);

  // Sorting state
  const [sortField, setSortField] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  // L1 status filter
  const [l1StatusFilter, setL1StatusFilter] = useState<'all' | L1Status>('all');

  // Sector filter
  const [sectorFilter, setSectorFilter] = useState<string>('all');

  // Promote dialog state
  const [promoteDialogOpen, setPromoteDialogOpen] = useState(false);
  const [promotingCompany, setPromotingCompany] = useState<CompanyWithDeal | null>(null);

  const fetchCompanies = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('deals')
        .select(`
          id,
          company_id,
          current_stage,
          l1_status,
          l1_filter_results,
          created_at,
          updated_at,
          companies (
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

      const formatted = data?.map((deal: any) => ({
        id: deal.id,
        company_id: deal.company_id,
        name: deal.companies.name,
        sector: deal.companies.sector,
        source: deal.companies.source,
        revenue_year1: deal.companies.revenue_year1,
        revenue_year2: deal.companies.revenue_year2,
        revenue_year3: deal.companies.revenue_year3,
        ebitda_year1: deal.companies.ebitda_year1,
        ebitda_year2: deal.companies.ebitda_year2,
        ebitda_year3: deal.companies.ebitda_year3,
        valuation: deal.companies.valuation,
        current_stage: deal.current_stage as DealStage,
        l1_status: deal.l1_status as L1Status | null,
        l1_filter_results: deal.l1_filter_results,
        created_at: deal.created_at,
        updated_at: deal.updated_at,
      })) || [];

      setCompanies(formatted);
    } catch (error: any) {
      console.error('Error fetching companies:', error);
      toast.error('Failed to load companies');
    } finally {
      setLoading(false);
    }
  };

  const fetchNewCandidatesCount = async () => {
    try {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const { count, error } = await supabase
        .from('market_screening_results')
        .select('*', { count: 'exact', head: true })
        .eq('is_added_to_pipeline', false)
        .gte('discovered_at', sevenDaysAgo.toISOString());

      if (error) throw error;
      setNewCandidatesCount(count || 0);
    } catch (error) {
      console.error('Error fetching candidates count:', error);
    }
  };

  useEffect(() => {
    fetchCompanies();
    fetchNewCandidatesCount();
  }, []);

  const handleTabChange = (value: string) => {
    setActiveTab(value as DealStage);
    router.push(`/pipeline?stage=${value}`);
  };

  // Get unique sectors for filter
  const uniqueSectors = [...new Set(companies.map(c => c.sector))].sort();

  const filteredCompanies = companies.filter((company) => {
    const matchesStage = company.current_stage === activeTab;
    const matchesSearch = company.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      company.sector.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSource = sourceFilter === 'all' || company.source === sourceFilter;
    const matchesL1Status = l1StatusFilter === 'all' || company.l1_status === l1StatusFilter;
    const matchesSector = sectorFilter === 'all' || company.sector === sectorFilter;
    return matchesStage && matchesSearch && matchesSource && matchesL1Status && matchesSector;
  });

  // Apply sorting
  const sortedCompanies = [...filteredCompanies].sort((a, b) => {
    if (!sortField) return 0;

    let aVal: any;
    let bVal: any;

    switch (sortField) {
      case 'name':
        aVal = a.name.toLowerCase();
        bVal = b.name.toLowerCase();
        break;
      case 'sector':
        aVal = a.sector.toLowerCase();
        bVal = b.sector.toLowerCase();
        break;
      case 'revenue':
        aVal = a.revenue_year3 || 0;
        bVal = b.revenue_year3 || 0;
        break;
      case 'ebitda':
        aVal = a.ebitda_year3 || 0;
        bVal = b.ebitda_year3 || 0;
        break;
      case 'valuation':
        aVal = a.valuation || 0;
        bVal = b.valuation || 0;
        break;
      case 'updated':
        aVal = new Date(a.updated_at).getTime();
        bVal = new Date(b.updated_at).getTime();
        break;
      default:
        return 0;
    }

    if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
    if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });

  const toggleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const SortIcon = ({ field }: { field: string }) => {
    if (sortField !== field) return <ArrowUpDown className="h-3 w-3 ml-1 opacity-50" />;
    return sortDirection === 'asc'
      ? <ArrowUp className="h-3 w-3 ml-1" />
      : <ArrowDown className="h-3 w-3 ml-1" />;
  };

  const runL1Filters = async (dealId: string) => {
    try {
      const { data, error } = await supabase.rpc('run_l1_filters', { deal_id_param: dealId });
      if (error) throw error;
      const result = data as { status: string } | null;
      toast.success(`Filter completed: ${result?.status || 'Unknown'}`);
      fetchCompanies();
    } catch (error: any) {
      console.error('Error running filters:', error);
      toast.error('Failed to run filters');
    }
  };

  const openAIScreening = () => {
    if (selectedIds.size === 0) {
      toast.error('Please select at least one company');
      return;
    }
    setShowScreeningDialog(true);
  };

  const getSelectedCompaniesForScreening = () => {
    return filteredCompanies
      .filter((c) => selectedIds.has(c.id))
      .map((c) => ({
        id: c.id,
        name: c.name,
        sector: c.sector,
        revenue_year1: c.revenue_year1,
        revenue_year2: c.revenue_year2,
        revenue_year3: c.revenue_year3,
        ebitda_year1: c.ebitda_year1,
        ebitda_year2: c.ebitda_year2,
        ebitda_year3: c.ebitda_year3,
        valuation: c.valuation,
        source: c.source,
      }));
  };

  const promoteToNextStage = async (dealId: string, currentStage: DealStage) => {
    const stageIndex = STAGES.indexOf(currentStage);
    if (stageIndex >= STAGES.length - 1) {
      toast.error('Already at final stage');
      return;
    }

    const nextStage = STAGES[stageIndex + 1];

    try {
      // Update current stage history
      await supabase
        .from('deal_stage_history')
        .update({ exited_at: new Date().toISOString() })
        .eq('deal_id', dealId)
        .eq('stage', currentStage)
        .is('exited_at', null);

      // Create new stage history
      await supabase.from('deal_stage_history').insert({
        deal_id: dealId,
        stage: nextStage,
      });

      // Update deal
      const { error } = await supabase
        .from('deals')
        .update({ current_stage: nextStage })
        .eq('id', dealId);

      if (error) throw error;

      toast.success(`Promoted to ${nextStage}`);
      fetchCompanies();
    } catch (error: any) {
      console.error('Error promoting deal:', error);
      toast.error('Failed to promote deal');
    }
  };

  const stageCount = (stage: DealStage) => companies.filter((c) => c.current_stage === stage).length;

  const toggleSelect = (id: string) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedIds(newSet);
  };

  const toggleSelectAll = () => {
    const l0Companies = filteredCompanies.filter(c => c.current_stage === 'L0');
    if (selectedIds.size === l0Companies.length && l0Companies.length > 0) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(l0Companies.map(c => c.id)));
    }
  };

  const isAllSelected = () => {
    const l0Companies = filteredCompanies.filter(c => c.current_stage === 'L0');
    return l0Companies.length > 0 && selectedIds.size === l0Companies.length;
  };

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6 animate-fade-in">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Deal Pipeline</h1>
            <p className="text-muted-foreground">
              Track companies through all stages
            </p>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
          <TabsList className="grid w-full grid-cols-6">
            {STAGES.map((stage) => (
              <TabsTrigger
                key={stage}
                value={stage}
                className={`relative transition-all ${activeTab === stage
                    ? `${stageColors[stage].bg} ${stageColors[stage].text} data-[state=active]:${stageColors[stage].bg} data-[state=active]:${stageColors[stage].text}`
                    : `${stageColors[stage].bgLight} ${stageColors[stage].textLight} hover:opacity-80`
                  }`}
              >
                {stage}
                <Badge
                  variant="secondary"
                  className={`ml-2 h-5 min-w-5 px-1.5 text-xs ${activeTab === stage
                      ? 'bg-white/20 text-white'
                      : `${stageColors[stage].bg} text-white`
                    }`}
                >
                  {stageCount(stage)}
                </Badge>
              </TabsTrigger>
            ))}
          </TabsList>

          {STAGES.map((stage) => (
            <TabsContent key={stage} value={stage} className="mt-6 space-y-4">
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-xl">{stage} - {stageDescriptions[stage].split(' - ')[0]}</CardTitle>
                      <CardDescription>{stageDescriptions[stage].split(' - ')[1]}</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {/* L0 Specific Layout */}
                  {stage === 'L0' ? (
                    <div className="space-y-6">
                      {/* Market Screening Status Banner */}
                      <MarketScreeningStatus
                        onScanComplete={() => {
                          setMarketScreeningRefresh(prev => prev + 1);
                          fetchNewCandidatesCount();
                        }}
                        newCandidatesCount={newCandidatesCount}
                      />

                      {/* AI-Discovered Companies Results */}
                      <MarketScreeningResults
                        refreshTrigger={marketScreeningRefresh}
                        onAddedToPipeline={() => {
                          fetchCompanies();
                          fetchNewCandidatesCount();
                        }}
                      />

                      {/* Existing L0 Pipeline */}
                      <Card className="border-dashed">
                        <CardHeader className="pb-3">
                          <div className="flex items-center justify-between">
                            <div>
                              <CardTitle className="text-lg">L0 Pipeline Companies</CardTitle>
                              <CardDescription>Companies sourced and ready for screening</CardDescription>
                            </div>
                            <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
                              <DialogTrigger asChild>
                                <Button>
                                  <Plus className="mr-2 h-4 w-4" />
                                  Add Company
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                                <DialogHeader>
                                  <DialogTitle>Add New Company</DialogTitle>
                                  <DialogDescription>
                                    Import companies from CSV/Excel or add manually
                                  </DialogDescription>
                                </DialogHeader>
                                <L0AddCompany onSuccess={() => {
                                  setShowAddDialog(false);
                                  fetchCompanies();
                                }} />
                              </DialogContent>
                            </Dialog>
                          </div>
                        </CardHeader>
                        <CardContent>
                          {/* Header with Select All and AI Screening */}
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2">
                              <Checkbox
                                checked={isAllSelected()}
                                onCheckedChange={toggleSelectAll}
                                id="select-all"
                              />
                              <label htmlFor="select-all" className="text-sm font-medium cursor-pointer">
                                Select All
                              </label>
                            </div>
                            <Button
                              onClick={openAIScreening}
                              className="bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-700 hover:to-purple-600"
                            >
                              <Sparkles className="mr-2 h-4 w-4" />
                              AI Screening ({selectedIds.size} selected)
                            </Button>
                          </div>

                          {/* Filters */}
                          <div className="flex items-center gap-4 mb-4 flex-wrap">
                            <div className="relative flex-1 max-w-sm">
                              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                              <Input
                                placeholder="Search companies..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-9"
                              />
                            </div>
                            <Select value={sectorFilter} onValueChange={setSectorFilter}>
                              <SelectTrigger className="w-40">
                                <SelectValue placeholder="Sector" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="all">All Sectors</SelectItem>
                                {uniqueSectors.map((sector) => (
                                  <SelectItem key={sector} value={sector}>{sector}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <Select value={sourceFilter} onValueChange={(v) => setSourceFilter(v as any)}>
                              <SelectTrigger className="w-40">
                                <SelectValue placeholder="Source" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="all">All Sources</SelectItem>
                                <SelectItem value="inbound">Inbound</SelectItem>
                                <SelectItem value="outbound">Outbound</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          {loading ? (
                            <div className="flex items-center justify-center py-12">
                              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                            </div>
                          ) : sortedCompanies.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                              <Building2 className="h-12 w-12 mb-4 opacity-50" />
                              <p>No companies in this stage</p>
                            </div>
                          ) : (
                            <div className="overflow-x-auto">
                              <Table>
                                <TableHeader>
                                  <TableRow>
                                    <TableHead className="w-[50px]">Select</TableHead>
                                    <TableHead>
                                      <button
                                        onClick={() => toggleSort('name')}
                                        className="flex items-center hover:text-foreground transition-colors"
                                      >
                                        Company
                                        <SortIcon field="name" />
                                      </button>
                                    </TableHead>
                                    <TableHead>
                                      <button
                                        onClick={() => toggleSort('sector')}
                                        className="flex items-center hover:text-foreground transition-colors"
                                      >
                                        Sector
                                        <SortIcon field="sector" />
                                      </button>
                                    </TableHead>
                                    <TableHead className="text-right">Revenue 2023</TableHead>
                                    <TableHead className="text-right">Revenue 2024</TableHead>
                                    <TableHead className="text-right">
                                      <button
                                        onClick={() => toggleSort('revenue')}
                                        className="flex items-center justify-end w-full hover:text-foreground transition-colors"
                                      >
                                        Revenue 2025
                                        <SortIcon field="revenue" />
                                      </button>
                                    </TableHead>
                                    <TableHead className="text-right">EBITDA 2023</TableHead>
                                    <TableHead className="text-right">EBITDA 2024</TableHead>
                                    <TableHead className="text-right">
                                      <button
                                        onClick={() => toggleSort('ebitda')}
                                        className="flex items-center justify-end w-full hover:text-foreground transition-colors"
                                      >
                                        EBITDA 2025
                                        <SortIcon field="ebitda" />
                                      </button>
                                    </TableHead>
                                    <TableHead className="text-right">
                                      <button
                                        onClick={() => toggleSort('valuation')}
                                        className="flex items-center justify-end w-full hover:text-foreground transition-colors"
                                      >
                                        Valuation
                                        <SortIcon field="valuation" />
                                      </button>
                                    </TableHead>
                                    <TableHead className="text-center">Source</TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {sortedCompanies.map((company) => (
                                    <TableRow key={company.id} className="hover:bg-muted/50">
                                      <TableCell>
                                        <Checkbox
                                          checked={selectedIds.has(company.id)}
                                          onCheckedChange={() => toggleSelect(company.id)}
                                        />
                                      </TableCell>
                                      <TableCell>
                                        <button
                                          onClick={() => setSelectedCompany(company)}
                                          className="font-medium text-left hover:text-primary hover:underline transition-colors"
                                        >
                                          {company.name}
                                        </button>
                                      </TableCell>
                                      <TableCell>
                                        <span className="text-muted-foreground">{company.sector}</span>
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
                                      <TableCell className="text-center">
                                        <Badge
                                          variant={company.source === 'inbound' ? 'default' : 'secondary'}
                                          className={company.source === 'inbound'
                                            ? 'bg-emerald-500/20 text-emerald-600 hover:bg-emerald-500/30'
                                            : 'bg-purple-500/20 text-purple-600 hover:bg-purple-500/30'
                                          }
                                        >
                                          {company.source === 'inbound' ? 'Inbound' : 'Outbound'}
                                        </Badge>
                                      </TableCell>
                                    </TableRow>
                                  ))}
                                </TableBody>
                              </Table>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    </div>
                  ) : (
                    <>
                      {/* Filters for L1-L5 stages */}
                      <div className="flex items-center gap-4 mb-4 flex-wrap">
                        <div className="relative flex-1 max-w-sm">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            placeholder="Search companies..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-9"
                          />
                        </div>
                        <Select value={sectorFilter} onValueChange={setSectorFilter}>
                          <SelectTrigger className="w-40">
                            <SelectValue placeholder="Sector" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Sectors</SelectItem>
                            {uniqueSectors.map((sector) => (
                              <SelectItem key={sector} value={sector}>{sector}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {stage === 'L1' && (
                          <Select value={l1StatusFilter} onValueChange={(v) => setL1StatusFilter(v as any)}>
                            <SelectTrigger className="w-40">
                              <SelectValue placeholder="Status" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">All Status</SelectItem>
                              <SelectItem value="Pass">Pass</SelectItem>
                              <SelectItem value="No">No</SelectItem>
                              <SelectItem value="Exception">Exception</SelectItem>
                              <SelectItem value="WatchList">WatchList</SelectItem>
                              <SelectItem value="TBC">TBC</SelectItem>
                            </SelectContent>
                          </Select>
                        )}
                      </div>

                      {/* Table for L1-L5 stages */}
                      {loading ? (
                        <div className="flex items-center justify-center py-12">
                          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                        </div>
                      ) : sortedCompanies.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                          <Building2 className="h-12 w-12 mb-4 opacity-50" />
                          <p>No companies in this stage</p>
                        </div>
                      ) : (
                        <div className="overflow-x-auto">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>
                                  <button
                                    onClick={() => toggleSort('name')}
                                    className="flex items-center hover:text-foreground transition-colors"
                                  >
                                    Company
                                    <SortIcon field="name" />
                                  </button>
                                </TableHead>
                                <TableHead>
                                  <button
                                    onClick={() => toggleSort('sector')}
                                    className="flex items-center hover:text-foreground transition-colors"
                                  >
                                    Sector
                                    <SortIcon field="sector" />
                                  </button>
                                </TableHead>
                                {stage === 'L1' && <TableHead>Status</TableHead>}
                                <TableHead className="text-right">Rev 2023</TableHead>
                                <TableHead className="text-right">Rev 2024</TableHead>
                                <TableHead className="text-right">Rev 2025</TableHead>
                                <TableHead className="text-right">EBITDA 2023</TableHead>
                                <TableHead className="text-right">EBITDA 2024</TableHead>
                                <TableHead className="text-right">EBITDA 2025</TableHead>
                                <TableHead>
                                  <button
                                    onClick={() => toggleSort('valuation')}
                                    className="flex items-center hover:text-foreground transition-colors"
                                  >
                                    Valuation
                                    <SortIcon field="valuation" />
                                  </button>
                                </TableHead>
                                <TableHead>
                                  <button
                                    onClick={() => toggleSort('updated')}
                                    className="flex items-center hover:text-foreground transition-colors"
                                  >
                                    Updated
                                    <SortIcon field="updated" />
                                  </button>
                                </TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {sortedCompanies.map((company) => {
                                return (
                                  <TableRow key={company.id}>
                                    <TableCell>
                                      <button
                                        onClick={() => setSelectedCompany(company)}
                                        className="font-medium text-left hover:text-primary hover:underline transition-colors"
                                      >
                                        {company.name}
                                      </button>
                                    </TableCell>
                                    <TableCell>
                                      <Badge variant="outline">{company.sector}</Badge>
                                    </TableCell>
                                    {stage === 'L1' && (
                                      <TableCell>
                                        <L1StatusBadge status={company.l1_status} />
                                      </TableCell>
                                    )}
                                    <TableCell className="text-right font-mono">
                                      {formatCurrency(company.revenue_year1)}
                                    </TableCell>
                                    <TableCell className="text-right font-mono">
                                      {formatCurrency(company.revenue_year2)}
                                    </TableCell>
                                    <TableCell className="text-right font-mono">
                                      {formatCurrency(company.revenue_year3)}
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
                                      {formatDistanceToNow(new Date(company.updated_at), { addSuffix: true })}
                                    </TableCell>
                                    <TableCell className="text-right">
                                      {stage !== 'L5' && (
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          onClick={() => {
                                            setPromotingCompany(company);
                                            setPromoteDialogOpen(true);
                                          }}
                                        >
                                          Promote
                                          <ChevronRight className="ml-1 h-4 w-4" />
                                        </Button>
                                      )}
                                    </TableCell>
                                  </TableRow>
                                );
                              })}
                            </TableBody>
                          </Table>
                        </div>
                      )}
                    </>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          ))}
        </Tabs>

        {selectedCompany && (
          <CompanyDetailDialog
            company={selectedCompany}
            open={!!selectedCompany}
            onOpenChange={(open) => !open && setSelectedCompany(null)}
            onUpdate={fetchCompanies}
          />
        )}

        <AIScreeningDialog
          open={showScreeningDialog}
          onOpenChange={setShowScreeningDialog}
          companies={getSelectedCompaniesForScreening()}
          onComplete={() => {
            setSelectedIds(new Set());
            fetchCompanies();
          }}
        />

        {promotingCompany && (
          <PromoteDialog
            open={promoteDialogOpen}
            onOpenChange={setPromoteDialogOpen}
            dealId={promotingCompany.id}
            companyName={promotingCompany.name}
            currentStage={promotingCompany.current_stage}
            nextStage={STAGES[STAGES.indexOf(promotingCompany.current_stage) + 1] as DealStage}
            onSuccess={() => {
              setPromotingCompany(null);
              fetchCompanies();
            }}
          />
        )}
      </div>
    </DashboardLayout>
  );
}
