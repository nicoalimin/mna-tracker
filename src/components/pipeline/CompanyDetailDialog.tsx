import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import {
  Building2,
  TrendingUp,
  FileText,
  Link as LinkIcon,
  Upload,
  Plus,
  Loader2,
  Trash2,
  ExternalLink,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  DollarSign,
  BarChart3,
} from 'lucide-react';
import { DealStage, L1Status } from '@/lib/types';
import { formatDistanceToNow, format } from 'date-fns';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

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

interface StageHistory {
  id: string;
  stage: string;
  entered_at: string;
  exited_at: string | null;
  duration_seconds: number | null;
}

interface DealNote {
  id: string;
  content: string;
  stage: string;
  created_at: string;
}

interface DealLink {
  id: string;
  url: string;
  title: string | null;
  stage: string;
  created_at: string;
}

interface DealDocument {
  id: string;
  file_name: string;
  file_path: string;
  stage: string;
  created_at: string;
}

interface Screening {
  id: string;
  company_id: string;
  criteria_id: string;
  state: 'pending' | 'completed' | 'failed';
  result: string | null;
  remarks: string | null;
  created_at: string;
  criterias: {
    id: string;
    name: string;
    prompt: string;
  };
}

interface CompanyDetailDialogProps {
  company: CompanyWithDeal;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdate: () => void;
}

