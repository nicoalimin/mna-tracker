'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import {
  Building2,
  ArrowLeft,
  FileText,
  Link as LinkIcon,
  Upload,
  Plus,
  Loader2,
  Trash2,
  ExternalLink,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Lightbulb,
  TrendingUp,
  AlertTriangle,
  Search,
  Briefcase,
  Globe,
  Sparkles,
} from 'lucide-react';
import { CompanyAnalysisSection } from '@/components/pipeline/CompanyAnalysisSection';
import { FinancialCharts } from '@/components/pipeline/FinancialCharts';
import { DealStage } from '@/lib/types';
import { formatDistanceToNow, format } from 'date-fns';

interface CompanyData {
  id: string;
  target: string | null;
  segment: string | null;
  pipeline_stage: string | null;
  website: string | null;
  geography: string | null;
  ownership: string | null;
  comments: string | null;
  company_focus: string | null;
  // Revenue fields (USD Mn)
  revenue_2021_usd_mn: number | null;
  revenue_2022_usd_mn: number | null;
  revenue_2023_usd_mn: number | null;
  revenue_2024_usd_mn: number | null;
  // EBITDA fields (USD Mn)
  ebitda_2021_usd_mn: number | null;
  ebitda_2022_usd_mn: number | null;
  ebitda_2023_usd_mn: number | null;
  ebitda_2024_usd_mn: number | null;
  // EV/Valuation
  ev_2024: number | null;
  // L1 screening results
  l1_screening_result: string | null;
  l1_rationale: string | null;
  l1_vision_fit: string | null;
  l1_priority_geo_flag: string | null;
  l1_ev_below_threshold: string | null;
  l1_revenue_no_consecutive_drop_usd: string | null;
  // EBITDA margin
  ebitda_margin_2021: number | null;
  ebitda_margin_2022: number | null;
  ebitda_margin_2023: number | null;
  ebitda_margin_2024: number | null;
  created_at: string | null;
  updated_at: string | null;
}

interface DealNote {
  id: string;
  content: string;
  stage: string;
  created_at: string | null;
}

interface DealLink {
  id: string;
  url: string;
  title: string | null;
  stage: string;
  created_at: string | null;
}

interface DealDocument {
  id: string;
  file_name: string;
  file_path: string;
  stage: string;
  created_at: string | null;
}

interface CompanyAnalysis {
  id?: string;
  deal_id: string;
  business_overview: string | null;
  business_model_summary: string | null;
  key_takeaways: string | null;
  investment_highlights: string | null;
  investment_risks: string | null;
  diligence_priorities: string | null;
}

// Mock data for analysis sections
const MOCK_ANALYSIS: CompanyAnalysis = {
  deal_id: '',
  business_overview: `- **Primary Products**: Specialty polyurethane foam systems, custom-formulated adhesives, and coating solutions
- **End Markets**: Automotive interiors, construction insulation, furniture manufacturing, and industrial packaging
- **Customer Types**: OEM manufacturers, tier-1 automotive suppliers, commercial construction contractors
- **Geographic Footprint**: Headquarters in Munich, Germany; production facilities in Poland and Czech Republic`,
  business_model_summary: `- **Core Focus**: Niche specialty formulator focused on high-performance polyurethane systems
- **Value Chain Position**: Midstream specialty producer—sources base chemicals from upstream suppliers and formulates proprietary blends for downstream OEMs
- **Revenue Model**: Volume-based sales with 60% recurring contract manufacturing; 40% project-based custom formulations
- **Competitive Dimension**: Technical specification compliance and rapid formulation turnaround; customers face moderate switching costs due to qualification requirements`,
  key_takeaways: `1. **Strong customer stickiness** driven by qualification-based switching costs in automotive applications
2. **Margin profile protected** by technical differentiation rather than commodity pricing dynamics
3. **Geographic concentration risk** with 85% of revenue from DACH region
4. **Growth constrained** by capacity utilization at 92%—expansion capex likely required for material growth
5. **Management depth untested** following recent CFO departure`,
  investment_highlights: `- **Market Position**: Top-3 specialty formulator in DACH automotive foam market with 15+ year customer relationships
- **Differentiation**: Proprietary low-VOC formulation technology aligned with tightening EU regulations
- **Strategic Fit**: Direct alignment with thesis focus on specialty chemical platforms with regulatory tailwinds
- **Growth Vectors**: EV lightweighting trend driving demand for high-performance foam systems; pipeline of 3 new OEM qualifications expected in 2025`,
  investment_risks: `- **Customer Concentration**: Top 3 customers represent 55% of revenue
- **Regulatory Exposure**: REACH compliance costs increasing; potential reformulation requirements
- **End-Market Cyclicality**: Automotive represents 70% of revenue; vulnerable to production slowdowns
- **Data Gaps**: Limited visibility into raw material cost pass-through mechanisms and contract terms`,
  diligence_priorities: `1. What is the actual customer churn rate over the past 5 years, and what drove any losses?
2. Can management provide detailed margin bridge showing raw material pass-through effectiveness?
3. What capex is required to address capacity constraints, and what is the expected ROI?
4. Validate the 3 pending OEM qualifications—stage, timeline, and expected revenue contribution
5. Assess CFO departure circumstances and current finance function capabilities
6. Review REACH compliance roadmap and associated cost estimates`,
};

