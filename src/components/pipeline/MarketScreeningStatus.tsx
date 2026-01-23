import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Loader2, Settings, Radar, Play } from 'lucide-react';

interface InvestmentThesis {
  id: string;
  title: string;
  content: string;
  is_active: boolean;
  scan_frequency: string;
  last_scan_at: string | null;
  next_scan_at: string | null;
  sources_count: number;
}

interface MarketScreeningStatusProps {
  onScanComplete: () => void;
  newCandidatesCount: number;
}

export default function MarketScreeningStatus({ onScanComplete, newCandidatesCount }: MarketScreeningStatusProps) {
  const [thesis, setThesis] = useState<InvestmentThesis | null>(null);
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [showThesisDialog, setShowThesisDialog] = useState(false);

  // Form state
  const [thesisTitle, setThesisTitle] = useState('');
  const [thesisContent, setThesisContent] = useState('');
  const [scanFrequency, setScanFrequency] = useState('weekly');
  const [sourcesCount, setSourcesCount] = useState(5);

  const fetchThesis = async () => {
    try {
      const { data, error } = await (supabase as any)
        .from('investment_thesis')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data) {
        setThesis(data as InvestmentThesis);
        setThesisTitle(data.title);
        setThesisContent(data.content);
        setScanFrequency(data.scan_frequency);
        setSourcesCount(data.sources_count);
      }
    } catch (error: any) {
      console.error('Error fetching thesis:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchThesis();
  }, []);

  const saveThesis = async () => {
    try {
      if (!thesisContent.trim()) {
        toast.error('Please enter an investment thesis');
        return;
      }

      if (thesis) {
        // Update existing thesis
        const { error } =         await (supabase as any)
          .from('investment_thesis')
          .update({
            title: thesisTitle,
            content: thesisContent,
            scan_frequency: scanFrequency,
            sources_count: sourcesCount,
          })
          .eq('id', thesis.id);

        if (error) throw error;
        toast.success('Investment thesis updated');
      } else {
        // Create new thesis
        const nextScan = new Date();
        if (scanFrequency === 'daily') {
          nextScan.setDate(nextScan.getDate() + 1);
        } else if (scanFrequency === 'weekly') {
          nextScan.setDate(nextScan.getDate() + 7);
        } else {
          nextScan.setMonth(nextScan.getMonth() + 1);
        }

        const { data, error } =         await (supabase as any)
          .from('investment_thesis')
          .insert({
            title: thesisTitle || 'Default Thesis',
            content: thesisContent,
            scan_frequency: scanFrequency,
            sources_count: sourcesCount,
            next_scan_at: nextScan.toISOString(),
          })
          .select()
          .single();

        if (error) throw error;
        setThesis(data as InvestmentThesis);
        toast.success('Investment thesis created');
      }

      setShowThesisDialog(false);
      fetchThesis();
    } catch (error: any) {
      console.error('Error saving thesis:', error);
      toast.error('Failed to save thesis');
    }
  };

  const runScan = async () => {
    if (!thesis) {
      toast.error('Please set up an investment thesis first');
      setShowThesisDialog(true);
      return;
    }

    setScanning(true);
    try {
      const { data, error } = await supabase.functions.invoke('market-screening', {
        body: {
          thesisId: thesis.id,
          thesis: thesis.content,
          sourcesCount: thesis.sources_count,
        },
      });

      if (error) throw error;

      if (data.error) {
        throw new Error(data.error);
      }

      toast.success(`Found ${data.count} matching companies`);
      fetchThesis();
      onScanComplete();
    } catch (error: any) {
      console.error('Error running scan:', error);
      toast.error(error.message || 'Failed to run market screening');
    } finally {
      setScanning(false);
    }
  };

  if (loading) {
    return (
      <div className="border rounded-lg p-4 bg-card animate-pulse">
        <div className="h-6 bg-muted rounded w-48"></div>
      </div>
    );
  }

  const isActive = thesis?.is_active && thesis?.content;

  return (
    <div className="border border-purple-200 dark:border-purple-800/50 rounded-lg px-4 py-3 bg-gradient-to-r from-purple-50/80 to-violet-50/50 dark:from-purple-950/30 dark:to-violet-950/20">
      <div className="flex items-center justify-between gap-4">
        {/* Status indicator */}
        <div className="flex items-center gap-2 shrink-0">
          <div className={`w-2.5 h-2.5 rounded-full ${isActive ? 'bg-purple-500 animate-pulse' : 'bg-muted-foreground'}`} />
          <span className="font-semibold text-sm uppercase tracking-wide whitespace-nowrap">
            Market Scanning {isActive ? '(Live)' : '(Inactive)'}
          </span>
        </div>

        {/* Last Scan */}
        {thesis?.last_scan_at && (
          <div className="text-sm shrink-0">
            <span className="text-muted-foreground uppercase text-xs tracking-wide block">Last Scan Completed</span>
            <span className="font-medium whitespace-nowrap">{format(new Date(thesis.last_scan_at), 'MMM d, yyyy, hh:mm a')}</span>
          </div>
        )}

        {/* Next Scan */}
        {thesis?.next_scan_at && (
          <div className="text-sm shrink-0">
            <span className="text-muted-foreground uppercase text-xs tracking-wide block">Next Scan</span>
            <span className="font-medium whitespace-nowrap">{format(new Date(thesis.next_scan_at), 'MMM d, yyyy, hh:mm a')}</span>
          </div>
        )}


        {/* New Candidates */}
        <div className="text-sm shrink-0">
          <span className="text-muted-foreground uppercase text-xs tracking-wide block">New Candidates (Last 7D)</span>
          <span className="font-medium">{newCandidatesCount}</span>
        </div>

        {/* Buttons */}
        <div className="flex items-center gap-2 shrink-0 ml-auto">
          <Dialog open={showThesisDialog} onOpenChange={setShowThesisDialog}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Settings className="h-4 w-4 mr-2" />
                Configure
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Investment Thesis Configuration</DialogTitle>
                <DialogDescription>
                  Define your investment criteria. AI will search for companies matching this thesis.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 mt-4">
                <div>
                  <Label htmlFor="thesis-title">Thesis Name</Label>
                  <Input
                    id="thesis-title"
                    value={thesisTitle}
                    onChange={(e) => setThesisTitle(e.target.value)}
                    placeholder="e.g., Healthcare SaaS Mid-Market"
                  />
                </div>

                <div>
                  <Label htmlFor="thesis-content">Investment Thesis</Label>
                  <Textarea
                    id="thesis-content"
                    value={thesisContent}
                    onChange={(e) => setThesisContent(e.target.value)}
                    placeholder="Describe your ideal investment target in detail. Include:
- Target sectors and industries
- Revenue range and growth requirements
- EBITDA margins expectations
- Geographic focus
- Business model characteristics
- Value creation opportunities"
                    rows={8}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="scan-frequency">Scan Frequency</Label>
                    <Select value={scanFrequency} onValueChange={setScanFrequency}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select frequency" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="daily">Daily</SelectItem>
                        <SelectItem value="weekly">Weekly</SelectItem>
                        <SelectItem value="monthly">Monthly</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="sources-count">Companies per Scan</Label>
                    <Input
                      id="sources-count"
                      type="number"
                      min={1}
                      max={20}
                      value={sourcesCount}
                      onChange={(e) => setSourcesCount(parseInt(e.target.value) || 5)}
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-4">
                  <Button variant="outline" onClick={() => setShowThesisDialog(false)}>
                    Cancel
                  </Button>
                  <Button onClick={saveThesis}>
                    Save Thesis
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          <Button
            onClick={runScan}
            disabled={scanning}
            className="bg-emerald-600 hover:bg-emerald-700"
          >
            {scanning ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Scanning...
              </>
            ) : (
              <>
                <Play className="h-4 w-4 mr-2" />
                Run Scan Now
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
