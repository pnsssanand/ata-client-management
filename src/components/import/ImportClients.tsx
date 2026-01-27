import { useState, useRef } from 'react';
import { Upload, FileSpreadsheet, Clipboard, Check, AlertCircle, X, Smartphone } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useClientStore } from '@/stores/clientStore';
import { useIsMobile } from '@/hooks/use-mobile';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import * as XLSX from 'xlsx';

// Mobile users can upload up to 2000 contacts, desktop limited to 500 for paste
const MAX_MOBILE_IMPORT_LIMIT = 2000;
const MAX_PASTE_IMPORT_LIMIT = 500;

// Normalize phone number for comparison (remove all non-digit characters except +)
const normalizePhone = (phone: string): string => {
  return phone.replace(/[^0-9+]/g, '').replace(/^\+?91/, '').replace(/^0+/, '');
};

export function ImportClients() {
  const [pasteData, setPasteData] = useState('');
  const [importing, setImporting] = useState(false);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [importStats, setImportStats] = useState<{
    imported: number;
    duplicatesInFile: number;
    duplicatesExisting: number;
    invalid: number;
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { addClient, clients } = useClientStore();
  const isMobile = useIsMobile();

  // Get all existing phone numbers for duplicate detection
  const existingPhones = new Set(clients.map(c => normalizePhone(c.phone)));

  const processImportData = async (data: { name: string; phone: string }[], maxLimit: number) => {
    if (data.length === 0) {
      toast.error('No valid entries found');
      return;
    }

    if (data.length > maxLimit) {
      toast.error(`Maximum ${maxLimit} entries allowed at a time`, {
        description: `You have ${data.length} entries. Please reduce the number of entries.`
      });
      return;
    }

    setImporting(true);
    setImportStats(null);
    
    let imported = 0;
    let duplicatesInFile = 0;
    let duplicatesExisting = 0;
    let invalid = 0;

    // Track phones seen in this import batch to detect duplicates within the file
    const seenPhonesInBatch = new Set<string>();

    for (const entry of data) {
      const rawPhone = entry.phone.replace(/[^0-9+]/g, '');
      const normalizedPhone = normalizePhone(entry.phone);
      
      // Check if phone number is valid (at least 10 digits)
      if (rawPhone.length < 10) {
        invalid++;
        continue;
      }

      // Check for duplicate within the same import file
      if (seenPhonesInBatch.has(normalizedPhone)) {
        duplicatesInFile++;
        continue;
      }

      // Check for duplicate with existing clients
      if (existingPhones.has(normalizedPhone)) {
        duplicatesExisting++;
        continue;
      }

      // Add to seen phones for this batch
      seenPhonesInBatch.add(normalizedPhone);

      try {
        await addClient({
          name: entry.name || rawPhone,
          phone: entry.phone,
          status: 'New Lead',
          priority: 'Medium',
          followUpRequired: true,
        });
        imported++;
        // Also add to existing phones set to prevent duplicates if user imports again
        existingPhones.add(normalizedPhone);
      } catch (error) {
        console.error('Error adding client:', error);
        invalid++;
      }
    }

    setImporting(false);
    setUploadedFileName(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }

    const totalSkipped = duplicatesInFile + duplicatesExisting + invalid;
    setImportStats({ imported, duplicatesInFile, duplicatesExisting, invalid });

    if (imported > 0) {
      toast.success(`Successfully imported ${imported} clients!`, {
        description: totalSkipped > 0 
          ? `${totalSkipped} entries skipped (${duplicatesExisting} existing, ${duplicatesInFile} duplicates in file, ${invalid} invalid)`
          : undefined
      });
    } else {
      toast.error('No new clients imported', {
        description: totalSkipped > 0
          ? `All entries were skipped: ${duplicatesExisting} already exist, ${duplicatesInFile} duplicates in file, ${invalid} invalid`
          : 'Please ensure phone numbers have at least 10 digits'
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
    setImportStats(null);

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

      // Use mobile limit for file uploads (2000), since this is the main mobile upload feature
      await processImportData(data, MAX_MOBILE_IMPORT_LIMIT);
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
    
    // Check for paste limit
    if (lines.length > MAX_PASTE_IMPORT_LIMIT) {
      toast.error(`Maximum ${MAX_PASTE_IMPORT_LIMIT} entries allowed for paste import`, {
        description: `You have ${lines.length} entries. Please use file upload for larger imports (up to ${MAX_MOBILE_IMPORT_LIMIT}).`
      });
      return;
    }

    setImportStats(null);

    // Parse pasted data into the same format as Excel data
    const parsedData: { name: string; phone: string }[] = [];
    
    for (const line of lines) {
      const parts = line.split(/[,\t]/).map(p => p.trim());
      
      let name = '';
      let phone = '';
      
      if (parts.length === 1) {
        phone = parts[0];
        name = phone;
      } else if (parts.length >= 2) {
        name = parts[0] || parts[1];
        phone = parts[1];
      }
      
      if (phone) {
        parsedData.push({ name, phone });
      }
    }

    await processImportData(parsedData, MAX_PASTE_IMPORT_LIMIT);
    setPasteData('');
  };

  return (
    <div className="space-y-6">
      {/* Import Stats Summary - Shows after import */}
      {importStats && (
        <Card className="border-border/50 bg-muted/20">
          <CardContent className="pt-6">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="text-center p-3 bg-green-500/10 rounded-lg border border-green-500/20">
                <p className="text-2xl font-bold text-green-600">{importStats.imported}</p>
                <p className="text-xs text-muted-foreground">Imported</p>
              </div>
              <div className="text-center p-3 bg-yellow-500/10 rounded-lg border border-yellow-500/20">
                <p className="text-2xl font-bold text-yellow-600">{importStats.duplicatesExisting}</p>
                <p className="text-xs text-muted-foreground">Already Exist</p>
              </div>
              <div className="text-center p-3 bg-orange-500/10 rounded-lg border border-orange-500/20">
                <p className="text-2xl font-bold text-orange-600">{importStats.duplicatesInFile}</p>
                <p className="text-xs text-muted-foreground">Duplicates in File</p>
              </div>
              <div className="text-center p-3 bg-red-500/10 rounded-lg border border-red-500/20">
                <p className="text-2xl font-bold text-red-600">{importStats.invalid}</p>
                <p className="text-xs text-muted-foreground">Invalid</p>
              </div>
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              className="w-full mt-4"
              onClick={() => setImportStats(null)}
            >
              <X className="h-4 w-4 mr-1" />
              Dismiss
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Mobile Upload Banner */}
      {isMobile && (
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-full">
                <Smartphone className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="font-medium text-foreground text-sm">Mobile Upload</p>
                <p className="text-xs text-muted-foreground">
                  Upload up to {MAX_MOBILE_IMPORT_LIMIT.toLocaleString()} contacts at once via Excel file
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* File Upload - Primary for Mobile */}
        <Card className={cn("border-border/50", isMobile && "order-first")}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileSpreadsheet className="h-5 w-5 text-primary" />
              Upload Excel File
              {isMobile && <Badge variant="secondary" className="ml-2">Recommended</Badge>}
            </CardTitle>
            <CardDescription>
              Import up to {MAX_MOBILE_IMPORT_LIMIT.toLocaleString()} clients from Excel (.xlsx) or CSV files
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className={cn(
              "border-2 border-dashed border-border rounded-xl text-center hover:border-primary/50 transition-colors",
              isMobile ? "p-6" : "p-8"
            )}>
              <input
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={handleFileUpload}
                className="hidden"
                id="file-upload"
                ref={fileInputRef}
                disabled={importing}
              />
              <label htmlFor="file-upload" className={cn("cursor-pointer block", importing && "pointer-events-none opacity-50")}>
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
                    <Upload className={cn("mx-auto text-muted-foreground mb-4", isMobile ? "h-10 w-10" : "h-12 w-12")} />
                    <p className="text-foreground font-medium mb-1">
                      {isMobile ? "Tap to select file" : "Click to upload or drag and drop"}
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
              <p className="text-xs text-muted-foreground mt-2">
                Duplicate contacts (same phone number) will be automatically skipped
              </p>
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
              Copy and paste client data directly (max {MAX_PASTE_IMPORT_LIMIT})
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              placeholder={`Paste your data here...\n\nFormat: Name (optional), Phone\nExamples:\nJohn Doe, +91 98765 43210\n+91 87654 32109`}
              value={pasteData}
              onChange={(e) => setPasteData(e.target.value)}
              className={cn("bg-background", isMobile ? "min-h-[140px]" : "min-h-[180px]")}
            />

            <div className="flex items-center justify-between flex-wrap gap-2">
              <p className={cn("text-sm", 
                pasteData.trim().split('\n').filter(l => l.trim()).length > MAX_PASTE_IMPORT_LIMIT 
                  ? "text-destructive font-medium" 
                  : "text-muted-foreground"
              )}>
                {pasteData.trim().split('\n').filter(l => l.trim()).length} entries detected
                {pasteData.trim().split('\n').filter(l => l.trim()).length > MAX_PASTE_IMPORT_LIMIT && ` (max ${MAX_PASTE_IMPORT_LIMIT})`}
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
                  size={isMobile ? "sm" : "default"}
                >
                  {importing ? (
                    <>Importing...</>
                  ) : (
                    <>
                      <Check className="h-4 w-4 mr-2" />
                      Import
                    </>
                  )}
                </Button>
              </div>
            </div>

            <div className="p-4 bg-chart-1/10 rounded-lg border border-chart-1/20">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-4 w-4 text-chart-1 mt-0.5 shrink-0" />
                <div className="text-sm">
                  <p className="font-medium text-foreground">Tips</p>
                  <ul className="text-muted-foreground mt-1 space-y-1">
                    <li>• One client per line</li>
                    <li>• Only phone number is required</li>
                    <li>• Use comma or tab to separate name and phone</li>
                    <li>• Maximum {MAX_PASTE_IMPORT_LIMIT} entries per paste</li>
                    <li>• Duplicate phone numbers are automatically skipped</li>
                  </ul>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
