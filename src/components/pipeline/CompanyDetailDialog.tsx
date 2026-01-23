'use client';

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
import {
  Building2,
  TrendingUp,
  DollarSign,
  BarChart3,
  Globe,
  FileText,
} from 'lucide-react';
import { format } from 'date-fns';
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

interface CompanyData {
  id: string;
  target: string | null;
  segment: string | null;
  watchlist_status: string | null;
  revenue_2021_usd_mn: number | null;
  revenue_2022_usd_mn: number | null;
  revenue_2023_usd_mn: number | null;
  revenue_2024_usd_mn: number | null;
  ebitda_2021_usd_mn: number | null;
  ebitda_2022_usd_mn: number | null;
  ebitda_2023_usd_mn: number | null;
  ebitda_2024_usd_mn: number | null;
  ev_2024: number | null;
  l1_screening_result: string | null;
  created_at: string;
  updated_at: string;
  // Optional additional fields from the full schema
  website?: string | null;
  geography?: string | null;
  ownership?: string | null;
  company_focus?: string | null;
  comments?: string | null;
  ebitda_margin_2021?: number | null;
  ebitda_margin_2022?: number | null;
  ebitda_margin_2023?: number | null;
  ebitda_margin_2024?: number | null;
  revenue_cagr_2021_2022?: number | null;
  revenue_cagr_2022_2023?: number | null;
  revenue_cagr_2023_2024?: number | null;
  ev_ebitda_2024?: number | null;
}

interface CompanyDetailDialogProps {
  company: CompanyData;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdate: () => void;
}

// Values are in USD Millions
const formatCurrency = (value: number | null) => {
  if (value === null || value === undefined) return '-';
  if (value >= 1000) return `$${(value / 1000).toFixed(2)}B`;
  return `$${value.toFixed(2)}M`;
};

const formatPercent = (value: number | null) => {
  if (value === null || value === undefined) return '-';
  return `${(value * 100).toFixed(1)}%`;
};

