import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import {
  FileText,
  Link as LinkIcon,
  Upload,
  Loader2,
  ChevronRight,
} from 'lucide-react';
import { DealStage } from '@/lib/types';

interface PromoteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  dealId: string;
  companyName: string;
  currentStage: DealStage;
  nextStage: DealStage;
  onSuccess: () => void;
}

export default function PromoteDialog({
  open,
  onOpenChange,
  dealId,
  companyName,
  currentStage,
  nextStage,
  onSuccess,
}: PromoteDialogProps) {
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [note, setNote] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const [linkTitle, setLinkTitle] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handlePromote = async () => {
    setIsSubmitting(true);
    try {
      // Update company pipeline stage
      const { error } = await supabase
        .from('companies')
        .update({ pipeline_stage: nextStage })
        .eq('id', dealId);

      if (error) throw error;

      // Log the promotion with any notes/links in the action
      const logDetails: string[] = [];
      if (note.trim()) logDetails.push(`Note: ${note}`);
      if (linkUrl.trim()) logDetails.push(`Link: ${linkTitle || linkUrl}`);
      if (selectedFile) logDetails.push(`Document: ${selectedFile.name}`);

      await supabase.from('company_logs').insert({
        company_id: dealId,
        action: `PROMOTED_FROM_${currentStage}_TO_${nextStage}`,
      });

      toast.success(`Promoted to ${nextStage}`);
      resetForm();
      onOpenChange(false);
      onSuccess();
    } catch (error: any) {
      console.error('Error promoting company:', error);
      toast.error('Failed to promote company');
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setNote('');
    setLinkUrl('');
    setLinkTitle('');
    setSelectedFile(null);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(open) => { if (!open) resetForm(); onOpenChange(open); }}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Promote to {nextStage}
          </DialogTitle>
          <DialogDescription>
            Add supporting information before promoting <span className="font-medium">{companyName}</span> from {currentStage} to {nextStage}.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="note" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="note" className="gap-1">
              <FileText className="h-3 w-3" />
              Note
            </TabsTrigger>
            <TabsTrigger value="link" className="gap-1">
              <LinkIcon className="h-3 w-3" />
              Link
            </TabsTrigger>
            <TabsTrigger value="document" className="gap-1">
              <Upload className="h-3 w-3" />
              Document
            </TabsTrigger>
          </TabsList>

          <TabsContent value="note" className="mt-4 space-y-3">
            <div>
              <Label htmlFor="note">Add a note (optional)</Label>
              <Textarea
                id="note"
                placeholder="Enter notes about this promotion..."
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={4}
                className="mt-1.5"
              />
            </div>
          </TabsContent>

          <TabsContent value="link" className="mt-4 space-y-3">
            <div>
              <Label htmlFor="linkUrl">URL</Label>
              <Input
                id="linkUrl"
                placeholder="https://..."
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                className="mt-1.5"
              />
            </div>
            <div>
              <Label htmlFor="linkTitle">Title (optional)</Label>
              <Input
                id="linkTitle"
                placeholder="Link description..."
                value={linkTitle}
                onChange={(e) => setLinkTitle(e.target.value)}
                className="mt-1.5"
              />
            </div>
          </TabsContent>

          <TabsContent value="document" className="mt-4 space-y-3">
            <div>
              <Label htmlFor="document">Upload Document</Label>
              <div className="mt-1.5">
                <Input
                  id="document"
                  type="file"
                  onChange={handleFileChange}
                  className="cursor-pointer"
                />
              </div>
              {selectedFile && (
                <p className="text-sm text-muted-foreground mt-2">
                  Selected: {selectedFile.name}
                </p>
              )}
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={handlePromote} disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Promoting...
              </>
            ) : (
              <>
                Promote
                <ChevronRight className="ml-1 h-4 w-4" />
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
