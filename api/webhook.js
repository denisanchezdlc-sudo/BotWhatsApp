import { GoogleGenerativeAI } from "@google/generative-ai";

export default async function handler(req, res) {
  // 1. Verificación del Webhook (GET)
  if (req.method === 'GET') {
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];
    if (token === 'tmc_ventas_123') return res.status(200).send(challenge);
    return res.status(403).send('Error de token');
  }

  // 2. Procesamiento de Mensajes (POST)
  if (req.method === 'POST') {
    try {
      // Limpiamos la llave de Google por si se colaron espacios al copiarla
      const apiKey = (process.env.GEMINI_API_KEY || "").replace(/\s/g, '');
      const genAI = new GoogleGenerativeAI(apiKey);
      
      // Usamos el modelo sin forzar versión (la librería actualizada sabrá qué hacer)
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

      const body = req.body;
      const mensajeEntrante = body.entry?.[0]?.changes?.[0]?.value?.messages?.[0];

      if (mensajeEntrante) {
        // Generamos la respuesta
        const result = await model.generateContent(mensajeEntrante.text.body);
        const respuesta = result.response.text();

        // Enviamos a WhatsApp
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
      res.status(200).send('EVENT_RECEIVED');
    } catch (error) {
      console.error("Error detallado del Bot:", error);
      // Respondemos 200 a Facebook para que no siga reintentando el mensaje fallido
      res.status(200).send('EVENT_RECEIVED_BUT_FAILED');
    }
  }
}
