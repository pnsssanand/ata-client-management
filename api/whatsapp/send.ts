const WHATSAPP_API_VERSION = 'v19.0';

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const token = process.env.WHATSAPP_TOKEN;
  const phoneNumberId = process.env.PHONE_NUMBER_ID;

  if (!token || !phoneNumberId) {
    return res.status(500).json({ error: 'WhatsApp credentials not configured' });
  }

  try {
    const { to, templateName, languageCode = 'en', components = [] } = req.body;

    if (!to || !templateName) {
      return res.status(400).json({ error: 'to and templateName are required' });
    }

    const phone = String(to).replace(/\D/g, '');

    const messageBody = {
      messaging_product: 'whatsapp',
      to: phone,
      type: 'template',
      template: {
        name: templateName,
        language: { code: languageCode },
        ...(components.length > 0 ? { components } : {}),
      },
    };

    const response = await fetch(
      `https://graph.facebook.com/${WHATSAPP_API_VERSION}/${phoneNumberId}/messages`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(messageBody),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({
        error: data.error?.message || 'Send failed',
      });
    }

    return res.status(200).json({ success: true, result: data });
  } catch (error) {
    return res.status(500).json({
      error: error instanceof Error ? error.message : 'Send failed',
    });
  }
}
