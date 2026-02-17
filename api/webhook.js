export default async function handler(req, res) {
  // Verificación de Meta
  if (req.method === 'GET') {
    if (req.query['hub.verify_token'] === 'tmc_ventas_123') {
      return res.status(200).send(req.query['hub.challenge']);
    }
    return res.status(403).send('Error');
  }

  if (req.method === 'POST') {
    try {
      const mensaje = req.body.entry?.[0]?.changes?.[0]?.value?.messages?.[0];
      if (mensaje && mensaje.text) {
        const textoCliente = mensaje.text.body;

        // 1. Petición a Gemini (usando la bóveda de Vercel)
        const prompt = `Actúa como vendedor experto de la empresa TMC. Vendes el 'Manual de Ceremonias Profesional'. Precio $32 USD. Link de pago: https://pay.hotmart.com/D65473920B?offDiscount=TMC50. Sé breve. \n\nCliente dice: ${textoCliente}`;
        
        const responseIA = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ parts: [{ text: prompt }] }]
            })
          }
        );

        const dataIA = await responseIA.json();
        if (dataIA.error) throw new Error("Google Error: " + dataIA.error.message);
        const respuestaIA = dataIA.candidates?.[0]?.content?.parts?.[0]?.text || "No hay respuesta";

        // 2. Envío a WhatsApp (usando la bóveda de Vercel)
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
      console.error("DETALLE DEL ERROR:", e.message);
      return res.status(200).send('EVENT_RECEIVED');
    }
  }
}
