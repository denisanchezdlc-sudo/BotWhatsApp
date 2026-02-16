import { GoogleGenerativeAI } from "@google/generative-ai";

export default async function handler(req, res) {
  if (req.method === 'GET') {
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];
    if (token === 'tmc_ventas_123') return res.status(200).send(challenge);
    return res.status(403).send('Error');
  }

  if (req.method === 'POST') {
    try {
      const apiKey = "AIzaSyDxk5yoKLhLLHuSgDTsoJG_DZ9jUEx4KQc"; // Usa la del proyecto nuevo
      // CORRECTO (Coincide con tu captura)
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

      const mensaje = req.body.entry?.[0]?.changes?.[0]?.value?.messages?.[0];
      if (mensaje) {
        const result = await model.generateContent(mensaje.text.body);
        const respuesta = result.response.text();

        await fetch(`https://graph.facebook.com/v22.0/996883603511093/messages`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.TOKEN_META}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            messaging_product: "whatsapp",
            to: mensaje.from,
            text: { body: respuesta }
          })
        });
      }
      return res.status(200).send('EVENT_RECEIVED');
    } catch (e) {
      console.error("Error:", e.message);
      return res.status(200).send('EVENT_RECEIVED'); // Detiene los reintentos de Meta
    }
  }
}
