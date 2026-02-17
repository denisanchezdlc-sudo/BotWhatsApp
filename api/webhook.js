export default async function handler(req, res) {
  // 1. Verificación para Meta
  if (req.method === 'GET') {
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];
    if (token === 'tmc_ventas_123') return res.status(200).send(challenge);
    return res.status(403).send('Error');
  }

  // 2. Respuesta del Bot
  if (req.method === 'POST') {
    try {
      const mensaje = req.body.entry?.[0]?.changes?.[0]?.value?.messages?.[0];

      if (mensaje && mensaje.text) {
        // Llamada a Gemini
        const responseIA = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ parts: [{ text: mensaje.text.body }] }]
            })
          }
        );

        const dataIA = await responseIA.json();
        const respuestaIA = dataIA.candidates?.[0]?.content?.parts?.[0]?.text || "No pude procesar eso.";

        // Envío a WhatsApp
        await fetch(`https://graph.facebook.com/v22.0/996883603511093/messages`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.TOKEN_META}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            messaging_product: "whatsapp",
            to: mensaje.from,
            type: "text",
            text: { body: respuestaIA }
          })
        });
      }
      return res.status(200).send('EVENT_RECEIVED');
    } catch (e) {
      console.error("Error:", e.message);
      return res.status(200).send('EVENT_RECEIVED');
    }
  }
}