const formatCurrency = (value: number | null) => {
  if (value === null) return '-';
  // Values in the DB are in USD Mn, so multiply by 1M for display
  const actualValue = value * 1_000_000;
  if (actualValue >= 1_000_000_000) return `$${(actualValue / 1_000_000_000).toFixed(2)}B`;
  if (actualValue >= 1_000_000) return `$${(actualValue / 1_000_000).toFixed(2)}M`;
  if (actualValue >= 1_000) return `$${(actualValue / 1_000).toFixed(2)}K`;
  return `$${actualValue.toFixed(0)}`;
};

export default function CompanyDetailPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const companyId = params.dealId as string;
  const returnTo = searchParams.get('from') || '/pipeline';

  const [company, setCompany] = useState<CompanyData | null>(null);
  const [notes, setNotes] = useState<DealNote[]>([]);
  const [links, setLinks] = useState<DealLink[]>([]);
  const [documents, setDocuments] = useState<DealDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const displayAnalysis = MOCK_ANALYSIS;

  const [newNote, setNewNote] = useState('');
  const [newLinkUrl, setNewLinkUrl] = useState('');
  const [newLinkTitle, setNewLinkTitle] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lastEvaluationAt] = useState<Date | null>(new Date('2025-02-03T14:30:00'));

  useEffect(() => {
    if (companyId) {
      fetchCompany();
    }
  }, [companyId]);

  const fetchCompany = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('companies')
        .select('*')
        .eq('id', companyId)
        .single();

      if (error) throw error;
      if (data) {
        setCompany(data as CompanyData);
        fetchDetails();
      }
    } catch (error) {
      console.error('Error fetching company:', error);
      toast.error('Failed to load company details');
    } finally {
      setLoading(false);
    }
  };

  const fetchDetails = async () => {
    if (!companyId) return;
    try {
      const [notesRes, linksRes, docsRes] = await Promise.all([
        supabase
          .from('deal_notes')
          .select('*')
          .eq('deal_id', companyId)
          .order('created_at', { ascending: false }),
        supabase
          .from('deal_links')
          .select('*')
          .eq('deal_id', companyId)
          .order('created_at', { ascending: false }),
        supabase
          .from('deal_documents')
          .select('*')
          .eq('deal_id', companyId)
          .order('created_at', { ascending: false }),
      ]);

      if (notesRes.data) setNotes(notesRes.data);
      if (linksRes.data) setLinks(linksRes.data);
      if (docsRes.data) setDocuments(docsRes.data);
    } catch (error) {
      console.error('Error fetching details:', error);
    }
  };

  const addNote = async () => {
    if (!newNote.trim() || !company) return;
    setIsSubmitting(true);
    try {
      const { error } = await supabase.from('deal_notes').insert({
        deal_id: company.id,
        content: newNote,
        stage: company.pipeline_stage || 'L0',
      });
      if (error) throw error;
      setNewNote('');
      await fetchDetails();
      toast.success('Note added');
    } catch (error: unknown) {
      console.error('Add note error:', error);
      toast.error((error as Error)?.message || 'Failed to add note');
    } finally {
      setIsSubmitting(false);
    }
  };

  const addLink = async () => {
    if (!newLinkUrl.trim() || !company) return;
    setIsSubmitting(true);
    try {
      const { error } = await supabase.from('deal_links').insert({
        deal_id: company.id,
        url: newLinkUrl,
        title: newLinkTitle || null,
        stage: company.pipeline_stage || 'L0',
      });
      if (error) throw error;
      setNewLinkUrl('');
      setNewLinkTitle('');
      await fetchDetails();
      toast.success('Link added');
    } catch (error: unknown) {
      console.error('Add link error:', error);
      toast.error((error as Error)?.message || 'Failed to add link');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !company) return;

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
        stage: company.pipeline_stage || 'L0',
      });

      if (dbError) throw dbError;

      await fetchDetails();
      toast.success('Document uploaded');
    } catch (error: unknown) {
      console.error('Upload error:', error);
      toast.error((error as Error)?.message || 'Failed to upload document');
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

  const getL1StatusIcon = (value: string | null) => {
    if (value === 'Yes' || value === 'Pass') return <CheckCircle2 className="h-4 w-4 text-green-500" />;
    if (value === 'No' || value === 'Fail') return <XCircle className="h-4 w-4 text-destructive" />;
    return <AlertCircle className="h-4 w-4 text-muted-foreground" />;
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-full">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </DashboardLayout>
    );
  }

  if (!company) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center h-full gap-4">
          <p className="text-muted-foreground">Company not found</p>
          <Button onClick={() => router.push(returnTo)}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Go Back
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => router.push(returnTo)}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-3">
                <Building2 className="h-6 w-6" />
                {company.target || 'Unnamed Company'}
              </h1>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="outline">{company.segment || 'N/A'}</Badge>
                <Badge variant="secondary">{company.pipeline_stage || 'L0'}</Badge>
                {company.l1_screening_result && (
                  <Badge variant={company.l1_screening_result === 'Pass' ? 'default' : 'destructive'}>
                    L1: {company.l1_screening_result}
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <Tabs defaultValue="company-card" className="w-full">
          <div className="flex items-center justify-between">
            <TabsList className="grid grid-cols-3 max-w-lg">
              <TabsTrigger value="company-card">Company Card</TabsTrigger>
              <TabsTrigger value="filters">L1 Screening</TabsTrigger>
              <TabsTrigger value="attachments">Attachments</TabsTrigger>
            </TabsList>
            <div className="flex flex-col items-end gap-1">
              <Button size="sm" className="bg-accent hover:bg-accent/90 text-accent-foreground gap-2">
                <Sparkles className="h-4 w-4" />
                AI Company Card
              </Button>
              {lastEvaluationAt && (
                <span className="text-xs text-muted-foreground">
                  Last: {format(lastEvaluationAt, 'MMM d, yyyy HH:mm')}
                </span>
              )}
            </div>
          </div>

          <TabsContent value="company-card" className="space-y-6 mt-6">
            {/* Company Info Card */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  Company Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Company Name</p>
                    <p className="font-semibold">{company.target || '-'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Website</p>
                    {company.website ? (
                      <a href={company.website} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline text-sm">
                        {company.website}
                      </a>
                    ) : (
                      <p className="text-muted-foreground text-sm">Not available</p>
                    )}
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Segment</p>
                    <p className="font-medium">{company.segment || '-'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Geography</p>
                    <p className="font-medium">{company.geography || 'Not specified'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Ownership</p>
                    <Badge variant="outline">{company.ownership || 'Private'}</Badge>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Company Focus</p>
                    <p className="font-medium text-sm">{company.company_focus || '-'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Current Stage</p>
                    <Badge variant="outline">{company.pipeline_stage || 'L0'}</Badge>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">EV (2024)</p>
                    <p className="font-semibold text-primary">{formatCurrency(company.ev_2024)}</p>
                  </div>
                </div>
                {/* Comments Section */}
                {company.comments && (
                  <div className="mt-4 pt-4 border-t">
                    <p className="text-sm text-muted-foreground mb-2">Comments</p>
                    <p className="text-sm">{company.comments}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Financial Charts */}
            <FinancialCharts
              revenue_year1={company.revenue_2022_usd_mn ? company.revenue_2022_usd_mn * 1_000_000 : null}
              revenue_year2={company.revenue_2023_usd_mn ? company.revenue_2023_usd_mn * 1_000_000 : null}
              revenue_year3={company.revenue_2024_usd_mn ? company.revenue_2024_usd_mn * 1_000_000 : null}
              ebitda_year1={company.ebitda_2022_usd_mn ? company.ebitda_2022_usd_mn * 1_000_000 : null}
              ebitda_year2={company.ebitda_2023_usd_mn ? company.ebitda_2023_usd_mn * 1_000_000 : null}
              ebitda_year3={company.ebitda_2024_usd_mn ? company.ebitda_2024_usd_mn * 1_000_000 : null}
            />

            {/* AI Company Card Section */}
            <div className="rounded-lg border border-accent/30 bg-accent/5 p-6 space-y-6">
              <div className="flex items-center justify-between gap-4 mb-2 flex-wrap">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-accent" />
                  <h3 className="text-lg font-semibold text-accent">AI Company Card</h3>
                  <span className="text-xs text-muted-foreground ml-2">AI-generated analysis</span>
                </div>
                <div className="flex items-center gap-3 flex-wrap">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">Sources:</span>
                    <a
                      href="https://www.crunchbase.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-accent/10 text-accent text-xs hover:bg-accent/20 transition-colors"
                    >
                      <Globe className="h-3 w-3" />
                      crunchbase.com
                      <ExternalLink className="h-2.5 w-2.5" />
                    </a>
                    <a
                      href="https://www.linkedin.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-accent/10 text-accent text-xs hover:bg-accent/20 transition-colors"
                    >
                      <Globe className="h-3 w-3" />
                      linkedin.com
                      <ExternalLink className="h-2.5 w-2.5" />
                    </a>
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-accent/10 text-accent text-xs">
                      <FileText className="h-3 w-3" />
                      Company_Profile.pdf
                    </span>
                  </div>
                </div>
              </div>

              {/* Business Overview */}
              <CompanyAnalysisSection
                title="Business Overview"
                description="Establish a factual baseline: products, end markets, customer types, and geographic footprint."
                icon={Building2}
                content={displayAnalysis.business_overview || ''}
                colorVariant="default"
              />

              {/* Business Model & Value Chain Summary */}
              <CompanyAnalysisSection
                title="Business Model & Value Chain Summary"
                description="Explain how the company operates economically and where it sits in the industry value chain."
                icon={Briefcase}
                content={displayAnalysis.business_model_summary || ''}
                colorVariant="teal"
              />

              {/* Key Takeaways */}
              <CompanyAnalysisSection
                title="Key Takeaways"
                description="Surface the most important implications from the analysis above (3-5 synthesized insights)."
                icon={Lightbulb}
                content={displayAnalysis.key_takeaways || ''}
                colorVariant="blue"
              />

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Investment Highlights */}
                <CompanyAnalysisSection
                  title="Investment Highlights"
                  description="Identify upside drivers linked to the company's business model and positioning."
                  icon={TrendingUp}
                  content={displayAnalysis.investment_highlights || ''}
                  colorVariant="green"
                />

                {/* Investment Risks */}
                <CompanyAnalysisSection
                  title="Investment Risks"
                  description="Identify risks inherent to the company's business model and value chain."
                  icon={AlertTriangle}
                  content={displayAnalysis.investment_risks || ''}
                  colorVariant="amber"
                />
              </div>

              {/* Diligence Priorities */}
              <CompanyAnalysisSection
                title="Diligence Priorities"
                description="Define the most critical unknowns to resolve before advancing investment (3-7 items)."
                icon={Search}
                content={displayAnalysis.diligence_priorities || ''}
                colorVariant="rose"
              />
            </div>
          </TabsContent>

          <TabsContent value="filters" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">L1 Screening Results</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between py-2 border-b">
                    <div>
                      <span className="font-medium">Vision Fit (≥25% revenue alignment)</span>
                      <p className="text-xs text-muted-foreground">Revenue from priority segments meets threshold</p>
                    </div>
                    {getL1StatusIcon(company.l1_vision_fit)}
                  </div>
                  <div className="flex items-center justify-between py-2 border-b">
                    <div>
                      <span className="font-medium">Priority Geography (≥50% revenue)</span>
                      <p className="text-xs text-muted-foreground">Revenue from target geographies</p>
                    </div>
                    {getL1StatusIcon(company.l1_priority_geo_flag)}
                  </div>
                  <div className="flex items-center justify-between py-2 border-b">
                    <div>
                      <span className="font-medium">EV Below Threshold (&lt;$1B)</span>
                      <p className="text-xs text-muted-foreground">Enterprise value within investment range</p>
                    </div>
                    {getL1StatusIcon(company.l1_ev_below_threshold)}
                  </div>
                  <div className="flex items-center justify-between py-2 border-b">
                    <div>
                      <span className="font-medium">Revenue Stability (No consecutive drops)</span>
                      <p className="text-xs text-muted-foreground">Revenue growth pattern check</p>
                    </div>
                    {getL1StatusIcon(company.l1_revenue_no_consecutive_drop_usd)}
                  </div>
                  <div className="flex items-center justify-between py-2">
                    <div>
                      <span className="font-medium">Overall L1 Result</span>
                      <p className="text-xs text-muted-foreground">Combined screening outcome</p>
                    </div>
                    {getL1StatusIcon(company.l1_screening_result)}
                  </div>
                  
                  {company.l1_rationale && (
                    <div className="mt-4 pt-4 border-t">
                      <p className="text-sm text-muted-foreground mb-2">Rationale</p>
                      <p className="text-sm">{company.l1_rationale}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="attachments" className="mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Notes Section */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Notes
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Textarea
                      placeholder="Add a note..."
                      value={newNote}
                      onChange={(e) => setNewNote(e.target.value)}
                      rows={3}
                    />
                    <Button onClick={addNote} disabled={isSubmitting || !newNote.trim()} size="sm">
                      {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
                      Add Note
                    </Button>
                  </div>
                  <div className="space-y-3 max-h-[300px] overflow-y-auto">
                    {notes.map((note) => (
                      <div key={note.id} className="p-3 bg-muted rounded-lg">
                        <div className="flex justify-between items-start gap-2">
                          <p className="text-sm whitespace-pre-wrap flex-1">{note.content}</p>
                          <Button variant="ghost" size="icon" onClick={() => deleteNote(note.id)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                        <p className="text-xs text-muted-foreground mt-2">
                          {note.created_at && formatDistanceToNow(new Date(note.created_at), { addSuffix: true })} · {note.stage}
                        </p>
                      </div>
                    ))}
                    {notes.length === 0 && <p className="text-muted-foreground text-sm">No notes yet</p>}
                  </div>
                </CardContent>
              </Card>

              {/* Links Section */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <LinkIcon className="h-4 w-4" />
                    Links
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Input
                      placeholder="https://..."
                      value={newLinkUrl}
                      onChange={(e) => setNewLinkUrl(e.target.value)}
                    />
                    <Input
                      placeholder="Title (optional)"
                      value={newLinkTitle}
                      onChange={(e) => setNewLinkTitle(e.target.value)}
                    />
                    <Button onClick={addLink} disabled={isSubmitting || !newLinkUrl.trim()} size="sm">
                      {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
                      Add Link
                    </Button>
                  </div>
                  <div className="space-y-2 max-h-[300px] overflow-y-auto">
                    {links.map((link) => (
                      <div key={link.id} className="flex items-center justify-between p-2 bg-muted rounded-lg">
                        <a
                          href={link.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 text-primary hover:underline text-sm truncate flex-1"
                        >
                          <ExternalLink className="h-4 w-4 shrink-0" />
                          {link.title || link.url}
                        </a>
                        <Button variant="ghost" size="icon" onClick={() => deleteLink(link.id)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    ))}
                    {links.length === 0 && <p className="text-muted-foreground text-sm">No links yet</p>}
                  </div>
                </CardContent>
              </Card>

              {/* Documents Section */}
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
                        <p className="text-sm text-muted-foreground">Click to upload a document</p>
                      </div>
                    </Label>
                    <input
                      id="file-upload"
                      type="file"
                      className="hidden"
                      onChange={handleFileUpload}
                      disabled={isSubmitting}
                    />
                  </div>
                  <div className="space-y-2 max-h-[300px] overflow-y-auto">
                    {documents.map((doc) => (
                      <div key={doc.id} className="flex items-center justify-between p-2 bg-muted rounded-lg">
                        <button
                          onClick={() => downloadDocument(doc)}
                          className="flex items-center gap-2 text-primary hover:underline text-sm truncate flex-1 text-left"
                        >
                          <FileText className="h-4 w-4 shrink-0" />
                          {doc.file_name}
                        </button>
                        <Button variant="ghost" size="icon" onClick={() => deleteDocument(doc)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    ))}
                    {documents.length === 0 && <p className="text-muted-foreground text-sm">No documents yet</p>}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
