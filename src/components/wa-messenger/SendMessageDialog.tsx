import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { Send, CheckCircle, XCircle, Loader2, UploadCloud, FileVideo } from 'lucide-react';
import { Client } from '@/types/client';
import { useClientStore } from '@/stores/clientStore';
import { storage } from '@/lib/firebase';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';

interface Template {
  name: string;
  language: string;
  status: string;
  components: {
    type: string;
    text?: string;
    format?: string;
  }[];
}

interface SendResult {
  clientName: string;
  phone: string;
  status: 'sent' | 'failed';
  error?: string;
}

interface SendMessageDialogProps {
  selectedClients: Client[];
  onClose: () => void;
}

export function SendMessageDialog({
  selectedClients,
  onClose,
}: SendMessageDialogProps) {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loadingTemplates, setLoadingTemplates] = useState(true);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [variables, setVariables] = useState<string[]>([]);
  const [videoUrl, setVideoUrl] = useState<string>('');
  
  // Video upload state
  const [isDragging, setIsDragging] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [uploadFileName, setUploadFileName] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [sending, setSending] = useState(false);
  const [results, setResults] = useState<SendResult[]>([]);
  const addMessageLog = useClientStore((state) => state.addMessageLog);

  // Drag & drop handlers
  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const onDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileUpload(files[0]);
    }
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFileUpload(e.target.files[0]);
    }
  };

  const handleFileUpload = (file: File) => {
    if (!file.type.includes('mp4')) {
      alert('Please upload an MP4 video file.');
      return;
    }
    if (file.size > 16 * 1024 * 1024) {
      alert('File is too large. WhatsApp recommends keeping video files under 16MB.');
      return;
    }

    const storageRef = ref(storage, `whatsapp_videos/${Date.now()}_${file.name}`);
    const uploadTask = uploadBytesResumable(storageRef, file);

    setUploadProgress(0);
    setUploadFileName(file.name);
    setVideoUrl('');

    uploadTask.on(
      'state_changed',
      (snapshot) => {
        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        setUploadProgress(progress);
      },
      (error) => {
        console.error('Upload failed:', error);
        alert('Upload failed: ' + error.message);
        setUploadProgress(null);
        setUploadFileName('');
      },
      () => {
        getDownloadURL(uploadTask.snapshot.ref).then((downloadURL) => {
          setVideoUrl(downloadURL);
          setUploadProgress(null);
        });
      }
    );
  };

  useEffect(() => {
    fetch('/api/whatsapp/templates')
      .then((r) => r.json())
      .then((data) => setTemplates(data.templates || []))
      .catch(console.error)
      .finally(() => setLoadingTemplates(false));
  }, []);

  function getVariableCount(tpl: Template): number {
    const body = tpl.components.find((c) => c.type === 'BODY');
    if (!body?.text) return 0;
    const matches = body.text.match(/\{\{\d+\}\}/g);
    return matches ? matches.length : 0;
  }

  function selectTemplate(name: string) {
    const tpl = templates.find((t) => t.name === name) || null;
    setSelectedTemplate(tpl);
    if (tpl) {
      setVariables(new Array(getVariableCount(tpl)).fill(''));
      const header = tpl.components.find((c) => c.type === 'HEADER');
      if (header?.format === 'VIDEO') {
        setVideoUrl('https://www.w3schools.com/html/mov_bbb.mp4');
      } else {
        setVideoUrl('');
      }
    } else {
      setVariables([]);
      setVideoUrl('');
    }
  }

  function getPreviewText(): string {
    if (!selectedTemplate) return '';
    const body = selectedTemplate.components.find((c) => c.type === 'BODY');
    let text = body?.text || '';
    variables.forEach((val, i) => {
      text = text.replace(`{{${i + 1}}}`, val || `{{${i + 1}}}`);
    });
    return text;
  }

  const handleBulkSend = useCallback(async () => {
    if (!selectedTemplate) return;
    setSending(true);
    setResults([]);

    const bodyParams = variables
      .filter((v) => v.length > 0)
      .map((v) => ({ type: 'text' as const, text: v }));

    const components: any[] = [];

    const headerComp = selectedTemplate.components.find((c) => c.type === 'HEADER');
    if (headerComp?.format === 'VIDEO') {
      components.push({
        type: 'header',
        parameters: [
          {
            type: 'video',
            video: {
              link: videoUrl || 'https://www.w3schools.com/html/mov_bbb.mp4'
            }
          }
        ]
      });
    }

    if (bodyParams.length > 0) {
      components.push({ type: 'body', parameters: bodyParams });
    }

    for (let i = 0; i < selectedClients.length; i++) {
      const client = selectedClients[i];
      try {
        const res = await fetch('/api/whatsapp/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            to: client.phone,
            templateName: selectedTemplate.name,
            languageCode: selectedTemplate.language,
            components,
            recipientName: client.name,
          }),
        });

        const data = await res.json();
        const msgStatus = res.ok ? 'sent' : 'failed';

        // Log to Firestore
        addMessageLog({
          recipientPhone: client.phone,
          recipientName: client.name,
          templateName: selectedTemplate.name,
          variables: components,
          status: msgStatus,
          waMessageId: data.result?.messages?.[0]?.id,
          error: res.ok ? undefined : data.error,
          sentAt: new Date(),
        });

        setResults((prev) => [
          ...prev,
          {
            clientName: client.name,
            phone: client.phone,
            status: msgStatus,
            error: res.ok ? undefined : data.error,
          },
        ]);
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Network error';

        // Log failure to Firestore
        addMessageLog({
          recipientPhone: client.phone,
          recipientName: client.name,
          templateName: selectedTemplate.name,
          variables: components,
          status: 'failed',
          error: errorMsg,
          sentAt: new Date(),
        });

        setResults((prev) => [
          ...prev,
          {
            clientName: client.name,
            phone: client.phone,
            status: 'failed',
            error: errorMsg,
          },
        ]);
      }

      // Delay between sends
      if (i < selectedClients.length - 1) {
        await new Promise((r) => setTimeout(r, 1500));
      }
    }

    setSending(false);
  }, [selectedClients, selectedTemplate, variables]);

  const sentCount = results.filter((r) => r.status === 'sent').length;
  const failedCount = results.filter((r) => r.status === 'failed').length;
  const progressPct =
    selectedClients.length > 0
      ? Math.round((results.length / selectedClients.length) * 100)
      : 0;

  return (
    <Dialog open onOpenChange={(open) => !open && !sending && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Send WhatsApp Message</DialogTitle>
          <p className="text-sm text-muted-foreground">
            Sending to {selectedClients.length} recipient
            {selectedClients.length > 1 ? 's' : ''}
          </p>
        </DialogHeader>

        {/* Progress */}
        {(sending || results.length > 0) && (
          <div className="space-y-4">
            <div>
              <div className="mb-1 flex items-center justify-between text-sm">
                <span className="font-medium">
                  {sending ? 'Sending…' : 'Complete'}
                </span>
                <span className="text-muted-foreground">
                  {results.length} / {selectedClients.length} ({progressPct}%)
                </span>
              </div>
              <Progress value={progressPct} className="h-3" />
            </div>

            <div className="flex gap-4 text-sm">
              <span className="flex items-center gap-1 text-green-600">
                <CheckCircle className="h-4 w-4" /> {sentCount} sent
              </span>
              <span className="flex items-center gap-1 text-red-500">
                <XCircle className="h-4 w-4" /> {failedCount} failed
              </span>
              {sending && (
                <span className="flex items-center gap-1 text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" /> In progress
                </span>
              )}
            </div>

            <ScrollArea className="max-h-48 rounded-lg border">
              {results.map((r, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between border-b px-3 py-2 text-sm last:border-b-0"
                >
                  <div>
                    <span className="font-medium">{r.clientName}</span>
                    <span className="ml-2 text-muted-foreground">{r.phone}</span>
                  </div>
                  {r.status === 'sent' ? (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  ) : (
                    <div className="flex items-center gap-1">
                      <XCircle className="h-4 w-4 text-red-500" />
                      <span className="max-w-[150px] truncate text-xs text-red-400">
                        {r.error}
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </ScrollArea>

            {!sending && results.length > 0 && (
              <Button onClick={onClose} className="w-full">
                Close
              </Button>
            )}
          </div>
        )}

        {/* Template config (hidden during send) */}
        {!sending && results.length === 0 && (
          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium">
                Select Template
              </label>
              {loadingTemplates ? (
                <div className="flex items-center gap-2 rounded-lg border p-3 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Loading templates…
                </div>
              ) : templates.length === 0 ? (
                <div className="rounded-lg border p-3 text-sm text-muted-foreground">
                  No approved templates found. Create templates in the WhatsApp Business Manager.
                </div>
              ) : (
                <Select
                  value={selectedTemplate?.name || ''}
                  onValueChange={selectTemplate}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a template…" />
                  </SelectTrigger>
                  <SelectContent>
                    {templates.map((t) => (
                      <SelectItem key={t.name} value={t.name}>
                        {t.name} ({t.language})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            {/* Variable inputs */}
            {variables.length > 0 && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Template Variables</label>
                {variables.map((val, i) => (
                  <Input
                    key={i}
                    placeholder={`{{${i + 1}}} value`}
                    value={val}
                    onChange={(e) => {
                      const next = [...variables];
                      next[i] = e.target.value;
                      setVariables(next);
                    }}
                  />
                ))}
              </div>
            )}

            {/* Video URL input */}
            {selectedTemplate?.components.some((c) => c.type === 'HEADER' && c.format === 'VIDEO') && (
              <div className="space-y-4 mt-4">
                <div>
                  <label className="text-sm font-medium">Upload Video (.mp4)</label>
                  
                  <div
                    onDragOver={onDragOver}
                    onDragLeave={onDragLeave}
                    onDrop={onDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={`mt-2 flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-6 transition-colors cursor-pointer ${
                      isDragging
                        ? 'border-green-500 bg-green-50'
                        : 'border-muted-foreground/25 hover:bg-muted/50'
                    }`}
                  >
                    <input
                      type="file"
                      accept="video/mp4"
                      className="hidden"
                      ref={fileInputRef}
                      onChange={handleFileChange}
                    />
                    
                    {uploadProgress !== null ? (
                      <div className="w-full text-center space-y-2">
                        <Loader2 className="mx-auto h-8 w-8 animate-spin text-muted-foreground" />
                        <p className="text-sm font-medium">{uploadFileName}</p>
                        <Progress value={uploadProgress} className="h-2 w-full" />
                        <p className="text-xs text-muted-foreground">{Math.round(uploadProgress)}% uploaded</p>
                      </div>
                    ) : (
                      <>
                        <UploadCloud className="mb-2 h-8 w-8 text-muted-foreground" />
                        <p className="text-sm font-medium text-foreground">
                          Click or drag video to upload
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          MP4 files only (max 16MB recommended)
                        </p>
                      </>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Or paste Video Link manually</label>
                  <Input
                    placeholder="https://example.com/video.mp4"
                    value={videoUrl}
                    onChange={(e) => setVideoUrl(e.target.value)}
                  />
                  {videoUrl && uploadProgress === null && (
                     <p className="text-xs text-green-600 flex items-center gap-1 mt-1">
                        <FileVideo className="h-3 w-3" /> Link attached successfully
                     </p>
                  )}
                </div>
              </div>
            )}

            {/* Preview */}
            {selectedTemplate && (
              <div className="rounded-lg border border-green-200 bg-green-50 p-4">
                <p className="mb-1 text-xs font-semibold uppercase text-green-600">
                  Preview
                </p>
                <p className="whitespace-pre-wrap text-sm">{getPreviewText()}</p>
              </div>
            )}

            {/* Recipients */}
            <div>
              <label className="mb-2 block text-sm font-medium">Recipients</label>
              <ScrollArea className="max-h-32 rounded-lg border p-2">
                {selectedClients.map((c) => (
                  <div
                    key={c.id}
                    className="flex items-center justify-between py-1 text-sm"
                  >
                    <span className="font-medium">{c.name}</span>
                    <span className="text-muted-foreground">{c.phone}</span>
                  </div>
                ))}
              </ScrollArea>
            </div>

            {/* Send button */}
            <Button
              onClick={handleBulkSend}
              disabled={!selectedTemplate}
              className="w-full bg-green-600 hover:bg-green-700"
            >
              <Send className="mr-2 h-4 w-4" />
              Send to {selectedClients.length} Recipients
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