const formatCurrency = (value: number | null | undefined) => {
  if (value === null || value === undefined) return '-';
  if (value >= 1_000_000_000) return `$${(value / 1_000_000_000).toFixed(2)}B`;
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(2)}M`;
  if (value >= 1_000) return `$${(value / 1_000).toFixed(2)}K`;
  return `$${value.toFixed(0)}`;
};

const formatDuration = (seconds: number | null) => {
  if (seconds === null) return 'Ongoing';
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  if (days > 0) return `${days}d ${hours}h`;
  return `${hours}h`;
};

export default function CompanyDetailDialog({
  company,
  open,
  onOpenChange,
  onUpdate,
}: CompanyDetailDialogProps) {
  const [stageHistory, setStageHistory] = useState<StageHistory[]>([]);
  const [notes, setNotes] = useState<DealNote[]>([]);
  const [links, setLinks] = useState<DealLink[]>([]);
  const [documents, setDocuments] = useState<DealDocument[]>([]);
  const [screenings, setScreenings] = useState<Screening[]>([]);
  const [loading, setLoading] = useState(true);

  // Form states
  const [newNote, setNewNote] = useState('');
  const [newLinkUrl, setNewLinkUrl] = useState('');
  const [newLinkTitle, setNewLinkTitle] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      fetchDetails();
    }
  }, [open, company.id]);

  const fetchDetails = async () => {
    setLoading(true);
    try {
      const [historyRes, notesRes, linksRes, docsRes, screeningsRes] = await Promise.all([
        supabase
          .from('deal_stage_history')
          .select('*')
          .eq('deal_id', company.id)
          .order('entered_at', { ascending: false }),
        supabase
          .from('deal_notes')
          .select('*')
          .eq('deal_id', company.id)
          .order('created_at', { ascending: false }),
        supabase
          .from('deal_links')
          .select('*')
          .eq('deal_id', company.id)
          .order('created_at', { ascending: false }),
        supabase
          .from('deal_documents')
          .select('*')
          .eq('deal_id', company.id)
          .order('created_at', { ascending: false }),
        supabase
          .from('screenings')
          .select(`
            *,
            criterias (
              id,
              name,
              prompt
            )
          `)
          .eq('company_id', company.id)
          .order('created_at', { ascending: false }),
      ]);

      if (historyRes.data) setStageHistory(historyRes.data);
      if (notesRes.data) setNotes(notesRes.data);
      if (linksRes.data) setLinks(linksRes.data);
      if (docsRes.data) setDocuments(docsRes.data);
      if (screeningsRes.data) setScreenings(screeningsRes.data as Screening[]);
    } catch (error) {
      console.error('Error fetching details:', error);
    } finally {
      setLoading(false);
    }
  };

  const addNote = async () => {
    if (!newNote.trim()) return;
    setIsSubmitting(true);
    try {
      const { error } = await supabase.from('deal_notes').insert({
        deal_id: company.id,
        content: newNote,
        stage: company.current_stage,
      });
      if (error) throw error;
      setNewNote('');
      fetchDetails();
      toast.success('Note added');
    } catch (error: any) {
      toast.error('Failed to add note');
    } finally {
      setIsSubmitting(false);
    }
  };

  const addLink = async () => {
    if (!newLinkUrl.trim()) return;
    setIsSubmitting(true);
    try {
      const { error } = await supabase.from('deal_links').insert({
        deal_id: company.id,
        url: newLinkUrl,
        title: newLinkTitle || null,
        stage: company.current_stage,
      });
      if (error) throw error;
      setNewLinkUrl('');
      setNewLinkTitle('');
      fetchDetails();
      toast.success('Link added');
    } catch (error: any) {
      toast.error('Failed to add link');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsSubmitting(true);
    try {
      const filePath = `${company.id}/${Date.now()}_${file.name}`;
      const { error: uploadError } = await supabase.storage
        .from('deal-documents')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { error: dbError } = await supabase.from('deal_documents').insert({
        deal_id: company.id,
        file_name: file.name,
        file_path: filePath,
        file_size: file.size,
        mime_type: file.type,
        stage: company.current_stage,
      });

      if (dbError) throw dbError;

      fetchDetails();
      toast.success('Document uploaded');
    } catch (error: any) {
      console.error('Upload error:', error);
      toast.error('Failed to upload document');
    } finally {
      setIsSubmitting(false);
    }
  };

  const deleteNote = async (noteId: string) => {
    try {
      await supabase.from('deal_notes').delete().eq('id', noteId);
      fetchDetails();
      toast.success('Note deleted');
    } catch (error) {
      toast.error('Failed to delete note');
    }
  };

  const deleteLink = async (linkId: string) => {
    try {
      await supabase.from('deal_links').delete().eq('id', linkId);
      fetchDetails();
      toast.success('Link deleted');
    } catch (error) {
      toast.error('Failed to delete link');
    }
  };

  const deleteDocument = async (doc: DealDocument) => {
    try {
      await supabase.storage.from('deal-documents').remove([doc.file_path]);
      await supabase.from('deal_documents').delete().eq('id', doc.id);
      fetchDetails();
      toast.success('Document deleted');
    } catch (error) {
      toast.error('Failed to delete document');
    }
  };

  const downloadDocument = async (doc: DealDocument) => {
    try {
      const { data, error } = await supabase.storage
        .from('deal-documents')
        .download(doc.file_path);
      if (error) throw error;

      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = doc.file_name;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      toast.error('Failed to download document');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3 text-2xl">
            <Building2 className="h-6 w-6" />
            {company.name}
          </DialogTitle>
          <DialogDescription asChild>
            <div className="flex items-center gap-2">
              <Badge variant="outline">{company.sector}</Badge>
              <Badge variant={company.source === 'inbound' ? 'default' : 'secondary'}>
                {company.source}
              </Badge>
              <Badge variant="secondary">{company.current_stage}</Badge>
            </div>
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="filters">L1 Filters</TabsTrigger>
            <TabsTrigger value="notes">Notes</TabsTrigger>
            <TabsTrigger value="links">Links</TabsTrigger>
            <TabsTrigger value="documents">Documents</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4 mt-4">
            {/* Company Description */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  Company Overview
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm text-muted-foreground">Company Name</p>
                      <p className="font-semibold text-lg">{company.name}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Sector</p>
                      <p className="font-medium">{company.sector}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Source</p>
                      <Badge variant={company.source === 'inbound' ? 'default' : 'secondary'}>
                        {company.source}
                      </Badge>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm text-muted-foreground">Current Stage</p>
                      <Badge variant="outline" className="text-base px-3 py-1">
                        {company.current_stage}
                      </Badge>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Enterprise Valuation</p>
                      <p className="font-semibold text-2xl text-primary">{formatCurrency(company.valuation)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">L1 Status</p>
                      {company.l1_status ? (
                        <Badge variant={company.l1_status === 'Pass' ? 'default' : 'destructive'}>
                          {company.l1_status}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground text-sm">Not screened yet</span>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Revenue Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <BarChart3 className="h-4 w-4" />
                  Revenue (3 Years)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={[
                        { year: '2023', revenue: company.revenue_year1 || 0 },
                        { year: '2024', revenue: company.revenue_year2 || 0 },
                        { year: '2025', revenue: company.revenue_year3 || 0 },
                      ]}
                      margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis dataKey="year" className="text-sm" />
                      <YAxis
                        tickFormatter={(value) => `$${(value / 1_000_000).toFixed(0)}M`}
                        className="text-sm"
                      />
                      <Tooltip
                        formatter={(value: number) => [formatCurrency(value), 'Revenue']}
                        contentStyle={{
                          backgroundColor: 'hsl(var(--card))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px'
                        }}
                      />
                      <Bar
                        dataKey="revenue"
                        fill="hsl(var(--primary))"
                        radius={[4, 4, 0, 0]}
                        name="Revenue"
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* EBITDA Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  EBITDA (3 Years)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={[
                        { year: '2023', ebitda: company.ebitda_year1 || 0 },
                        { year: '2024', ebitda: company.ebitda_year2 || 0 },
                        { year: '2025', ebitda: company.ebitda_year3 || 0 },
                      ]}
                      margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis dataKey="year" className="text-sm" />
                      <YAxis
                        tickFormatter={(value) => `$${(value / 1_000_000).toFixed(1)}M`}
                        className="text-sm"
                      />
                      <Tooltip
                        formatter={(value: number) => [formatCurrency(value), 'EBITDA']}
                        contentStyle={{
                          backgroundColor: 'hsl(var(--card))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px'
                        }}
                      />
                      <Bar
                        dataKey="ebitda"
                        fill="hsl(142, 76%, 36%)"
                        radius={[4, 4, 0, 0]}
                        name="EBITDA"
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Stage History */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Stage History
                </CardTitle>
              </CardHeader>
              <CardContent>
                {stageHistory.length === 0 ? (
                  <p className="text-muted-foreground text-sm">No history yet</p>
                ) : (
                  <div className="space-y-2">
                    {stageHistory.map((history) => (
                      <div key={history.id} className="flex items-center justify-between py-2 border-b last:border-0">
                        <div className="flex items-center gap-3">
                          <Badge variant="outline">{history.stage}</Badge>
                          <span className="text-sm text-muted-foreground">
                            {format(new Date(history.entered_at), 'MMM d, yyyy HH:mm')}
                          </span>
                        </div>
                        <span className="text-sm font-medium">
                          {history.exited_at
                            ? formatDuration(history.duration_seconds)
                            : 'Current'
                          }
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="filters" className="space-y-4 mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">L1 Filter Results</CardTitle>
              </CardHeader>
              <CardContent>
                {screenings.length > 0 ? (
                  <div className="space-y-3">
                    {screenings.map((screening) => (
                      <div key={screening.id} className="flex items-center justify-between py-2 border-b last:border-0">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium">{screening.criterias?.name || 'Unknown Criteria'}</span>
                            <Badge
                              variant={screening.state === 'completed' ? 'outline' : screening.state === 'pending' ? 'secondary' : 'destructive'}
                              className="text-xs"
                            >
                              {screening.state}
                            </Badge>
                          </div>
                          {screening.result && (
                            <p className="text-sm text-muted-foreground mt-1">{screening.result}</p>
                          )}
                          {screening.remarks && (
                            <p className="text-xs text-muted-foreground mt-1 italic">{screening.remarks}</p>
                          )}
                        </div>
                        <ScreeningStateIcon state={screening.state} result={screening.result} />
                      </div>
                    ))}
                    <div className="pt-3 border-t">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">Overall Status</span>
                        <Badge variant={company.l1_status === 'Pass' ? 'default' : 'destructive'}>
                          {company.l1_status || 'Pending'}
                        </Badge>
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="text-muted-foreground text-sm">
                    No screenings have been run yet. Click "Screen" from the L0 stage to run filters.
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="notes" className="space-y-4 mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Notes
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Textarea
                    placeholder="Add a note..."
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    className="flex-1"
                  />
                  <Button onClick={addNote} disabled={isSubmitting || !newNote.trim()}>
                    {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                  </Button>
                </div>

                {notes.length === 0 ? (
                  <p className="text-muted-foreground text-sm">No notes yet</p>
                ) : (
                  <div className="space-y-3">
                    {notes.map((note) => (
                      <div key={note.id} className="p-3 border rounded-lg">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <p className="text-sm whitespace-pre-wrap">{note.content}</p>
                            <p className="text-xs text-muted-foreground mt-2">
                              {format(new Date(note.created_at), 'MMM d, yyyy HH:mm')} • {note.stage}
                            </p>
                          </div>
                          <Button variant="ghost" size="icon" onClick={() => deleteNote(note.id)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="links" className="space-y-4 mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <LinkIcon className="h-4 w-4" />
                  Links
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <div className="flex-1 space-y-2">
                    <Input
                      placeholder="URL"
                      value={newLinkUrl}
                      onChange={(e) => setNewLinkUrl(e.target.value)}
                    />
                    <Input
                      placeholder="Title (optional)"
                      value={newLinkTitle}
                      onChange={(e) => setNewLinkTitle(e.target.value)}
                    />
                  </div>
                  <Button onClick={addLink} disabled={isSubmitting || !newLinkUrl.trim()} className="self-end">
                    {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                  </Button>
                </div>

                {links.length === 0 ? (
                  <p className="text-muted-foreground text-sm">No links yet</p>
                ) : (
                  <div className="space-y-2">
                    {links.map((link) => (
                      <div key={link.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-2">
                          <ExternalLink className="h-4 w-4 text-muted-foreground" />
                          <a
                            href={link.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary hover:underline"
                          >
                            {link.title || link.url}
                          </a>
                          <Badge variant="outline" className="text-xs">{link.stage}</Badge>
                        </div>
                        <Button variant="ghost" size="icon" onClick={() => deleteLink(link.id)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="documents" className="space-y-4 mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Upload className="h-4 w-4" />
                  Documents
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="file-upload" className="cursor-pointer">
                    <div className="border-2 border-dashed rounded-lg p-6 text-center hover:border-primary transition-colors">
                      <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">
                        Click to upload a document
                      </p>
                    </div>
                  </Label>
                  <Input
                    id="file-upload"
                    type="file"
                    className="hidden"
                    onChange={handleFileUpload}
                    disabled={isSubmitting}
                  />
                </div>

                {documents.length === 0 ? (
                  <p className="text-muted-foreground text-sm">No documents yet</p>
                ) : (
                  <div className="space-y-2">
                    {documents.map((doc) => (
                      <div key={doc.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-muted-foreground" />
                          <button
                            onClick={() => downloadDocument(doc)}
                            className="text-primary hover:underline text-left"
                          >
                            {doc.file_name}
                          </button>
                          <Badge variant="outline" className="text-xs">{doc.stage}</Badge>
                        </div>
                        <Button variant="ghost" size="icon" onClick={() => deleteDocument(doc)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

function FilterResult({ label, passed }: { label: string; passed: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm">{label}</span>
      {passed ? (
        <div className="flex items-center gap-1 text-green-600">
          <CheckCircle2 className="h-4 w-4" />
          <span className="text-sm font-medium">Pass</span>
        </div>
      ) : (
        <div className="flex items-center gap-1 text-red-600">
          <XCircle className="h-4 w-4" />
          <span className="text-sm font-medium">Fail</span>
        </div>
      )}
    </div>
  );
}

function ScreeningStateIcon({ state, result }: { state: 'pending' | 'completed' | 'failed'; result: string | null }) {
  if (state === 'pending') {
    return (
      <div className="flex items-center gap-1 text-yellow-600">
        <AlertCircle className="h-4 w-4" />
        <span className="text-sm font-medium">Pending</span>
      </div>
    );
  }
  if (state === 'failed') {
    return (
      <div className="flex items-center gap-1 text-red-600">
        <XCircle className="h-4 w-4" />
        <span className="text-sm font-medium">Failed</span>
      </div>
    );
  }
  // For completed state, check the result
  const isPassed = result?.toLowerCase() === 'pass' || result?.toLowerCase() === 'yes';
  return (
    <div className={`flex items-center gap-1 ${isPassed ? 'text-green-600' : 'text-red-600'}`}>
      {isPassed ? <CheckCircle2 className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
      <span className="text-sm font-medium">{isPassed ? 'Pass' : 'Fail'}</span>
    </div>
  );
}

