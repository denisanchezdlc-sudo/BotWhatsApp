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
        
        // 👇 1. PEGA TUS DOS CLAVES AQUÍ ADENTRO DE LAS COMILLAS 👇
        const LLAVE_DE_GOOGLE = "AIzaSyDxk5yoKLhLLHuSgDTsoJG_DZ9jUEx4KQc";
        const TOKEN_DE_FACEBOOK = "EAAXslIyMy54BQivVCp5YkkCky31ta5Q8HVFHtD4Y5GeplKHyzKsZCd4wAlYPNNhjPLZACcteCwYFYplEsA2ZAaJX16JlDFOiIBZBpembEBXks7vPZBZAZAdjxZC6Ie16B12A4JdkDbpjGvIZC24v5fKSiV9DLEEJU0qqlir7zDDrd72CV6kqm9q5pGdZA1lzJeLf2dcYSSc0v5huj7FMDeGXZAFWh8ZC4GPjLNZC0mqxVCOBzTSZBRI2W9hAsGFNfzyZACxSFkPRtwfz2E9GtgHgbtZArHKXgdUOxJOC3jr5KwZDZD";

        // Petición a Gemini (Ahora con la llave oculta y segura)
        const responseIA = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent`,
          {
            method: 'POST',
            headers: { 
              'Content-Type': 'application/json',
              'x-goog-api-key': LLAVE_DE_GOOGLE // <-- La llave entra segura por aquí
            },
            body: JSON.stringify({
              contents: [{ parts: [{ text: mensaje.text.body }] }]
            })
          }
        );

        const dataIA = await responseIA.json();
        if (dataIA.error) throw new Error("Google Error: " + dataIA.error.message);
        const respuestaIA = dataIA.candidates?.[0]?.content?.parts?.[0]?.text || "No hay respuesta";

        // Envío a WhatsApp
        await fetch(`https://graph.facebook.com/v22.0/996883603511093/messages`, {
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