export default function CompanyDetailDialog({
  company,
  open,
  onOpenChange,
  onUpdate,
}: CompanyDetailDialogProps) {
  // Prepare chart data
  const revenueData = [
    { year: '2021', Revenue: company.revenue_2021_usd_mn || 0 },
    { year: '2022', Revenue: company.revenue_2022_usd_mn || 0 },
    { year: '2023', Revenue: company.revenue_2023_usd_mn || 0 },
    { year: '2024', Revenue: company.revenue_2024_usd_mn || 0 },
  ];

  const ebitdaData = [
    { year: '2021', EBITDA: company.ebitda_2021_usd_mn || 0 },
    { year: '2022', EBITDA: company.ebitda_2022_usd_mn || 0 },
    { year: '2023', EBITDA: company.ebitda_2023_usd_mn || 0 },
    { year: '2024', EBITDA: company.ebitda_2024_usd_mn || 0 },
  ];

  const statusColors: Record<string, string> = {
    pass: 'bg-green-500',
    fail: 'bg-red-500',
    pending: 'bg-yellow-500',
  };

  const getStatusColor = (status: string | null): string => {
    if (!status) return 'bg-gray-500';
    const lower = status.toLowerCase();
    return statusColors[lower] || 'bg-gray-500';
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-2xl flex items-center gap-2">
                <Building2 className="h-6 w-6" />
                {company.target || 'Unknown Company'}
              </DialogTitle>
              <DialogDescription className="flex items-center gap-2 mt-1">
                {company.segment && (
                  <Badge variant="outline">{company.segment}</Badge>
                )}
                {company.l1_screening_result && (
                  <Badge className={`${getStatusColor(company.l1_screening_result)} text-white`}>
                    {company.l1_screening_result}
                  </Badge>
                )}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <Tabs defaultValue="overview" className="mt-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="financials">Financials</TabsTrigger>
            <TabsTrigger value="details">Details</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Revenue 2024
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {formatCurrency(company.revenue_2024_usd_mn)}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    EBITDA 2024
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {formatCurrency(company.ebitda_2024_usd_mn)}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    EV 2024
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {formatCurrency(company.ev_2024)}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    EV/EBITDA 2024
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {company.ev_ebitda_2024 ? `${company.ev_ebitda_2024.toFixed(1)}x` : '-'}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Revenue Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Revenue Trend (USD Mn)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={revenueData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="year" />
                      <YAxis />
                      <Tooltip formatter={(value) => `$${value}M`} />
                      <Bar dataKey="Revenue" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Financials Tab */}
          <TabsContent value="financials" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  Revenue (USD Mn)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-4 gap-4">
                  <div>
                    <div className="text-sm text-muted-foreground">2021</div>
                    <div className="text-lg font-semibold">{formatCurrency(company.revenue_2021_usd_mn)}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">2022</div>
                    <div className="text-lg font-semibold">{formatCurrency(company.revenue_2022_usd_mn)}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">2023</div>
                    <div className="text-lg font-semibold">{formatCurrency(company.revenue_2023_usd_mn)}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">2024</div>
                    <div className="text-lg font-semibold">{formatCurrency(company.revenue_2024_usd_mn)}</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  EBITDA (USD Mn)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-4 gap-4">
                  <div>
                    <div className="text-sm text-muted-foreground">2021</div>
                    <div className="text-lg font-semibold">{formatCurrency(company.ebitda_2021_usd_mn)}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">2022</div>
                    <div className="text-lg font-semibold">{formatCurrency(company.ebitda_2022_usd_mn)}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">2023</div>
                    <div className="text-lg font-semibold">{formatCurrency(company.ebitda_2023_usd_mn)}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">2024</div>
                    <div className="text-lg font-semibold">{formatCurrency(company.ebitda_2024_usd_mn)}</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* EBITDA Chart */}
            <Card>
              <CardHeader>
                <CardTitle>EBITDA Trend</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={ebitdaData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="year" />
                      <YAxis />
                      <Tooltip formatter={(value) => `$${value}M`} />
                      <Bar dataKey="EBITDA" fill="hsl(var(--chart-2))" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* EBITDA Margins */}
            {(company.ebitda_margin_2021 || company.ebitda_margin_2024) && (
              <Card>
                <CardHeader>
                  <CardTitle>EBITDA Margin</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-4 gap-4">
                    <div>
                      <div className="text-sm text-muted-foreground">2021</div>
                      <div className="text-lg font-semibold">{formatPercent(company.ebitda_margin_2021)}</div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">2022</div>
                      <div className="text-lg font-semibold">{formatPercent(company.ebitda_margin_2022)}</div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">2023</div>
                      <div className="text-lg font-semibold">{formatPercent(company.ebitda_margin_2023)}</div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">2024</div>
                      <div className="text-lg font-semibold">{formatPercent(company.ebitda_margin_2024)}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Details Tab */}
          <TabsContent value="details" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Company Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  {company.geography && (
                    <div>
                      <div className="text-sm text-muted-foreground">Geography</div>
                      <div className="font-medium flex items-center gap-1">
                        <Globe className="h-4 w-4" />
                        {company.geography}
                      </div>
                    </div>
                  )}
                  {company.ownership && (
                    <div>
                      <div className="text-sm text-muted-foreground">Ownership</div>
                      <div className="font-medium">{company.ownership}</div>
                    </div>
                  )}
                  {company.website && (
                    <div>
                      <div className="text-sm text-muted-foreground">Website</div>
                      <a 
                        href={company.website} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="font-medium text-primary hover:underline"
                      >
                        {company.website}
                      </a>
                    </div>
                  )}
                  {company.watchlist_status && (
                    <div>
                      <div className="text-sm text-muted-foreground">Watchlist Status</div>
                      <Badge variant="outline">{company.watchlist_status}</Badge>
                    </div>
                  )}
                </div>

                {company.company_focus && (
                  <div>
                    <div className="text-sm text-muted-foreground mb-1">Company Focus</div>
                    <div className="text-sm">{company.company_focus}</div>
                  </div>
                )}

                {company.comments && (
                  <div>
                    <div className="text-sm text-muted-foreground mb-1">Comments</div>
                    <div className="text-sm whitespace-pre-wrap">{company.comments}</div>
                  </div>
                )}

                <div className="pt-4 border-t">
                  <div className="grid grid-cols-2 gap-4 text-sm text-muted-foreground">
                    <div>
                      <span>Created: </span>
                      <span>{format(new Date(company.created_at), 'PPP')}</span>
                    </div>
                    <div>
                      <span>Updated: </span>
                      <span>{format(new Date(company.updated_at), 'PPP')}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
