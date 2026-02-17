const LLAVE_DE_GOOGLE = "AIzaSyDxk5yoKLhLLHuSgDTsoJG_DZ9jUEx4KQc";
const TOKEN_DE_FACEBOOK = "EAAXslIyMy54BQlPZBOom4qL4fdtOCUYFsygDuqSVSN9BHm0BW4eta2htiRpmSpaOZBI2rzEfqAZBkdPqF9DNTZBsZAJaD4wNQQrvotZBLyb2M8NPRAHlTeVsf0xQ9q4NcHFuw8qmjKbXZAhQN1seltk8fpbpnNLYde9OMPZADAwPZBtR4T2ShMMaXgYIICSVYtoZAe0CagekiRxbXS7BdRubZAEBkDBTse3e9kFpwrhNfejY5HoprXPs1iKug55xXWeBHPlQnVhicFSRyM6PJVJdyyEdal0o3DWegPsYwZDZD";

export default async function handler(req, res) {
  if (req.method === 'GET') {
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];
    if (token === 'tmc_ventas_123') return res.status(200).send(challenge);
    return res.status(403).send('Error');
  }

  if (req.method === 'POST') {
    try {
      const mensaje = req.body.entry?.[0]?.changes?.[0]?.value?.messages?.[0];

      if (mensaje && mensaje.text) {
        // Petición a la Inteligencia Artificial
        const urlGoogle = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${LLAVE_DE_GOOGLE}`;
        
        const responseIA = await fetch(urlGoogle, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: mensaje.text.body }] }]
          })
        });

        const dataIA = await responseIA.json();
        
        if (dataIA.error) throw new Error("Google Error: " + dataIA.error.message);

        const respuestaIA = dataIA.candidates?.[0]?.content?.parts?.[0]?.text || "No hay respuesta";

        // Envío del mensaje a tu WhatsApp
        const urlMeta = `https://graph.facebook.com/v22.0/996883603511093/messages`;
        await fetch(urlMeta, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${TOKEN_DE_FACEBOOK}`,
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
