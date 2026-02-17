export default async function handler(req, res) {
  // Manejo de Verificación de Facebook (GET)
  if (req.method === 'GET') {
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];
    if (token === 'tmc_ventas_123') return res.status(200).send(challenge);
    return res.status(403).send('Error');
  }

  // Manejo de Mensajes Recibidos (POST)
  if (req.method === 'POST') {
    try {
      const mensaje = req.body.entry?.[0]?.changes?.[0]?.value?.messages?.[0];

      if (mensaje && mensaje.text) {
        // 1. LLAMADA DIRECTA A GEMINI (SIN LIBRERÍA)
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

        // Verificamos si Google devolvió un error en el JSON
        if (dataIA.error) {
          throw new Error(`Google Error: ${dataIA.error.message}`);
        }

        const respuesta = dataIA.candidates?.[0]?.content?.parts?.[0]?.text || "Lo siento, no pude procesar eso.";

        // 2. ENVÍO A WHATSAPP (META)
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
            text: { body: respuesta }
          })
        });
      }

      return res.status(200).send('EVENT_RECEIVED');
    } catch (e) {
      // Este log aparecerá en Vercel si algo falla
      console.error("DETALLE DEL ERROR:", e.message);
      return res.status(200).send('EVENT_RECEIVED');
    }
  }
}
