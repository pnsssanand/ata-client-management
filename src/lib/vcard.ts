import { Client } from '@/types/client';

/**
 * Generates a vCard (Virtual Contact File) for a client
 * Follows RFC 6350 (vCard 3.0 standard)
 * 
 * @param client - Client object containing contact information
 * @returns vCard string in .vcf format
 */
export function generateVCard(client: Client): string {
  // Escape special characters for vCard format
  const escapeVCardValue = (value: string): string => {
    return value
      .replace(/\\/g, '\\\\')  // Backslash
      .replace(/;/g, '\\;')    // Semicolon
      .replace(/,/g, '\\,')    // Comma
      .replace(/\n/g, '\\n');  // Newline
  };

  // Format phone number - remove spaces and special chars for vCard
  const formatPhone = (phone: string): string => {
    return phone.replace(/[\s\-\(\)]/g, '');
  };

  const lines: string[] = [
    'BEGIN:VCARD',
    'VERSION:3.0',
  ];

  // Full name (required)
  if (client.name) {
    lines.push(`FN:${escapeVCardValue(client.name)}`);
    // Structured name (Family name;Given name;Additional names;Honorific prefixes;Honorific suffixes)
    // For simplicity, we'll just use the full name as the family name
    lines.push(`N:${escapeVCardValue(client.name)};;;;`);
  }

  // Phone number (required)
  if (client.phone) {
    const formattedPhone = formatPhone(client.phone);
    lines.push(`TEL;TYPE=CELL:${formattedPhone}`);
  }

  // Email (optional)
  if (client.email) {
    lines.push(`EMAIL;TYPE=INTERNET:${escapeVCardValue(client.email)}`);
  }

  // Organization/Company (optional)
  if (client.company) {
    lines.push(`ORG:${escapeVCardValue(client.company)}`);
  }

  // Add a note with additional context
  const noteLines: string[] = [];
  if (client.status) {
    noteLines.push(`Status: ${client.status}`);
  }
  if (client.priority) {
    noteLines.push(`Priority: ${client.priority}`);
  }
  if (noteLines.length > 0) {
    lines.push(`NOTE:${escapeVCardValue(noteLines.join(' | '))}`);
  }

  lines.push('END:VCARD');

  return lines.join('\r\n');
}

/**
 * Downloads a vCard file to the user's device
 * 
 * @param client - Client object to create vCard for
 */
export function downloadVCard(client: Client): void {
  try {
    // Generate vCard content
    const vCardContent = generateVCard(client);

    // Create a Blob with the vCard content
    const blob = new Blob([vCardContent], { type: 'text/vcard;charset=utf-8' });

    // Create a temporary download link
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;

    // Generate filename from client name (sanitize for filesystem)
    const sanitizedName = client.name
      .replace(/[^a-zA-Z0-9\s]/g, '') // Remove special characters
      .replace(/\s+/g, '_')           // Replace spaces with underscores
      .substring(0, 50);              // Limit length

    link.download = `${sanitizedName || 'contact'}.vcf`;

    // Trigger download
    document.body.appendChild(link);
    link.click();

    // Cleanup
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Error downloading vCard:', error);
    throw new Error('Failed to download contact');
  }
}
