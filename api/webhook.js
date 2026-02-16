import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Definimos la personalidad del bot
const instruccionesSistema = `
  Eres el asistente virtual de Corporación Macrochips, ubicada en Trujillo (Jr. Francisco Pizarro 257).
  Tu objetivo es ser un vendedor amable, técnico y eficiente. 
  Vendes laptops, accesorios tecnológicos y soluciones de energía solar.
  Si no sabes un precio específico, invita al cliente a visitar la tienda o déjale el número de contacto.
  Responde de forma breve y usa emojis para ser más cercano.
`;

export default async function handler(req, res) {
  if (req.method === 'GET') {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];
    if (mode === 'subscribe' && token === 'tmc_ventas_123') {
      return res.status(200).send(challenge);
    }
    return res.status(403).send('Error');
  }

  if (req.method === 'POST') {
    try {
      const body = req.body;
      const changes = body.entry?.[0]?.changes?.[0]?.value;

      if (changes?.messages?.[0]) {
        const mensajeCliente = changes.messages[0].text.body;
        const numeroCliente = changes.messages[0].from;

        // Configuramos el modelo con las instrucciones de sistema
        const model = genAI.getGenerativeModel({ 
          model: "gemini-1.5-flash",
          systemInstruction: instruccionesSistema 
        });

        const resultado = await model.generateContent(mensajeCliente);
        const respuestaVendedor = resultado.response.text();

        // Variables de Meta (¡Recuerda ponerlas en las variables de entorno de Vercel!)
        const TOKEN_META = process.env.TOKEN_META || "EAAXslIyMy54..."; 
        const ID_TELEFONO = "996883603511093";

        await fetch(`https://graph.facebook.com/v22.0/${ID_TELEFONO}/messages`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${TOKEN_META}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            messaging_product: "whatsapp",
            to: numeroCliente,
            text: { body: respuestaVendedor }
          })
        });
      }
      res.status(200).send('EVENT_RECEIVED');
    } catch (error) {
      console.error("Error detallado:", error);
      res.status(500).send('Error');
    }
  }
}

