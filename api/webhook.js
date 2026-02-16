import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

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
      if (mensaje) {
        // FORZAMOS LA VERSIÓN v1 PARA EVITAR EL ERROR 404
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" }, { apiVersion: 'v1' });
        const result = await model.generateContent(mensaje.text.body);
        const respuesta = result.response.text();

        await fetch(`https://graph.facebook.com/v22.0/996883603511093/messages`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.TOKEN_META || 'EAAXslIyMy54...' }`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            messaging_product: "whatsapp",
            to: mensaje.from,
            text: { body: respuesta }
          })
        });
      }
      res.status(200).send('OK');
    } catch (e) {
      console.error("Error Crítico:", e.message);
      res.status(500).send(e.message);
    }
  }
}
