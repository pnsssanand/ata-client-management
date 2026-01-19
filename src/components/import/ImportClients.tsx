import { useState } from 'react';
import { Upload, FileSpreadsheet, Clipboard, Check, AlertCircle, X } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useClientStore } from '@/stores/clientStore';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const MAX_IMPORT_LIMIT = 500;

export function ImportClients() {
  const [pasteData, setPasteData] = useState('');
  const [importing, setImporting] = useState(false);
  const { addClient } = useClientStore();

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // For demo, we'll just show a success message
    toast.success('File upload feature coming soon!', {
      description: 'Backend integration required for CSV/Excel parsing.'
    });
  };

  const handlePasteImport = () => {
    if (!pasteData.trim()) {
      toast.error('Please paste some data first');
      return;
    }

    // Parse pasted data (expecting: Name (optional), Phone - one per line)
    const lines = pasteData.trim().split('\n').filter(l => l.trim());
    
    // Check for 500 limit
    if (lines.length > MAX_IMPORT_LIMIT) {
      toast.error(`Maximum ${MAX_IMPORT_LIMIT} entries allowed at a time`, {
        description: `You have ${lines.length} entries. Please reduce the number of entries.`
      });
      return;
    }

    setImporting(true);

    let imported = 0;
    let skipped = 0;

    lines.forEach((line) => {
      const parts = line.split(/[,\t]/).map(p => p.trim());
      
      // Check if it's just a phone number or name + phone
      let name = '';
      let phone = '';
      
      if (parts.length === 1) {
        // Only phone number provided
        phone = parts[0].replace(/[^0-9+]/g, '');
        name = phone; // Use phone as name if no name provided
      } else if (parts.length >= 2) {
        // Name and phone provided
        name = parts[0] || parts[1].replace(/[^0-9+]/g, '');
        phone = parts[1].replace(/[^0-9+]/g, '');
      }
      
      // Validate phone number (basic check - at least 10 digits)
      if (phone.length >= 10) {
        addClient({
          name: name || phone,
          phone: parts.length >= 2 ? parts[1] : parts[0],
          status: 'New Lead',
          priority: 'Medium',
          followUpRequired: true,
        });
        imported++;
      } else {
        skipped++;
      }
    });

    setTimeout(() => {
      setImporting(false);
      setPasteData('');
      
      if (imported > 0) {
        toast.success(`Successfully imported ${imported} clients!`, {
          description: skipped > 0 ? `${skipped} entries were skipped due to invalid phone numbers.` : undefined
        });
      } else {
        toast.error('No valid entries found', {
          description: 'Please ensure phone numbers have at least 10 digits'
        });
      }
    }, 1000);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* File Upload */}
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5 text-primary" />
            Upload File
          </CardTitle>
          <CardDescription>
            Import clients from Excel (.xlsx) or CSV files
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="border-2 border-dashed border-border rounded-xl p-8 text-center hover:border-primary/50 transition-colors">
            <input
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={handleFileUpload}
              className="hidden"
              id="file-upload"
            />
            <label htmlFor="file-upload" className="cursor-pointer">
              <Upload className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-foreground font-medium mb-1">
                Click to upload or drag and drop
              </p>
              <p className="text-sm text-muted-foreground">
                Supports .xlsx, .xls, and .csv files
              </p>
            </label>
          </div>

          <div className="mt-4 p-4 bg-muted/30 rounded-lg">
            <p className="text-sm font-medium text-foreground mb-2">Expected columns:</p>
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline">Name (optional)</Badge>
              <Badge variant="outline">Phone *</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Paste Import */}
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clipboard className="h-5 w-5 text-primary" />
            Paste Data
          </CardTitle>
          <CardDescription>
            Copy and paste client data directly
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            placeholder={`Paste your data here...\n\nFormat: Name (optional), Phone\nExamples:\nJohn Doe, +91 98765 43210\n+91 87654 32109`}
            value={pasteData}
            onChange={(e) => setPasteData(e.target.value)}
            className="min-h-[180px] bg-background"
          />

          <div className="flex items-center justify-between">
            <p className={cn("text-sm", 
              pasteData.trim().split('\n').filter(l => l.trim()).length > MAX_IMPORT_LIMIT 
                ? "text-destructive font-medium" 
                : "text-muted-foreground"
            )}>
              {pasteData.trim().split('\n').filter(l => l.trim()).length} entries detected
              {pasteData.trim().split('\n').filter(l => l.trim()).length > MAX_IMPORT_LIMIT && ` (max ${MAX_IMPORT_LIMIT})`}
            </p>
            <div className="flex gap-2">
              {pasteData && (
                <Button variant="ghost" size="sm" onClick={() => setPasteData('')}>
                  <X className="h-4 w-4 mr-1" />
                  Clear
                </Button>
              )}
              <Button 
                onClick={handlePasteImport} 
                disabled={!pasteData.trim() || importing}
              >
                {importing ? (
                  <>Importing...</>
                ) : (
                  <>
                    <Check className="h-4 w-4 mr-2" />
                    Import Clients
                  </>
                )}
              </Button>
            </div>
          </div>

          <div className="p-4 bg-chart-1/10 rounded-lg border border-chart-1/20">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-chart-1 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-foreground">Tips</p>
                <ul className="text-muted-foreground mt-1 space-y-1">
                  <li>• One client per line</li>
                  <li>• Only phone number is required</li>
                  <li>• Use comma or tab to separate name and phone</li>
                  <li>• Maximum {MAX_IMPORT_LIMIT} entries per import</li>
                </ul>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
