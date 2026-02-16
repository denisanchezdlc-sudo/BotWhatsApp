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
      res.status(403).send('Error');
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

         const model = genAI.getGenerativeModel({ model: "gemini-pro" });
          const resultado = await model.generateContent(mensajeCliente);
          const respuestaVendedor = resultado.response.text();

          const TOKEN_META = "EAAXslIyMy54BQjriZBurUxQMqSFJUBYAbAsvJtoZBQOqL5vCT7c2nvLX7ReBcNXOoO6AZBSzsokvQZBYXtEp8Loxg75Rh9VC80WSDyV9BaeBWfYCYUSomavZAh8R8auJx3aljEb4oLHuBISW8H7HF1LaDx6j78IgJe9tJq8w7VD22ky4YQeYLifzUgZBEvMIMpRzLWZCOqkLF66PgekZCVsx6SDaoOoZCKbPN80Sq1OvBDvHWb0CZCZBxhiy8plhuLXwMBh0YpkBWtTYwH929eEikaRqI7ZC2ZCAaDFQ3wgZDZD";
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
      }
      res.status(200).send('EVENT_RECEIVED');
    } catch (error) {
      console.error("Error:", error);
      res.status(500).send('Error');
    }
  }
}

