import { useState, useRef } from 'react';
import { Upload, FileSpreadsheet, Clipboard, Check, AlertCircle, X } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useClientStore } from '@/stores/clientStore';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import * as XLSX from 'xlsx';

const MAX_IMPORT_LIMIT = 500;

export function ImportClients() {
  const [pasteData, setPasteData] = useState('');
  const [importing, setImporting] = useState(false);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { addClient } = useClientStore();

  const processImportData = async (data: { name: string; phone: string }[]) => {
    if (data.length === 0) {
      toast.error('No valid entries found');
      return;
    }

    if (data.length > MAX_IMPORT_LIMIT) {
      toast.error(`Maximum ${MAX_IMPORT_LIMIT} entries allowed at a time`, {
        description: `You have ${data.length} entries. Please reduce the number of entries.`
      });
      return;
    }

    setImporting(true);
    let imported = 0;
    let skipped = 0;

    for (const entry of data) {
      const phone = entry.phone.replace(/[^0-9+]/g, '');
      
      if (phone.length >= 10) {
        try {
          await addClient({
            name: entry.name || phone,
            phone: entry.phone,
            status: 'New Lead',
            priority: 'Medium',
            followUpRequired: true,
          });
          imported++;
        } catch (error) {
          console.error('Error adding client:', error);
          skipped++;
        }
      } else {
        skipped++;
      }
    }

    setImporting(false);
    setUploadedFileName(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }

    if (imported > 0) {
      toast.success(`Successfully imported ${imported} clients!`, {
        description: skipped > 0 ? `${skipped} entries were skipped due to invalid phone numbers.` : undefined
      });
    } else {
      toast.error('No valid entries found', {
        description: 'Please ensure phone numbers have at least 10 digits'
      });
    }
  };

  const parseExcelData = (workbook: XLSX.WorkBook): { name: string; phone: string }[] => {
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const jsonData = XLSX.utils.sheet_to_json<Record<string, unknown>>(worksheet, { header: 1 });
    
    if (jsonData.length === 0) return [];

    const result: { name: string; phone: string }[] = [];
    
    // Check if first row is header
    const firstRow = jsonData[0] as unknown[];
    const hasHeader = firstRow && firstRow.some(cell => 
      typeof cell === 'string' && 
      (cell.toLowerCase().includes('name') || cell.toLowerCase().includes('phone'))
    );
    
    const startIndex = hasHeader ? 1 : 0;
    
    for (let i = startIndex; i < jsonData.length; i++) {
      const row = jsonData[i] as unknown[];
      if (!row || row.length === 0) continue;
      
      let name = '';
      let phone = '';
      
      if (row.length === 1) {
        // Only one column - assume it's phone
        phone = String(row[0] || '').trim();
        name = phone;
      } else if (row.length >= 2) {
        // Two or more columns - first is name, second is phone
        name = String(row[0] || '').trim();
        phone = String(row[1] || '').trim();
        if (!name) name = phone;
      }
      
      if (phone) {
        result.push({ name, phone });
      }
    }
    
    return result;
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadedFileName(file.name);

    try {
      const arrayBuffer = await file.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer, { type: 'array' });
      const data = parseExcelData(workbook);
      
      if (data.length === 0) {
        toast.error('No data found in file', {
          description: 'Please ensure the file has valid data with phone numbers.'
        });
        setUploadedFileName(null);
        return;
      }

      await processImportData(data);
    } catch (error) {
      console.error('Error parsing file:', error);
      toast.error('Error reading file', {
        description: 'Please ensure the file is a valid Excel or CSV file.'
      });
      setUploadedFileName(null);
    }
  };

  const handlePasteImport = async () => {
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

    // Process clients sequentially to avoid ID collisions
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
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
        try {
          await addClient({
            name: name || phone,
            phone: parts.length >= 2 ? parts[1] : parts[0],
            status: 'New Lead',
            priority: 'Medium',
            followUpRequired: true,
          });
          imported++;
        } catch (error) {
          console.error('Error adding client:', error);
          skipped++;
        }
      } else {
        skipped++;
      }
    }

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
              ref={fileInputRef}
              disabled={importing}
            />
            <label htmlFor="file-upload" className={cn("cursor-pointer", importing && "pointer-events-none opacity-50")}>
              {importing ? (
                <>
                  <div className="h-12 w-12 mx-auto text-primary mb-4 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                  <p className="text-foreground font-medium mb-1">
                    Importing clients...
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Please wait while we process your file
                  </p>
                </>
              ) : uploadedFileName ? (
                <>
                  <FileSpreadsheet className="h-12 w-12 mx-auto text-primary mb-4" />
                  <p className="text-foreground font-medium mb-1">
                    {uploadedFileName}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Click to upload a different file
                  </p>
                </>
              ) : (
                <>
                  <Upload className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-foreground font-medium mb-1">
                    Click to upload or drag and drop
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Supports .xlsx, .xls, and .csv files
                  </p>
                </>
              )}
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
