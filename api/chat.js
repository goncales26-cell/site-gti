// api/chat.js
// Proxy serverless entre o widget de chat do site e o cenário do Make.com.
// A URL do webhook fica em uma variável de ambiente (MAKE_WEBHOOK_URL),
// configurada no painel da Vercel — nunca no código que chega ao navegador.

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Método não permitido.' });
    return;
  }

  const webhookUrl = process.env.MAKE_WEBHOOK_URL;
  if (!webhookUrl) {
    console.error('MAKE_WEBHOOK_URL não configurada nas variáveis de ambiente da Vercel.');
    res.status(500).json({ error: 'Assistente indisponível no momento.' });
    return;
  }

  const { message, history } = req.body || {};

  if (!message || typeof message !== 'string' || !message.trim()) {
    res.status(400).json({ error: 'Mensagem inválida.' });
    return;
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 55000);

    const upstream = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: message.trim(),
        history: typeof history === 'string' ? history : 'Inicio da conversa'
      }),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    const text = await upstream.text();
    res.status(upstream.status).send(text);
  } catch (err) {
    console.error('Erro ao contatar o webhook do Make:', err);
    res.status(502).json({ error: 'Falha ao contatar o assistente.' });
  }
};

