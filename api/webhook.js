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
          const numeroCliente = changes.messages[0].from;

          let instruccionesAI = `Rol: Eres un experto cerrador de ventas y asesor de eventos profesionales. Trabajas para la plataforma TMC.
Objetivo: Vender el "Manual de Ceremonias Profesional" a clientes que te escriben por WhatsApp.
Tono: Amable, persuasivo, empático, seguro y muy profesional.
Reglas:
1. NUNCA des el precio en el primer mensaje. Pregunta primero qué tipo de eventos dirige.
2. El precio es de $32 USD.
3. Cierre: Da este enlace de pago: https://pay.hotmart.com/D65473920B?offDiscount=TMC50
4. Sé breve, máximo 3 o 4 líneas.`;

          const model = genAI.getGenerativeModel({ model: "gemini-pro", systemInstruction: instruccionesAI });
          const resultado = await model.generateContent(mensajeCliente);
          const respuestaVendedor = resultado.response.text();

          const TOKEN_META = "EAAXslIyMy54BQjriZBurUxQMqSFJUBYAbAsvJtoZBQOqL5vCT7c2nvLX7ReBcNXOoO6AZBSzsokvQZBYXtEp8Loxg75Rh9VC80WSDyV9BaeBWfYCYUSomavZAh8R8auJx3aljEb4oLHuBISW8H7HF1LaDx6j78IgJe9tJq8w7VD22ky4YQeYLifzUgZBEvMIMpRzLWZCOqkLF66PgekZCVsx6SDaoOoZCKbPN80Sq1OvBDvHWb0CZCZBxhiy8plhuLXwMBh0YpkBWtTYwH929eEikaRqI7ZC2ZCAaDFQ3wgZDZD"; 
          const ID_TELEFONO = "996883603511093"; 

          const fbResponse = await fetch(`https://graph.facebook.com/v22.0/${ID_TELEFONO}/messages`, {
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

          // 👇 ESTA ES LA ALARMA NUEVA QUE TE DEBÍA 👇
          const fbData = await fbResponse.json();
          console.log("Respuesta de Facebook:", fbData);
        }
      }
      res.status(200).send('EVENT_RECEIVED');
    } catch (error) {
      console.error("Error general:", error);
      res.status(500).send('Error');
    }
  }
}
