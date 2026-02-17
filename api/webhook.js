export default async function handler(req, res) {
  // 1. VERIFICACIÓN DEL WEBHOOK (Para Facebook Developers)
  if (req.method === 'GET') {
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];
    if (token === 'tmc_ventas_123') return res.status(200).send(challenge);
    return res.status(403).send('Error de token');
  }

  // 2. PROCESAMIENTO DE MENSAJES (POST)
  if (req.method === 'POST') {
    try {
      const entry = req.body.entry?.[0];
      const cambios = entry?.changes?.[0];
      const mensaje = cambios?.value?.messages?.[0];

      if (mensaje && mensaje.text) {
        const textoUsuario = mensaje.text.body;
        const numeroUsuario = mensaje.from;

        // --- LLAMADA DIRECTA A GEMINI ---
        const responseIA = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ parts: [{ text: textoUsuario }] }]
            })
          }
        );

        const dataIA = await responseIA.json();

        // Si Google responde con error, lo atrapamos aquí
        if (dataIA.error) {
          throw new Error(`Google API Error: ${dataIA.error.message}`);
        }

        const respuestaIA = dataIA.candidates?.[0]?.content?.parts?.[0]?.text || "Lo siento, no pude procesar tu mensaje.";

        // --- ENVÍO DE RESPUESTA A WHATSAPP ---
        await fetch(`https://graph.facebook.com/v22.0/996883603511093/messages`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.TOKEN_META}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            messaging_product: "whatsapp",
            to: numeroUsuario,
            type: "text",
            text: { body: respuestaIA }
          })
        });
      }

      // IMPORTANTE: Siempre responder 200 a Meta para que no bloqueen el webhook
      return res.status(200).send('EVENT_RECEIVED');

    } catch (error) {
      console.error("DETALLE DEL ERROR:", error.message);
      return res.status(200).send('EVENT_RECEIVED');
    }
  }

  return res.status(405).send('Método no permitido');
}
