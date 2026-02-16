import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export default async function handler(req, res) {
  if (req.method === 'GET') {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    if (mode === 'subscribe' && token === 'tmc_ventas_123') {
      res.status(200).send(challenge);
    } else {
      res.status(403).send('Error de verificación');
    }
    return;
  }

  if (req.method === 'POST') {
    try {
      const body = req.body;
      if (body.object === 'whatsapp_business_account') {
        const changes = body.entry[0].changes[0].value;
        if (changes.messages && changes.messages[0]) {
          const mensajeCliente = changes.messages[0].text.body;
          const numeroCliente = changes.messages[0].from; // <-- Capturamos tu número para saber a quién responderle

          let instruccionesAI = `Rol: Eres un experto cerrador de ventas y asesor de eventos profesionales. Trabajas para la plataforma TMC.
Objetivo: Vender el "Manual de Ceremonias Profesional" a clientes que te escriben por WhatsApp.
Tono: Amable, persuasivo, empático, seguro y muy profesional. Usa emojis moderadamente para dar calidez (✨, 🤝, 📜, 🎓).
Reglas estrictas:
1. NUNCA des el precio en el primer mensaje. Primero pregúntale al cliente qué tipo de eventos suele dirigir.
2. Cuando pregunte el precio, dile que es de $32 USD.
3. Cierre: Entrégale ÚNICAMENTE este enlace de pago: https://pay.hotmart.com/D65473920B?offDiscount=TMC50
4. Respuestas cortas: Máximo 3 o 4 líneas por mensaje.`;

          const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash", systemInstruction: instruccionesAI });
          const resultado = await model.generateContent(mensajeCliente);
          const respuestaVendedor = resultado.response.text();

          // 👇 LA BOCA DEL BOT: ENVIAR RESPUESTA A WHATSAPP 👇
          const TOKEN_META = "EAAXslIyMy54BQi5GZCeRP0HEy0MT7cOATAlzLjOKWuKjPI39HAN7lRbDlf2JgFWT7tX3ojpvdzESNlHHyMSl0UIlyypUXIGp6ZA9VCF53kgSx46qfAfA58NTZAeJNrZChY0QtH8rSVFkh9TfKZBV6G1ZB0PZBM3xqQqelYnEcQD7iNgWrMJAkD7eC1xz7yTNEyeW2Jy9XxdB8KKaY8xc4AxSEleQO0fsw1mNZAdLGZBsGHZBOa8qXvctx1dnb3ebdhilHZAK4ZBU0wVapO2AO2NqRJZBaEd6VxmdQEMXMRQZDZD"; // ¡Reemplaza esto con tu token copiado de Meta!
          const ID_TELEFONO = "996883603511093"; // Tu Identificador de WhatsApp

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
      }
      res.status(200).send('EVENT_RECEIVED');
    } catch (error) {
      console.error("Error:", error);
      res.status(500).send('Error');
    }
  }
}
