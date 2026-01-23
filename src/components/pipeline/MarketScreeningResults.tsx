import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Loader2, Plus, ExternalLink, Sparkles, Trash2 } from 'lucide-react';
import MarketScreeningDetailDialog from './MarketScreeningDetailDialog';

interface MarketScreeningResult {
  id: string;
  company_name: string;
  sector: string | null;
  description: string | null;
  match_score: number | null;
  match_reason: string | null;
  website: string | null;
  estimated_revenue: string | null;
  estimated_valuation: string | null;
  is_added_to_pipeline: boolean;
  discovered_at: string;
}

interface MarketScreeningResultsProps {
  refreshTrigger: number;
  onAddedToPipeline: () => void;
}

export default function MarketScreeningResults({ refreshTrigger, onAddedToPipeline }: MarketScreeningResultsProps) {
  const [results, setResults] = useState<MarketScreeningResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [selectedResult, setSelectedResult] = useState<MarketScreeningResult | null>(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);

  const fetchResults = async () => {
    try {
      const { data, error } = await supabase
        .from('market_screening_results')
        .select('*')
        .eq('is_added_to_pipeline', false)
        .order('match_score', { ascending: false })
        .order('discovered_at', { ascending: false });

      if (error) throw error;
      setResults((data || []) as MarketScreeningResult[]);
    } catch (error: any) {
      console.error('Error fetching results:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResults();
  }, [refreshTrigger]);

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
    if (selectedIds.size === results.length && results.length > 0) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(results.map(r => r.id)));
    }
  };

  const isAllSelected = () => {
    return results.length > 0 && selectedIds.size === results.length;
  };

  const addToL0 = async () => {
    if (selectedIds.size === 0) {
      toast.error('Please select at least one company');
      return;
    }

    setAdding(true);
    try {
      const selectedResults = results.filter(r => selectedIds.has(r.id));

      for (const result of selectedResults) {
        // Create company with pipeline_stage set to L0
        const { data: company, error: companyError } = await supabase
          .from('companies')
          .insert({
            target: result.company_name,
            segment: result.sector || 'Unknown',
            pipeline_stage: 'L0',
            // Parse estimated values if available
            ev_2024: parseEstimatedValue(result.estimated_valuation),
          })
          .select()
          .single();

        if (companyError) {
          console.error('Error creating company:', companyError);
          continue;
        }

        // Log the addition
        await supabase.from('company_logs').insert({
          company_id: company.id,
          action: 'ADDED_FROM_MARKET_SCREENING',
        });

        // Mark as added
        await supabase
          .from('market_screening_results')
          .update({ is_added_to_pipeline: true })
          .eq('id', result.id);
      }

      toast.success(`Added ${selectedResults.length} companies to L0`);
      setSelectedIds(new Set());
      fetchResults();
      onAddedToPipeline();
    } catch (error: any) {
      console.error('Error adding to L0:', error);
      toast.error('Failed to add companies to pipeline');
    } finally {
      setAdding(false);
    }
  };

  const parseEstimatedValue = (value: string | null): number | null => {
    if (!value) return null;

    // Try to extract a number from strings like "$10M-$50M" or "$100M"
    const match = value.match(/\$?([\d.]+)\s*(M|B|K)?/i);
    if (!match) return null;

    let num = parseFloat(match[1]);
    const suffix = match[2]?.toUpperCase();

    if (suffix === 'B') num *= 1_000_000_000;
    else if (suffix === 'M') num *= 1_000_000;
    else if (suffix === 'K') num *= 1_000;

    return num;
  };

  const dismissResult = async (id: string) => {
    try {
      await supabase
        .from('market_screening_results')
        .delete()
        .eq('id', id);

      toast.success('Result dismissed');
      fetchResults();
    } catch (error: any) {
      console.error('Error dismissing result:', error);
      toast.error('Failed to dismiss result');
    }
  };

  const getMatchScoreColor = (score: number | null) => {
    if (score === null) return 'bg-muted text-muted-foreground';
    if (score >= 80) return 'bg-emerald-500/20 text-emerald-600';
    if (score >= 60) return 'bg-amber-500/20 text-amber-600';
    return 'bg-red-500/20 text-red-600';
  };

  if (loading) {
    return (
      <Card className="border-purple-200 dark:border-purple-800/50 bg-gradient-to-br from-purple-50/50 to-violet-50/30 dark:from-purple-950/20 dark:to-violet-950/10">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-purple-500" />
            AI-Discovered Companies
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (results.length === 0) {
    return (
      <Card className="border-purple-200 dark:border-purple-800/50 bg-gradient-to-br from-purple-50/50 to-violet-50/30 dark:from-purple-950/20 dark:to-violet-950/10">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-purple-500" />
            AI-Discovered Companies
          </CardTitle>
          <CardDescription>
            Companies matching your investment thesis will appear here
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <Sparkles className="h-12 w-12 mb-4 opacity-50" />
            <p>No companies discovered yet</p>
            <p className="text-sm">Configure your investment thesis and run a scan</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-purple-200 dark:border-purple-800/50 bg-gradient-to-br from-purple-50/50 to-violet-50/30 dark:from-purple-950/20 dark:to-violet-950/10">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-purple-500" />
              AI-Discovered Companies
            </CardTitle>
            <CardDescription>
              {results.length} companies matching your investment thesis
            </CardDescription>
          </div>
          <Button
            onClick={addToL0}
            disabled={adding || selectedIds.size === 0}
            className="bg-stage-l0 hover:bg-stage-l0/90"
          >
            {adding ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Adding...
              </>
            ) : (
              <>
                <Plus className="h-4 w-4 mr-2" />
                Add to L0 ({selectedIds.size})
              </>
            )}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {/* Select All */}
        <div className="flex items-center gap-2 mb-4">
          <Checkbox
            checked={isAllSelected()}
            onCheckedChange={toggleSelectAll}
            id="select-all-results"
          />
          <label htmlFor="select-all-results" className="text-sm font-medium cursor-pointer">
            Select All
          </label>
        </div>

        {/* Results Table */}
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[50px]">Select</TableHead>
                <TableHead>Company</TableHead>
                <TableHead>Sector</TableHead>
                <TableHead>Match Score</TableHead>
                <TableHead>Est. Revenue</TableHead>
                <TableHead>Est. Valuation</TableHead>
                <TableHead>Match Reason</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {results.map((result) => (
                <TableRow key={result.id} className="hover:bg-muted/50">
                  <TableCell>
                    <Checkbox
                      checked={selectedIds.has(result.id)}
                      onCheckedChange={() => toggleSelect(result.id)}
                    />
                  </TableCell>
                  <TableCell>
                    <div>
                      <button
                        onClick={() => {
                          setSelectedResult(result);
                          setDetailDialogOpen(true);
                        }}
                        className="font-medium text-left hover:text-primary hover:underline transition-colors"
                      >
                        {result.company_name}
                      </button>
                      {result.website && (
                        <a
                          href={result.website.startsWith('http') ? result.website : `https://${result.website}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {result.website}
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{result.sector || 'Unknown'}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge className={getMatchScoreColor(result.match_score)}>
                      {result.match_score !== null ? `${result.match_score}%` : '-'}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-mono text-sm">
                    {result.estimated_revenue || '-'}
                  </TableCell>
                  <TableCell className="font-mono text-sm">
                    {result.estimated_valuation || '-'}
                  </TableCell>
                  <TableCell className="max-w-[200px]">
                    <p className="text-sm text-muted-foreground truncate" title={result.match_reason || ''}>
                      {result.match_reason || '-'}
                    </p>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => dismissResult(result.id)}
                      className="text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        <MarketScreeningDetailDialog
          result={selectedResult}
          open={detailDialogOpen}
          onOpenChange={setDetailDialogOpen}
        />
      </CardContent>
    </Card>
  );
}
