'use client';

import { useState, useEffect } from 'react';
import mammoth from 'mammoth';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Loader2, FileText, AlertCircle, Download } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';

interface FilePreviewProps {
  url: string;
  fileName: string;
}

export default function FilePreview({ url, fileName }: FilePreviewProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [content, setContent] = useState<string | null>(null);
  const [fileType, setFileType] = useState<string>('');

  useEffect(() => {
    const detectFileType = () => {
      const extension = fileName.split('.').pop()?.toLowerCase();
      if (extension === 'pdf') return 'pdf';
      if (extension === 'docx' || extension === 'doc') return 'docx';
      if (extension === 'txt') return 'text';
      if (extension === 'md') return 'markdown';
      return 'unknown';
    };

    const type = detectFileType();
    setFileType(type);

    const fetchContent = async () => {
      setLoading(true);
      setError(null);
      try {
        if (type === 'docx') {
          const response = await fetch(url);
          const arrayBuffer = await response.arrayBuffer();
          const result = await mammoth.convertToHtml({ arrayBuffer });
          setContent(result.value);
        } else if (type === 'text' || type === 'markdown') {
          const response = await fetch(url);
          const text = await response.text();
          setContent(text);
        }
      } catch (err) {
        console.error('Error fetching file content:', err);
        setError('Failed to load file preview');
      } finally {
        setLoading(false);
      }
    };

    if (type !== 'pdf' && type !== 'unknown') {
      fetchContent();
    } else {
      setLoading(false);
    }
  }, [url, fileName]);

  if (loading) {
    return (
      <div className="flex h-[400px] w-full items-center justify-center bg-muted/30 rounded-md border">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col h-[400px] w-full items-center justify-center bg-muted/30 rounded-md border text-destructive gap-2">
        <AlertCircle className="h-8 w-8" />
        <p>{error}</p>
        <Button variant="outline" size="sm" asChild>
          <a href={url} target="_blank" rel="noopener noreferrer">
            <Download className="h-4 w-4 mr-2" />
            Download instead
          </a>
        </Button>
      </div>
    );
  }

  if (fileType === 'pdf') {
    return (
      <div className="h-[400px] w-full rounded-md border overflow-hidden">
        <iframe
          src={`${url}#toolbar=0`}
          className="w-full h-full"
          title="PDF Preview"
        />
      </div>
    );
  }

  if (fileType === 'docx') {
    return (
      <ScrollArea className="h-[400px] w-full rounded-md border p-6 bg-white">
        <div
          className="prose prose-sm max-w-none text-black"
          dangerouslySetInnerHTML={{ __html: content || '' }}
        />
      </ScrollArea>
    );
  }

  if (fileType === 'markdown') {
    return (
      <ScrollArea className="h-[400px] w-full rounded-md border p-6 bg-muted/10">
        <div className="prose prose-sm dark:prose-invert max-w-none">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {content || ''}
          </ReactMarkdown>
        </div>
      </ScrollArea>
    );
  }

  if (fileType === 'text') {
    return (
      <ScrollArea className="h-[400px] w-full rounded-md border p-4 bg-muted/30">
        <pre className="text-xs whitespace-pre-wrap font-sans">
          {content}
        </pre>
      </ScrollArea>
    );
  }

  return (
    <div className="flex flex-col h-[400px] w-full items-center justify-center bg-muted/30 rounded-md border gap-4">
      <FileText className="h-12 w-12 text-muted-foreground opacity-50" />
      <div className="text-center">
        <p className="font-medium">No preview available</p>
        <p className="text-sm text-muted-foreground">Supported previews: PPTX, PDF, DOCX, TXT, MD</p>
      </div>
      <Button variant="outline" asChild>
        <a href={url} target="_blank" rel="noopener noreferrer">
          <Download className="h-4 w-4 mr-2" />
          Download File
        </a>
      </Button>
    </div>
  );
}
