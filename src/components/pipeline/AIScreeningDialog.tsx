import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Sparkles, Plus, Pencil, Trash2, Loader2, CheckCircle2, XCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Company {
  id: string;
  name: string;
  sector: string;
  revenue_year1: number | null;
  revenue_year2: number | null;
  revenue_year3: number | null;
  ebitda_year1: number | null;
  ebitda_year2: number | null;
  ebitda_year3: number | null;
  valuation: number | null;
  source: string;
}

interface CriterionResult {
  criterion: string;
  passed: boolean;
  reason: string;
}

interface CompanyResult {
  company_id: string;
  company_name: string;
  passes: boolean;
  criteria_results: CriterionResult[];
}

interface ScreeningResults {
  results: CompanyResult[];
  summary: {
    total_evaluated: number;
    total_passed: number;
    total_failed: number;
  };
}

interface AIScreeningDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  companies: Company[];
  onComplete: () => void;
}

interface Criteria {
  id: string;
  name: string;
  prompt: string;
}

export default function AIScreeningDialog({
  open,
  onOpenChange,
  companies,
  onComplete,
}: AIScreeningDialogProps) {
  const [criteria, setCriteria] = useState<Criteria[]>([]);
  const [isLoadingCriteria, setIsLoadingCriteria] = useState(true);
  const [newCriterion, setNewCriterion] = useState('');
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editValue, setEditValue] = useState('');
  const [isScreening, setIsScreening] = useState(false);
  const [results, setResults] = useState<ScreeningResults | null>(null);
  const [isMoving, setIsMoving] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Fetch criteria from database on mount
  useEffect(() => {
    const fetchCriteria = async () => {
      setIsLoadingCriteria(true);
      try {
        const { data, error } = await supabase
          .from('criterias')
          .select('id, name, prompt')
          .order('created_at', { ascending: true });

        if (error) throw error;
        setCriteria(data || []);
      } catch (error: any) {
        console.error('Error fetching criteria:', error);
        toast.error('Failed to load screening criteria');
      } finally {
        setIsLoadingCriteria(false);
      }
    };

    if (open) {
      fetchCriteria();
    }
  }, [open]);

  const addCriterion = async () => {
    if (!newCriterion.trim()) return;

    setIsSaving(true);
    try {
      const { data, error } = await supabase
        .from('criterias')
        .insert({
          name: newCriterion.trim(),
          prompt: newCriterion.trim(),
        })
        .select()
        .single();

      if (error) throw error;

      setCriteria([...criteria, data]);
      setNewCriterion('');
      toast.success('Criterion added');
    } catch (error: any) {
      console.error('Error adding criterion:', error);
      toast.error('Failed to add criterion');
    } finally {
      setIsSaving(false);
    }
  };

  const deleteCriterion = async (index: number) => {
    const criterionToDelete = criteria[index];
    
    try {
      const { error } = await supabase
        .from('criterias')
        .delete()
        .eq('id', criterionToDelete.id);

      if (error) throw error;

      setCriteria(criteria.filter((_, i) => i !== index));
      setResults(null); // Clear results when criteria change
      toast.success('Criterion deleted');
    } catch (error: any) {
      console.error('Error deleting criterion:', error);
      toast.error('Failed to delete criterion');
    }
  };

  const startEdit = (index: number) => {
    setEditingIndex(index);
    setEditValue(criteria[index].prompt);
  };

  const saveEdit = async () => {
    if (editingIndex === null || !editValue.trim()) return;

    const criterionToUpdate = criteria[editingIndex];
    setIsSaving(true);

    try {
      const { error } = await supabase
        .from('criterias')
        .update({
          name: editValue.trim(),
          prompt: editValue.trim(),
        })
        .eq('id', criterionToUpdate.id);

      if (error) throw error;

      const newCriteria = [...criteria];
      newCriteria[editingIndex] = {
        ...criterionToUpdate,
        name: editValue.trim(),
        prompt: editValue.trim(),
      };
      setCriteria(newCriteria);
      setEditingIndex(null);
      setEditValue('');
      setResults(null);
      toast.success('Criterion updated');
    } catch (error: any) {
      console.error('Error updating criterion:', error);
      toast.error('Failed to update criterion');
    } finally {
      setIsSaving(false);
    }
  };

  const cancelEdit = () => {
    setEditingIndex(null);
    setEditValue('');
  };

  const runScreening = async () => {
    if (criteria.length === 0) {
      toast.error('Please add at least one screening criterion');
      return;
    }

    setIsScreening(true);
    setResults(null);

    try {
      // Extract just the prompt strings to send to the AI
      const criteriaPrompts = criteria.map((c) => c.prompt);
      
      const { data, error } = await supabase.functions.invoke('ai-screening', {
        body: { companies, criteria: criteriaPrompts },
      });

      if (error) {
        throw error;
      }

      if (data.error) {
        throw new Error(data.error);
      }

      setResults(data as ScreeningResults);
      toast.success(`Screening complete: ${data.summary.total_passed} companies passed`);
    } catch (error: any) {
      console.error('Screening error:', error);
      if (error.message?.includes('429') || error.message?.includes('Rate limit')) {
        toast.error('Rate limit exceeded. Please try again in a moment.');
      } else if (error.message?.includes('402') || error.message?.includes('Payment')) {
        toast.error('Credits depleted. Please add credits to continue.');
      } else {
        toast.error(error.message || 'Failed to run AI screening');
      }
    } finally {
      setIsScreening(false);
    }
  };

  const moveToL1 = async () => {
    if (!results) return;

    const passingCompanies = results.results.filter((r) => r.passes);

    if (passingCompanies.length === 0) {
      toast.error('No companies passed the screening criteria');
      return;
    }

    setIsMoving(true);

    try {
      // Update companies to move to L1 stage
      for (const company of passingCompanies) {
        // Update the company's pipeline stage to L1
        const { error: updateError } = await supabase
          .from('companies')
          .update({
            pipeline_stage: 'L1',
            l1_screening_result: 'Pass',
          })
          .eq('id', company.company_id);

        if (updateError) {
          console.error('Error updating company:', updateError);
          continue;
        }

        // Log the screening action
        await supabase.from('company_logs').insert({
          company_id: company.company_id,
          action: 'PROMOTED_TO_L1',
        });
      }

      toast.success(`${passingCompanies.length} companies moved to L1`);
      onComplete();
      onOpenChange(false);
    } catch (error: any) {
      console.error('Error moving companies:', error);
      toast.error('Failed to move companies to L1');
    } finally {
      setIsMoving(false);
    }
  };

  const passedCount = results?.summary.total_passed || 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <div>
              <DialogTitle className="text-xl">AI Screening</DialogTitle>
              <DialogDescription>
                Configure screening criteria in natural language
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Criteria Header */}
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold">Screening Criteria</h3>
              <p className="text-sm text-muted-foreground">
                Define your criteria using Natural Language, AI will do the rest
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => document.getElementById('new-criterion-input')?.focus()}
            >
              <Plus className="h-4 w-4 mr-1" />
              Add New
            </Button>
          </div>

          {/* Criteria List */}
          <div className="space-y-3">
            {isLoadingCriteria ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                <span className="ml-2 text-muted-foreground">Loading criteria...</span>
              </div>
            ) : criteria.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No screening criteria found. Add your first criterion below.
              </div>
            ) : (
              criteria.map((criterion, index) => (
                <div
                  key={criterion.id}
                  className="flex items-start gap-3 p-4 border rounded-lg bg-card"
                >
                  <Badge
                    variant="secondary"
                    className="shrink-0 h-6 w-6 rounded-full p-0 flex items-center justify-center bg-blue-100 text-blue-700"
                  >
                    {index + 1}
                  </Badge>

                  {editingIndex === index ? (
                    <div className="flex-1 flex gap-2">
                      <Input
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && saveEdit()}
                        autoFocus
                        disabled={isSaving}
                      />
                      <Button size="sm" onClick={saveEdit} disabled={isSaving}>
                        {isSaving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'Save'}
                      </Button>
                      <Button size="sm" variant="ghost" onClick={cancelEdit} disabled={isSaving}>
                        Cancel
                      </Button>
                    </div>
                  ) : (
                    <>
                      <span className="flex-1 pt-0.5">{criterion.prompt}</span>
                      <div className="flex gap-1">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => startEdit(index)}
                        >
                          <Pencil className="h-3.5 w-3.5 mr-1" />
                          Edit
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          onClick={() => deleteCriterion(index)}
                        >
                          <Trash2 className="h-3.5 w-3.5 mr-1" />
                          Delete
                        </Button>
                      </div>
                    </>
                  )}
                </div>
              ))
            )}

            {/* Add New Criterion Input */}
            <div className="flex gap-2 p-4 border rounded-lg border-dashed">
              <Input
                id="new-criterion-input"
                placeholder="Type a new criterion (e.g., 'Revenue contribution from Asia > 30%')"
                value={newCriterion}
                onChange={(e) => setNewCriterion(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && !isSaving && addCriterion()}
                disabled={isSaving}
              />
              <Button onClick={addCriterion} disabled={!newCriterion.trim() || isSaving}>
                {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Add'}
              </Button>
            </div>
          </div>

          {/* Results Preview */}
          {results && (
            <div className="space-y-3 border-t pt-4">
              <h4 className="font-semibold">Screening Results</h4>
              <div className="grid gap-2 max-h-48 overflow-y-auto">
                {results.results.map((result) => (
                  <div
                    key={result.company_id}
                    className={`flex items-center justify-between p-3 rounded-lg border ${result.passes
                        ? 'bg-green-50 border-green-200'
                        : 'bg-red-50 border-red-200'
                      }`}
                  >
                    <div className="flex items-center gap-2">
                      {result.passes ? (
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                      ) : (
                        <XCircle className="h-4 w-4 text-red-600" />
                      )}
                      <span className="font-medium">{result.company_name}</span>
                    </div>
                    <Badge variant={result.passes ? 'default' : 'destructive'}>
                      {result.passes ? 'Pass' : 'Fail'}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-4 border-t">
          <span className="text-sm">
            <span className={passedCount > 0 ? 'text-green-600 font-semibold' : 'text-muted-foreground'}>
              {passedCount} companies
            </span>
            {' '}ready to move to L1
          </span>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            {results ? (
              <Button
                onClick={moveToL1}
                disabled={passedCount === 0 || isMoving}
                className="bg-gradient-to-r from-purple-600 to-purple-500"
              >
                {isMoving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Moving...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-2" />
                    Apply Screening & Move to L1
                  </>
                )}
              </Button>
            ) : (
              <Button
                onClick={runScreening}
                disabled={isScreening || isLoadingCriteria || criteria.length === 0}
                className="bg-gradient-to-r from-purple-600 to-purple-500"
              >
                {isScreening ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Screening...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-2" />
                    Run AI Screening
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
