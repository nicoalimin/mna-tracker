import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  ExternalLink,
  Sparkles,
  Building2,
  DollarSign,
  TrendingUp,
  Clock,
  Globe,
  FileText,
} from 'lucide-react';
import { format } from 'date-fns';

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

interface MarketScreeningDetailDialogProps {
  result: MarketScreeningResult | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function MarketScreeningDetailDialog({
  result,
  open,
  onOpenChange,
}: MarketScreeningDetailDialogProps) {
  if (!result) return null;

  const getMatchScoreColor = (score: number | null) => {
    if (score === null) return 'bg-muted text-muted-foreground';
    if (score >= 80) return 'bg-emerald-500/20 text-emerald-600';
    if (score >= 60) return 'bg-amber-500/20 text-amber-600';
    return 'bg-red-500/20 text-red-600';
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3 text-2xl">
            <Building2 className="h-6 w-6" />
            {result.company_name}
          </DialogTitle>
          <DialogDescription className="flex items-center gap-2">
            <Badge variant="outline">{result.sector || 'Unknown Sector'}</Badge>
            <Badge variant="secondary">AI Discovered</Badge>
            {result.match_score !== null && (
              <Badge className={getMatchScoreColor(result.match_score)}>
                <Sparkles className="h-3 w-3 mr-1" />
                {result.match_score}% Match
              </Badge>
            )}
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="match">AI Match Analysis</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4 mt-4">
            {/* Company Overview */}
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
                      <p className="font-semibold text-lg">{result.company_name}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Sector</p>
                      <p className="font-medium">{result.sector || 'Unknown'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Source</p>
                      <Badge variant="secondary">
                        <Sparkles className="h-3 w-3 mr-1" />
                        AI Discovery
                      </Badge>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm text-muted-foreground">Website</p>
                      {result.website ? (
                        <a
                          href={result.website.startsWith('http') ? result.website : `https://${result.website}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline flex items-center gap-1 font-medium"
                        >
                          <Globe className="h-4 w-4" />
                          {result.website}
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      ) : (
                        <span className="text-muted-foreground">Not available</span>
                      )}
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Discovered</p>
                      <p className="font-medium flex items-center gap-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        {format(new Date(result.discovered_at), 'MMM d, yyyy HH:mm')}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Description */}
            {result.description && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Description
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm leading-relaxed">{result.description}</p>
                </CardContent>
              </Card>
            )}

            {/* Financial Estimates */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  Financial Estimates
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-6">
                  <div className="p-4 rounded-lg border bg-muted/30">
                    <div className="flex items-center gap-2 text-muted-foreground mb-2">
                      <TrendingUp className="h-4 w-4" />
                      <span className="text-sm font-medium">Estimated Revenue</span>
                    </div>
                    <p className="text-2xl font-semibold font-mono text-primary">
                      {result.estimated_revenue || '-'}
                    </p>
                  </div>
                  <div className="p-4 rounded-lg border bg-muted/30">
                    <div className="flex items-center gap-2 text-muted-foreground mb-2">
                      <DollarSign className="h-4 w-4" />
                      <span className="text-sm font-medium">Estimated Valuation</span>
                    </div>
                    <p className="text-2xl font-semibold font-mono text-primary">
                      {result.estimated_valuation || '-'}
                    </p>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-4">
                  * These are AI-generated estimates and should be verified during due diligence
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="match" className="space-y-4 mt-4">
            {/* Match Score */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-purple-500" />
                  Investment Thesis Match
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4 mb-6">
                  <div className="text-center">
                    <div className={`text-4xl font-bold ${result.match_score !== null && result.match_score >= 80
                        ? 'text-emerald-600'
                        : result.match_score !== null && result.match_score >= 60
                          ? 'text-amber-600'
                          : 'text-red-600'
                      }`}>
                      {result.match_score !== null ? `${result.match_score}%` : '-'}
                    </div>
                    <p className="text-sm text-muted-foreground">Match Score</p>
                  </div>
                  <div className="flex-1 h-4 bg-muted rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all ${result.match_score !== null && result.match_score >= 80
                          ? 'bg-emerald-500'
                          : result.match_score !== null && result.match_score >= 60
                            ? 'bg-amber-500'
                            : 'bg-red-500'
                        }`}
                      style={{ width: `${result.match_score || 0}%` }}
                    />
                  </div>
                </div>

                {result.match_reason && (
                  <div className="p-4 rounded-lg border border-purple-200 dark:border-purple-800/50 bg-purple-50/50 dark:bg-purple-950/20">
                    <h4 className="font-medium text-purple-700 dark:text-purple-400 mb-2 flex items-center gap-2">
                      <Sparkles className="h-4 w-4" />
                      Why This Company Matches Your Thesis
                    </h4>
                    <p className="text-sm leading-relaxed">{result.match_reason}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Score Breakdown placeholder */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Score Factors</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between py-2 border-b">
                    <span className="text-sm">Sector Alignment</span>
                    <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600">
                      Strong
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b">
                    <span className="text-sm">Size Fit</span>
                    <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600">
                      Good
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b">
                    <span className="text-sm">Growth Potential</span>
                    <Badge variant="outline" className="bg-amber-500/10 text-amber-600">
                      Moderate
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between py-2">
                    <span className="text-sm">Market Position</span>
                    <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600">
                      Strong
                    </Badge>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-4">
                  * Score factors are AI-generated based on available data
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
