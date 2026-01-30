'use client';

import { useEffect, useState, useCallback } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  FileText,
  Upload,
  Loader2,
  Trash2,
  Download,
  FileUp,
  X,
  CheckCircle2,
  AlertCircle,
  Tag,
  Building,
  Eye,
  Bot,
  Search,
  ChevronUp,
  ChevronDown,
  ChevronsUpDown,
} from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';

interface MeetingNote {
  id: string;
  file_name: string;
  file_link: string;
  raw_notes: string | null;
  structured_notes: string | null;
  tags: string[] | null;
  processing_status: 'pending' | 'processing' | 'completed' | 'failed';
  matched_companies: any[] | null;
  created_at: string;
  updated_at: string;
  signed_url: string | null;
}

export default function MinutesOfMeeting() {
  const [meetingNotes, setMeetingNotes] = useState<MeetingNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // File drop state
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [rawNotes, setRawNotes] = useState('');
  const [structuredNotes, setStructuredNotes] = useState('');

  // Sorting and Filtering state
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState<keyof MeetingNote>('created_at');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [expandedTags, setExpandedTags] = useState<Record<string, boolean>>({});
  const [expandedCompanies, setExpandedCompanies] = useState<Record<string, boolean>>({});

  const fetchMeetingNotes = useCallback(async () => {
    try {
      const response = await fetch('/api/meeting-notes');
      const result = await response.json();

      if (result.success) {
        setMeetingNotes(result.data);
      } else {
        toast.error('Failed to load meeting notes');
      }
    } catch (error) {
      console.error('Error fetching meeting notes:', error);
      toast.error('Failed to load meeting notes');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMeetingNotes();
  }, [fetchMeetingNotes]);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      setSelectedFile(files[0]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      setSelectedFile(files[0]);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      toast.error('Please select a file first');
      return;
    }

    setUploading(true);

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      if (rawNotes) formData.append('raw_notes', rawNotes);
      if (structuredNotes) formData.append('structured_notes', structuredNotes);

      const response = await fetch('/api/meeting-notes', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (result.success) {
        toast.success('Meeting note uploaded successfully');
        setSelectedFile(null);
        setRawNotes('');
        setStructuredNotes('');
        fetchMeetingNotes();
      } else {
        toast.error(result.error || 'Failed to upload meeting note');
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload meeting note');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);

    try {
      const response = await fetch(`/api/meeting-notes/${id}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (result.success) {
        toast.success('Meeting note deleted successfully');
        fetchMeetingNotes();
      } else {
        toast.error(result.error || 'Failed to delete meeting note');
      }
    } catch (error) {
      console.error('Delete error:', error);
      toast.error('Failed to delete meeting note');
    } finally {
      setDeletingId(null);
    }
  };

  const clearSelectedFile = () => {
    setSelectedFile(null);
    setRawNotes('');
    setStructuredNotes('');
  };

  const handleSort = (field: keyof MeetingNote) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const toggleTags = (id: string) => {
    setExpandedTags(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const toggleCompanies = (id: string) => {
    setExpandedCompanies(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const filteredAndSortedNotes = meetingNotes
    .filter((note) => {
      const searchLower = searchQuery.toLowerCase();
      const fileNameMatch = note.file_name.toLowerCase().includes(searchLower);
      const tagsMatch = note.tags?.some(tag => tag.toLowerCase().includes(searchLower));
      const companiesMatch = note.matched_companies?.some(company =>
        company.name.toLowerCase().includes(searchLower)
      );
      return fileNameMatch || tagsMatch || companiesMatch;
    })
    .sort((a, b) => {
      const aValue = a[sortField];
      const bValue = b[sortField];

      if (aValue === bValue) return 0;
      if (aValue === null || aValue === undefined) return 1;
      if (bValue === null || bValue === undefined) return -1;

      let comparison = 0;
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        comparison = aValue.localeCompare(bValue);
      } else if (Array.isArray(aValue) && Array.isArray(bValue)) {
        comparison = aValue.length - bValue.length;
      } else {
        comparison = aValue < bValue ? -1 : 1;
      }

      return sortDirection === 'asc' ? comparison : -comparison;
    });

  const SortIcon = ({ field }: { field: keyof MeetingNote }) => {
    if (sortField !== field) return <ChevronsUpDown className="h-3 w-3 ml-1 opacity-50" />;
    return sortDirection === 'asc' ?
      <ChevronUp className="h-3 w-3 ml-1 text-primary" /> :
      <ChevronDown className="h-3 w-3 ml-1 text-primary" />;
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
            <h1 className="text-3xl font-bold tracking-tight">Minutes of Meeting</h1>
            <p className="text-muted-foreground">Upload and manage meeting notes</p>
          </div>
        </div>

        {/* Upload Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Upload Meeting Notes
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Drop Zone */}
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`
                border-2 border-dashed rounded-lg p-8 text-center transition-colors
                ${isDragging
                  ? 'border-primary bg-primary/5'
                  : 'border-muted-foreground/25 hover:border-primary/50'}
                ${selectedFile ? 'bg-muted/50' : ''}
              `}
            >
              {selectedFile ? (
                <div className="flex items-center justify-center gap-4">
                  <FileText className="h-10 w-10 text-primary" />
                  <div className="text-left">
                    <p className="font-medium">{selectedFile.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {(selectedFile.size / 1024).toFixed(1)} KB
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={clearSelectedFile}
                    className="ml-2"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  <FileUp className="h-10 w-10 mx-auto text-muted-foreground" />
                  <p className="text-muted-foreground">
                    Drag and drop your file here, or{' '}
                    <label className="text-primary cursor-pointer hover:underline">
                      browse
                      <Input
                        type="file"
                        className="hidden"
                        onChange={handleFileSelect}
                        accept=".pdf,.doc,.docx,.txt,.md"
                      />
                    </label>
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Supports PDF, DOC, DOCX, TXT, MD
                  </p>
                </div>
              )}
            </div>

            {/* Notes Fields */}
            {selectedFile && (
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Raw Notes (Optional)</label>
                  <Textarea
                    placeholder="Paste raw notes from the meeting..."
                    value={rawNotes}
                    onChange={(e) => setRawNotes(e.target.value)}
                    rows={4}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Structured Notes (Optional)</label>
                  <Textarea
                    placeholder="Add structured/formatted notes..."
                    value={structuredNotes}
                    onChange={(e) => setStructuredNotes(e.target.value)}
                    rows={4}
                  />
                </div>
              </div>
            )}

            {/* Upload Button */}
            {selectedFile && (
              <div className="flex justify-end">
                <Button onClick={handleUpload} disabled={uploading}>
                  {uploading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4 mr-2" />
                      Upload Meeting Note
                    </>
                  )}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Meeting Notes List */}
        <Card>
          <CardHeader>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Meeting Notes ({filteredAndSortedNotes.length})
              </CardTitle>
              <div className="relative w-full md:w-64">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search notes, tags, companies..."
                  className="pl-9"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {meetingNotes.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <FileText className="mx-auto h-12 w-12 mb-4 opacity-50" />
                <p>No meeting notes uploaded yet.</p>
                <p className="text-sm">Upload your first meeting note using the form above.</p>
              </div>
            ) : filteredAndSortedNotes.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Search className="mx-auto h-12 w-12 mb-4 opacity-50" />
                <p>No results found for &quot;{searchQuery}&quot;</p>
                <Button variant="link" onClick={() => setSearchQuery('')}>Clear search</Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead
                        className="cursor-pointer hover:text-primary transition-colors"
                        onClick={() => handleSort('file_name')}
                      >
                        <div className="flex items-center">
                          File Name
                          <SortIcon field="file_name" />
                        </div>
                      </TableHead>
                      <TableHead
                        className="cursor-pointer hover:text-primary transition-colors"
                        onClick={() => handleSort('processing_status')}
                      >
                        <div className="flex items-center">
                          Status
                          <SortIcon field="processing_status" />
                        </div>
                      </TableHead>
                      <TableHead>Tags</TableHead>
                      <TableHead>Matched Companies</TableHead>
                      <TableHead
                        className="cursor-pointer hover:text-primary transition-colors"
                        onClick={() => handleSort('created_at')}
                      >
                        <div className="flex items-center">
                          Uploaded
                          <SortIcon field="created_at" />
                        </div>
                      </TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredAndSortedNotes.map((note) => (
                      <TableRow key={note.id}>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4 text-muted-foreground" />
                            {note.file_name}
                          </div>
                        </TableCell>
                        <TableCell>
                          {note.processing_status === 'processing' && (
                            <Badge variant="outline" className="flex items-center gap-1 text-blue-500 bg-blue-500/5 border-blue-200">
                              <Loader2 className="h-3 w-3 animate-spin" />
                              Processing
                            </Badge>
                          )}
                          {note.processing_status === 'completed' && (
                            <Badge variant="outline" className="flex items-center gap-1 text-green-600 bg-green-500/5 border-green-200">
                              <CheckCircle2 className="h-3 w-3" />
                              Completed
                            </Badge>
                          )}
                          {note.processing_status === 'failed' && (
                            <Badge variant="outline" className="flex items-center gap-1 text-red-600 bg-red-500/5 border-red-200">
                              <AlertCircle className="h-3 w-3" />
                              Failed
                            </Badge>
                          )}
                          {note.processing_status === 'pending' && (
                            <Badge variant="outline" className="flex items-center gap-1 text-gray-500 bg-gray-500/5 border-gray-200">
                              Pending
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="max-w-[200px]">
                          <div className="flex flex-wrap gap-1">
                            {note.tags && note.tags.length > 0 ? (
                              <>
                                {(expandedTags[note.id] ? note.tags : note.tags.slice(0, 3)).map((tag, i) => (
                                  <Badge key={i} variant="secondary" className="text-[10px] py-0 px-1.5 flex items-center gap-1">
                                    <Tag className="h-2.5 w-2.5" />
                                    {tag}
                                  </Badge>
                                ))}
                                {note.tags.length > 3 && (
                                  <Badge
                                    variant="outline"
                                    className="text-[10px] py-0 px-1.5 cursor-pointer hover:bg-muted"
                                    onClick={() => toggleTags(note.id)}
                                  >
                                    {expandedTags[note.id] ? 'Show less' : `+${note.tags.length - 3} more`}
                                  </Badge>
                                )}
                              </>
                            ) : (
                              <span className="text-muted-foreground text-xs">-</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-1">
                            {note.matched_companies && note.matched_companies.length > 0 ? (
                              <>
                                {(expandedCompanies[note.id] ? note.matched_companies : note.matched_companies.slice(0, 2)).map((company, i) => (
                                  <div key={i} className="flex items-center gap-1 text-xs text-muted-foreground">
                                    <Building className="h-3 w-3" />
                                    <span className="truncate max-w-[150px]">{company.name}</span>
                                  </div>
                                ))}
                                {note.matched_companies.length > 2 && (
                                  <button
                                    className="text-[10px] text-primary hover:underline text-left"
                                    onClick={() => toggleCompanies(note.id)}
                                  >
                                    {expandedCompanies[note.id] ? 'Show less' : `+${note.matched_companies.length - 2} more`}
                                  </button>
                                )}
                              </>
                            ) : (
                              <span className="text-muted-foreground text-xs">-</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {new Date(note.created_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  title="View details"
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="max-w-3xl max-h-[80vh]">
                                <DialogHeader>
                                  <DialogTitle>{note.file_name} - Details</DialogTitle>
                                </DialogHeader>
                                <div className="grid md:grid-cols-2 gap-6 mt-4 overflow-hidden">
                                  <div className="flex flex-col gap-2">
                                    <h3 className="text-sm font-semibold flex items-center gap-2">
                                      <FileText className="h-4 w-4" />
                                      Raw Extracted Text
                                    </h3>
                                    <ScrollArea className="h-[400px] w-full rounded-md border p-4 bg-muted/30">
                                      <pre className="text-xs whitespace-pre-wrap font-sans">
                                        {note.raw_notes || "No raw text extracted."}
                                      </pre>
                                    </ScrollArea>
                                  </div>
                                  <div className="flex flex-col gap-2">
                                    <h3 className="text-sm font-semibold flex items-center gap-2">
                                      <Bot className="h-4 w-4" />
                                      AI Structured Notes
                                    </h3>
                                    <ScrollArea className="h-[400px] w-full rounded-md border p-4 bg-muted/30">
                                      {note.structured_notes ? (
                                        <div className="space-y-4 text-sm">
                                          {(() => {
                                            try {
                                              const structured = JSON.parse(note.structured_notes);
                                              return (
                                                <>
                                                  <div>
                                                    <h4 className="font-medium text-primary mb-1">Summary</h4>
                                                    <p>{structured.summary}</p>
                                                  </div>
                                                  <div>
                                                    <h4 className="font-medium text-primary mb-1">Key Points</h4>
                                                    <ul className="list-disc pl-4 space-y-1">
                                                      {structured.key_points?.map((p: string, i: number) => <li key={i}>{p}</li>)}
                                                    </ul>
                                                  </div>
                                                  <div>
                                                    <h4 className="font-medium text-primary mb-1">Action Items</h4>
                                                    <ul className="list-disc pl-4 space-y-1">
                                                      {structured.action_items?.map((p: string, i: number) => <li key={i}>{p}</li>)}
                                                    </ul>
                                                  </div>
                                                </>
                                              );
                                            } catch (e) {
                                              return <pre className="text-xs whitespace-pre-wrap">{note.structured_notes}</pre>;
                                            }
                                          })()}
                                        </div>
                                      ) : (
                                        <p className="text-sm text-muted-foreground italic p-4">
                                          Processing not complete or structure extraction failed.
                                        </p>
                                      )}
                                    </ScrollArea>
                                  </div>
                                </div>
                              </DialogContent>
                            </Dialog>
                            {note.signed_url && (
                              <Button
                                variant="ghost"
                                size="icon"
                                asChild
                              >
                                <a
                                  href={note.signed_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  title="Download file"
                                >
                                  <Download className="h-4 w-4" />
                                </a>
                              </Button>
                            )}
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="text-destructive hover:text-destructive"
                                  disabled={deletingId === note.id}
                                >
                                  {deletingId === note.id ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : (
                                    <Trash2 className="h-4 w-4" />
                                  )}
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Delete Meeting Note</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to delete &quot;{note.file_name}&quot;?
                                    This will remove both the file from storage and the database record.
                                    This action cannot be undone.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleDelete(note.id)}
                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                  >
                                    Delete
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
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
    </DashboardLayout>
  );
}
