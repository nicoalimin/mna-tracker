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
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
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
  CalendarIcon,
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
import FilePreview from '@/components/MeetingNotes/FilePreview';

interface MeetingNote {
  id: string;
  file_name: string;
  raw_notes: string | null;
  structured_notes: string | null;
  processing_status: 'pending' | 'processing' | 'completed' | 'failed';
  tags: string[];
  matched_companies: any[];
  signed_url?: string;
  file_date: string | null;
  created_at: string;
  updated_at: string;
}

export default function MinutesOfMeeting() {
  const [meetingNotes, setMeetingNotes] = useState<MeetingNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // File drop state
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [rawNotes, setRawNotes] = useState('');
  const [structuredNotes, setStructuredNotes] = useState('');
  const [uploadProgress, setUploadProgress] = useState<{ current: number; total: number } | null>(null);

  // Sorting and Filtering state
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState<keyof MeetingNote>('file_date');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [expandedTags, setExpandedTags] = useState<Record<string, boolean>>({});
  const [expandedCompanies, setExpandedCompanies] = useState<Record<string, boolean>>({});
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

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

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      setSelectedFiles(prev => [...prev, ...files]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      setSelectedFiles(prev => [...prev, ...Array.from(files)]);
    }
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0) {
      toast.error('Please select at least one file first');
      return;
    }

    // Check for duplicates
    const existingFileNames = new Set(meetingNotes.map(note => note.file_name));
    const duplicates = selectedFiles.filter(file => existingFileNames.has(file.name));
    const filesToUpload = selectedFiles.filter(file => !existingFileNames.has(file.name));

    if (filesToUpload.length === 0 && duplicates.length > 0) {
      toast.warning(
        duplicates.length === 1
          ? `File "${duplicates[0].name}" already exists and has been skipped.`
          : `${duplicates.length} files already exist and have been skipped.`
      );
      setSelectedFiles([]);
      return;
    }

    setUploading(true);
    setUploadProgress({ current: 0, total: filesToUpload.length });

    const results = {
      success: 0,
      failed: 0,
    };

    for (let i = 0; i < filesToUpload.length; i++) {
      const file = filesToUpload[i];
      setUploadProgress({ current: i + 1, total: filesToUpload.length });

      try {
        // 1. Get pre-signed URL
        const fileName = file.name;
        const contentType = file.type || 'application/octet-stream';

        const urlParams = new URLSearchParams({
          fileName,
          contentType,
        });

        const presignedResponse = await fetch(`/api/meeting-notes/upload-url?${urlParams.toString()}`);
        const presignedResult = await presignedResponse.json();

        if (!presignedResult.success) {
          throw new Error(presignedResult.error || 'Failed to get upload URL');
        }

        const { uploadUrl, key } = presignedResult.data;

        // 2. Upload directly to S3
        const s3Response = await fetch(uploadUrl, {
          method: 'PUT',
          body: file,
          headers: {
            'Content-Type': contentType,
          },
        });

        if (!s3Response.ok) {
          throw new Error('Failed to upload file to S3');
        }

        // 3. Notify server of completion
        const notifyResponse = await fetch('/api/meeting-notes', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            key,
            fileName,
            contentType,
          }),
        });

        const notifyResult = await notifyResponse.json();

        if (notifyResult.success) {
          results.success++;
        } else {
          console.error(`Processing failed for ${file.name}:`, notifyResult.error);
          results.failed++;
        }
      } catch (error) {
        console.error(`Upload error for ${file.name}:`, error);
        results.failed++;
      }
    }

    if (results.success > 0) {
      toast.success(
        filesToUpload.length === 1
          ? 'Meeting note uploaded successfully'
          : `Successfully uploaded ${results.success} of ${filesToUpload.length} files`
      );

      if (duplicates.length > 0) {
        toast.warning(`${duplicates.length} duplicate ${duplicates.length === 1 ? 'file was' : 'files were'} skipped.`);
      }

      if (results.failed > 0) {
        toast.error(`Failed to upload ${results.failed} files`);
      }
      setSelectedFiles([]);
      setRawNotes('');
      fetchMeetingNotes();
    } else {
      if (duplicates.length > 0) {
        toast.warning(`${duplicates.length} duplicate ${duplicates.length === 1 ? 'file was' : 'files were'} skipped.`);
      }
      if (results.failed > 0) {
        toast.error('Failed to upload meeting notes');
      }
    }

    setUploading(false);
    setUploadProgress(null);
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

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const clearSelectedFiles = () => {
    setSelectedFiles([]);
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

  const handleUpdateDate = async (id: string, date: Date | undefined) => {
    if (!date) return;

    try {
      const response = await fetch('/api/meeting-notes', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id,
          file_date: format(date, 'yyyy-MM-dd'),
        }),
      });

      if (!response.ok) throw new Error('Failed to update date');

      setMeetingNotes(prev =>
        prev.map(note =>
          note.id === id ? { ...note, file_date: format(date, 'yyyy-MM-dd') } : note
        )
      );

      toast.success("Meeting date updated successfully");
    } catch (error) {
      console.error('Error updating meeting date:', error);
      toast.error("Failed to update meeting date");
    }
  };

  const handleDownload = async (noteId: string, fileName: string) => {
    setDownloadingId(noteId);
    try {
      const response = await fetch(`/api/meeting-notes/${noteId}/download`);
      if (!response.ok) throw new Error('Failed to generate download URL');

      const { download_url } = await response.json();
      if (!download_url) throw new Error('Download URL not provided');

      // Trigger download
      const link = document.createElement('a');
      link.href = download_url;
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Download error:', error);
      toast.error("Failed to download file. Please try again.");
    } finally {
      setDownloadingId(null);
    }
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
                ${selectedFiles.length > 0 ? 'bg-muted/50' : ''}
              `}
            >
              <div className="space-y-2">
                <FileUp className="h-10 w-10 mx-auto text-muted-foreground" />
                <p className="text-muted-foreground">
                  Drag and drop files here, or{' '}
                  <label className="text-primary cursor-pointer hover:underline">
                    browse
                    <Input
                      type="file"
                      className="hidden"
                      onChange={handleFileSelect}
                      accept=".pdf,.doc,.docx,.txt,.md"
                      multiple
                    />
                  </label>
                </p>
                <p className="text-xs text-muted-foreground">
                  Supports PPTX, PDF, DOC, DOCX, TXT, MD
                </p>
              </div>
            </div>

            {/* Selected Files List */}
            {selectedFiles.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-medium">Selected Files ({selectedFiles.length})</h3>
                  <Button variant="ghost" size="sm" onClick={clearSelectedFiles} className="text-xs h-7">
                    Clear all
                  </Button>
                </div>
                <div className="grid gap-2 max-h-[300px] overflow-y-auto pr-2">
                  {selectedFiles.map((file, index) => {
                    const isDuplicate = meetingNotes.some(note => note.file_name === file.name);
                    return (
                      <div key={`${file.name}-${index}`} className={cn(
                        "flex items-center justify-between p-2 rounded-md border transition-colors",
                        isDuplicate ? "bg-orange-500/5 border-orange-200" : "bg-muted/40 border-muted"
                      )}>
                        <div className="flex items-center gap-3 overflow-hidden">
                          <FileText className={cn("h-4 w-4 shrink-0", isDuplicate ? "text-orange-500" : "text-primary")} />
                          <div className="overflow-hidden">
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-medium truncate">{file.name}</p>
                              {isDuplicate && (
                                <Badge variant="outline" className="text-[10px] h-4 py-0 px-1 text-orange-600 bg-orange-500/5 border-orange-200">
                                  Duplicate
                                </Badge>
                              )}
                            </div>
                            <p className="text-[10px] text-muted-foreground">
                              {(file.size / 1024).toFixed(1)} KB
                            </p>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeFile(index)}
                          className="h-7 w-7 shrink-0"
                          disabled={uploading}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Notes Fields (Only for single file) */}
            {selectedFiles.length === 1 && (
              <div className="grid md:grid-cols-2 gap-4 pt-2">
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

            {/* Upload Button & Progress */}
            {selectedFiles.length > 0 && (
              <div className="flex flex-col gap-4 pt-2">
                {uploading && uploadProgress && (
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">
                        Processing {uploadProgress.current} of {uploadProgress.total}...
                      </span>
                      <span className="font-medium">
                        {Math.round((uploadProgress.current / uploadProgress.total) * 100)}%
                      </span>
                    </div>
                    <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary transition-all duration-300"
                        style={{ width: `${(uploadProgress.current / uploadProgress.total) * 100}%` }}
                      />
                    </div>
                  </div>
                )}

                <div className="flex justify-end">
                  <Button onClick={handleUpload} disabled={uploading}>
                    {uploading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        {selectedFiles.length > 1
                          ? `Uploading Queue (${uploadProgress?.current}/${uploadProgress?.total})`
                          : 'Uploading...'
                        }
                      </>
                    ) : (
                      <>
                        <Upload className="h-4 w-4 mr-2" />
                        {selectedFiles.length > 1
                          ? `Upload ${selectedFiles.length} Meeting Notes`
                          : 'Upload Meeting Note'
                        }
                      </>
                    )}
                  </Button>
                </div>
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
                        className="cursor-pointer hover:text-primary transition-colors text-right"
                        onClick={() => handleSort('file_date')}
                      >
                        <div className="flex items-center justify-end">
                          Meeting Date & Actions
                          <SortIcon field="file_date" />
                        </div>
                      </TableHead>
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
                        <TableCell className="text-right">
                          <div className="flex flex-col items-end gap-2">
                            <Popover>
                              <PopoverTrigger asChild>
                                <Button
                                  variant="ghost"
                                  className={cn(
                                    "h-8 w-auto justify-end text-right font-normal px-2",
                                    !note.file_date && "text-muted-foreground"
                                  )}
                                >
                                  <CalendarIcon className="mr-2 h-3 w-3" />
                                  {note.file_date ? format(new Date(note.file_date), 'PPP') : (
                                    <span className="text-xs italic text-muted-foreground">Set meeting date</span>
                                  )}
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent className="w-auto p-0" align="end">
                                <Calendar
                                  mode="single"
                                  selected={note.file_date ? new Date(note.file_date) : undefined}
                                  onSelect={(date) => handleUpdateDate(note.id, date)}
                                  initialFocus
                                />
                              </PopoverContent>
                            </Popover>

                            <div className="flex items-center justify-end gap-1">
                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    title="View details"
                                    className="h-8 w-8"
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
                                        File Preview
                                      </h3>
                                      {note.signed_url ? (
                                        <FilePreview
                                          url={note.signed_url}
                                          onDownload={() => handleDownload(note.id, note.file_name)}
                                          fileName={note.file_name}
                                        />
                                      ) : (
                                        <div className="flex h-[400px] w-full items-center justify-center bg-muted/30 rounded-md border text-muted-foreground">
                                          Preview not available (Link missing)
                                        </div>
                                      )}
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
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDownload(note.id, note.file_name)}
                                disabled={downloadingId === note.id}
                                title="Download file"
                                className="h-8 w-8"
                              >
                                {downloadingId === note.id ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <Download className="h-4 w-4" />
                                )}
                              </Button>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="text-destructive hover:text-destructive h-8 w-8"
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
    </DashboardLayout >
  );
}
