import { GoogleGenerativeAI } from "@google/generative-ai";

export default async function handler(req, res) {
  if (req.method === 'GET') {
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];
    if (token === 'tmc_ventas_123') return res.status(200).send(challenge);
    return res.status(403).send('Error de token');
  }

  if (req.method === 'POST') {
    try {
      // ⚠️ PEGA TU LLAVE AQUÍ DIRECTAMENTE (Solo para probar)
      const apiKey = "AIzaSyDxk5yoKLhLLHuSgDTsoJG_DZ9jUEx4KQc"; 
      
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-8b" });

      const body = req.body;
      const mensajeEntrante = body.entry?.[0]?.changes?.[0]?.value?.messages?.[0];

      if (mensajeEntrante) {
        // 1. Obtener respuesta de Gemini
        const result = await model.generateContent(mensajeEntrante.text.body);
        const respuesta = result.response.text();

        // 2. Enviar a WhatsApp
        await fetch(`https://graph.facebook.com/v22.0/996883603511093/messages`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.TOKEN_META}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            messaging_product: "whatsapp",
            to: mensajeEntrante.from,
            text: { body: respuesta }
          })
        });
      }
      res.status(200).send('OK');
    } catch (error) {
      console.error("Error del Bot:", error);
      // Esto hará que el bot te avise al celular si falla
      if (req.body.entry?.[0]?.changes?.[0]?.value?.messages?.[0]) {
         const celular = req.body.entry[0].changes[0].value.messages[0].from;
         await fetch(`https://graph.facebook.com/v22.0/996883603511093/messages`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.TOKEN_META}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            messaging_product: "whatsapp",
            to: celular,
            text: { body: "🚨 Error: Mi cerebro (Google) no responde. Revisa la API Key." }
          })
        });
      }
      res.status(200).send('FALLO_INTERNO');
    }
  }
}
