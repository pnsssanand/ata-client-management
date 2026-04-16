const WHATSAPP_API_VERSION = 'v19.0';

export default async function handler(req: any, res: any) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const token = process.env.WHATSAPP_TOKEN;
  const businessAccountId = process.env.WHATSAPP_BUSINESS_ACCOUNT_ID;

  if (!token || !businessAccountId) {
    return res.status(500).json({ error: 'WhatsApp credentials not configured' });
  }

  try {
    const response = await fetch(
      `https://graph.facebook.com/${WHATSAPP_API_VERSION}/${businessAccountId}/message_templates?status=APPROVED`,
      { headers: { Authorization: `Bearer ${token}` } }
    );

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({
        error: data.error?.message || 'WhatsApp API error',
      });
    }

    return res.status(200).json({ templates: data.data || [] });
  } catch (error) {
    return res.status(500).json({
      error: error instanceof Error ? error.message : 'Failed to fetch templates',
    });
  }
}
