'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import {
  Loader2,
  CheckCircle2,
  XCircle,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  ArrowRight,
  HelpCircle,
} from 'lucide-react';

interface Screening {
  id: string;
  company_id: string;
  criteria_id: string;
  state: 'pending' | 'completed' | 'failed';
  result: string | null;
  remarks: string | null;
  created_at: string;
  updated_at: string;
  company?: {
    target: string;
  };
  criterias?: {
    name: string;
  };
}

interface CompanyScreeningSummary {
  company_id: string;
  company_name: string;
  total_criteria: number;
  completed_criteria: number;
  passed_criteria: number;
  failed_criteria: number;
  inconclusive_criteria: number;
  pending_criteria: number;
  all_passed: boolean;
  screenings: Screening[];
}

interface ScreeningProgressPanelProps {
  refreshTrigger?: number;
  onScreeningComplete?: () => void;
  onCompanyClick?: (companyId: string) => void;
}

export default function ScreeningProgressPanel({
  refreshTrigger = 0,
  onScreeningComplete,
  onCompanyClick,
}: ScreeningProgressPanelProps) {
  const [screenings, setScreenings] = useState<Screening[]>([]);
  const [loading, setLoading] = useState(true);
  const [completedPage, setCompletedPage] = useState(0);
  const [movingCompanyId, setMovingCompanyId] = useState<string | null>(null);
  const ITEMS_PER_PAGE = 5;

  const fetchScreenings = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('screenings')
        .select(`
          id,
          company_id,
          criteria_id,
          state,
          result,
          remarks,
          created_at,
          updated_at,
          company:companies(target),
          criterias(name)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Transform the data to flatten nested objects
      const transformed = (data || []).map((s: any) => ({
        ...s,
        company: s.company,
        criterias: s.criterias,
      }));

      setScreenings(transformed);
    } catch (error) {
      console.error('Error fetching screenings:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchScreenings();
  }, [refreshTrigger]);

  // Set up real-time subscription for screening updates
  useEffect(() => {
    const channel = supabase
      .channel('screenings-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'screenings' },
        () => {
          fetchScreenings();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Poll every 5 seconds as fallback for real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      fetchScreenings();
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  // Group screenings by company
  const groupByCompany = (screenings: Screening[]): CompanyScreeningSummary[] => {
    const grouped = new Map<string, CompanyScreeningSummary>();

    screenings.forEach((s) => {
      const companyId = s.company_id;
      const companyName = s.company?.target || 'Unknown';

      if (!grouped.has(companyId)) {
        grouped.set(companyId, {
          company_id: companyId,
          company_name: companyName,
          total_criteria: 0,
          completed_criteria: 0,
          passed_criteria: 0,
          failed_criteria: 0,
          inconclusive_criteria: 0,
          pending_criteria: 0,
          all_passed: false,
          screenings: [],
        });
      }

      const summary = grouped.get(companyId)!;
      summary.screenings.push(s);
      summary.total_criteria++;

      if (s.state === 'completed') {
        summary.completed_criteria++;
        if (s.result === 'pass') {
          summary.passed_criteria++;
        } else if (s.result === 'fail' || s.result === 'error') {
          summary.failed_criteria++;
        } else if (s.result === 'inconclusive') {
          summary.inconclusive_criteria++;
        }
      } else if (s.state === 'pending') {
        summary.pending_criteria++;
      } else if (s.state === 'failed') {
        summary.completed_criteria++;
        summary.failed_criteria++;
      }
    });

    // Calculate all_passed after all screenings are processed
    grouped.forEach((summary) => {
      summary.all_passed =
        summary.completed_criteria === summary.total_criteria &&
        summary.passed_criteria === summary.total_criteria;
    });

    return Array.from(grouped.values());
  };

  const moveToL1 = async (companyId: string, companyName: string) => {
    setMovingCompanyId(companyId);
    try {
      // Update the company's pipeline stage to L1
      const { error: updateError } = await supabase
        .from('companies')
        .update({
          pipeline_stage: 'L1',
          l1_screening_result: 'Pass',
        })
        .eq('id', companyId);

      if (updateError) throw updateError;

      // Log the screening action
      await supabase.from('company_logs').insert({
        company_id: companyId,
        action: 'PROMOTED_TO_L1',
      });

      // Delete the screening records for this company (they've been applied)
      await supabase
        .from('screenings')
        .delete()
        .eq('company_id', companyId);

      toast.success(`${companyName} moved to L1`);
      onScreeningComplete?.();
      fetchScreenings();
    } catch (error: any) {
      console.error('Error moving company to L1:', error);
      toast.error('Failed to move company to L1');
    } finally {
      setMovingCompanyId(null);
    }
  };

  const companySummaries = groupByCompany(screenings);

  // Separate in-progress and completed
  const inProgress = companySummaries.filter(
    (cs) => cs.pending_criteria > 0 || cs.completed_criteria < cs.total_criteria
  );
  const completed = companySummaries.filter(
    (cs) => cs.pending_criteria === 0 && cs.completed_criteria === cs.total_criteria
  );

  // Pagination for completed
  const totalCompletedPages = Math.ceil(completed.length / ITEMS_PER_PAGE);
  const paginatedCompleted = completed.slice(
    completedPage * ITEMS_PER_PAGE,
    (completedPage + 1) * ITEMS_PER_PAGE
  );

  // Count how many passed all
  const passedCount = completed.filter((c) => c.all_passed).length;

  if (loading && screenings.length === 0) {
    return null;
  }

  if (screenings.length === 0) {
    return null;
  }

  return (
    <Card className="border-purple-200 bg-gradient-to-r from-purple-50/50 to-blue-50/50 dark:from-purple-950/20 dark:to-blue-950/20 dark:border-purple-800">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-purple-600" />
            <div>
              <CardTitle className="text-lg">AI Screening Progress</CardTitle>
              <CardDescription>
                Real-time status of company screenings
              </CardDescription>
            </div>
          </div>
          {passedCount > 0 && (
            <Badge variant="secondary" className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300">
              {passedCount} ready for L1
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* In Progress Section */}
        {inProgress.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-semibold flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin text-yellow-600" />
              In Progress ({inProgress.length})
            </h4>
            <div className="grid gap-2">
              {inProgress.map((summary) => (
                <div
                  key={summary.company_id}
                  className="flex items-center justify-between p-3 rounded-lg border bg-yellow-50 border-yellow-200 dark:bg-yellow-950/20 dark:border-yellow-900/50"
                >
                  <div className="flex items-center gap-3">
                    <Loader2 className="h-4 w-4 animate-spin text-yellow-600" />
                    <div>
                      <button
                        onClick={() => onCompanyClick?.(summary.company_id)}
                        className="font-medium hover:text-primary hover:underline transition-colors text-left"
                      >
                        {summary.company_name}
                      </button>
                      <div className="text-xs text-muted-foreground">
                        {summary.completed_criteria} / {summary.total_criteria} criteria evaluated
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <span className="text-green-600 dark:text-green-400">{summary.passed_criteria}✓</span>
                      <span className="text-red-600 dark:text-red-400">{summary.failed_criteria}✗</span>
                      {summary.inconclusive_criteria > 0 && (
                        <span className="text-amber-600 flex items-center">
                          {summary.inconclusive_criteria}<HelpCircle className="h-3 w-3 ml-0.5" />
                        </span>
                      )}
                    </span>
                    <Badge variant="secondary">
                      In Progress
                    </Badge>
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-green-600 border-green-300 hover:bg-green-50 hover:text-green-700"
                      onClick={() => moveToL1(summary.company_id, summary.company_name)}
                      disabled={movingCompanyId === summary.company_id}
                    >
                      {movingCompanyId === summary.company_id ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <>
                          <ArrowRight className="h-3 w-3 mr-1" />
                          Promote to L1
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Completed Section */}
        {completed.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-semibold flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              Completed ({completed.length})
            </h4>
            <div className="grid gap-2">
              {paginatedCompleted.map((summary) => (
                <div
                  key={summary.company_id}
                  className={`flex items-center justify-between p-3 rounded-lg border ${summary.all_passed
                    ? 'bg-green-50 border-green-200 dark:bg-green-950/20 dark:border-green-900/50'
                    : 'bg-red-50 border-red-200 dark:bg-red-950/20 dark:border-red-900/50'
                    }`}
                >
                  <div className="flex items-center gap-3">
                    {summary.all_passed ? (
                      <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
                    )}
                    <div>
                      <button
                        onClick={() => onCompanyClick?.(summary.company_id)}
                        className="font-medium hover:text-primary hover:underline transition-colors text-left"
                      >
                        {summary.company_name}
                      </button>
                      <div className="text-xs text-muted-foreground">
                        {summary.total_criteria} criteria evaluated
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <span className="text-green-600 dark:text-green-400">{summary.passed_criteria}✓</span>
                      <span className="text-red-600 dark:text-red-400">{summary.failed_criteria}✗</span>
                      {summary.inconclusive_criteria > 0 && (
                        <span className="text-amber-600 flex items-center">
                          {summary.inconclusive_criteria}<HelpCircle className="h-3 w-3 ml-0.5" />
                        </span>
                      )}
                    </span>
                    {summary.all_passed ? (
                      <Button
                        size="sm"
                        variant="default"
                        className="bg-green-600 hover:bg-green-700"
                        onClick={() => moveToL1(summary.company_id, summary.company_name)}
                        disabled={movingCompanyId === summary.company_id}
                      >
                        {movingCompanyId === summary.company_id ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <>
                            Move to L1
                            <ArrowRight className="h-3 w-3 ml-1" />
                          </>
                        )}
                      </Button>
                    ) : (
                      <>
                        <Badge variant="destructive">
                          Failed
                        </Badge>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-green-600 border-green-300 hover:bg-green-50 hover:text-green-700"
                          onClick={() => moveToL1(summary.company_id, summary.company_name)}
                          disabled={movingCompanyId === summary.company_id}
                        >
                          {movingCompanyId === summary.company_id ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <>
                              <ArrowRight className="h-3 w-3 mr-1" />
                              Promote to L1
                            </>
                          )}
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {totalCompletedPages > 1 && (
              <div className="flex items-center justify-center gap-2 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCompletedPage((p) => Math.max(0, p - 1))}
                  disabled={completedPage === 0}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-sm text-muted-foreground">
                  Page {completedPage + 1} of {totalCompletedPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCompletedPage((p) => Math.min(totalCompletedPages - 1, p + 1))}
                  disabled={completedPage >= totalCompletedPages - 1}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
