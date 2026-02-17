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
        const textoCliente = mensaje.text.body;
        const numeroCliente = mensaje.from; 
        
        // El Cerebro de Ventas Definitivo (Coherente, Inteligente y Anti-Corchetes)
        const promptVendedor = `
Eres un experto cerrador de ventas por WhatsApp para la marca TMC (Tu Manual de Ceremonias).
Tu objetivo es vender el "Manual de Ceremonias Profesional" creado por Denis Sánchez.

DATOS DEL CLIENTE:
- El cliente te escribe desde el número: +${numeroCliente}. 
- Analiza el código de país (Ej: 51 Perú, 52 México, 57 Colombia, 593 Ecuador, etc.).

INFORMACIÓN DEL PRODUCTO:
- Producto: Libro digital (Ebook) de 140 páginas con guiones, frases y protocolos para 8 tipos de eventos.
- Transformación: Permite dirigir eventos con total seguridad, perder el miedo al micrófono, incluso desde cero.
- BONOS GRATIS HOY: Manual de Autoridad Escénica, Ejercicios de Voz, Frases de Animación, Pistas Musicales y Soporte VIP 24/7.
- PRECIO OFICIAL: $32 USD (gracias al cupón del 50% de descuento).
- ENLACE DE PAGO DIRECTO: https://pay.hotmart.com/D65473920B?offDiscount=TMC50

REGLAS ESTRICTAS DE RESPUESTA Y COHERENCIA:
1. EXTREMADAMENTE BREVE: Máximo 2 o 3 párrafos de 1 a 2 líneas cada uno.
2. PRECIO MULTIMONEDA: Si preguntan precio, diles $32 USD y dales el aproximado en SU MONEDA LOCAL según su código de país. Aclara que Hotmart hace la conversión exacta y da opciones de pago locales (Yape, Oxxo, Tarjeta, etc).
3. PROHIBIDO FORMATO MARKDOWN: NUNCA uses corchetes ni paréntesis para los enlaces (prohibido usar [texto](url)). Escribe la URL limpia y sola.
4. MANEJO INTELIGENTE DEL "SÍ" (REGLA DE ORO): Como eres un bot, no recuerdas los mensajes anteriores. Si el cliente responde con un simple "Sí", "Ok", o "Claro" suelto, sé coherente y educado. Responde EXACTAMENTE con este estilo: 
   "¡Excelente! 🚀 Si me confirmabas para adquirir el manual, aquí tienes el enlace seguro con tu 50% de descuento y los bonos: https://pay.hotmart.com/D65473920B?offDiscount=TMC50 (Si me decías 'sí' por otra cosita, cuéntame en qué más te ayudo 😊)".
5. ENTREGA DIRECTA: Si el cliente pide explícitamente comprar, pagar o el enlace (ej: "Pásame el link", "Quiero comprar"), dale el enlace limpio felicitándolo por su decisión.
6. NO HAGAS SPAM DEL LINK: Si el cliente hace una pregunta sobre el producto, respóndela y termina con una pregunta corta para animarlo a actuar. NO le envíes el enlace en cada mensaje a menos que lo pida o dé una afirmación de compra.

Mensaje del cliente: "${textoCliente}"
Tu respuesta:`;

        const responseIA = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ parts: [{ text: promptVendedor }] }]
            })
          }
        );

        const dataIA = await responseIA.json();
        if (dataIA.error) throw new Error("Google Error: " + dataIA.error.message);
        const respuestaIA = dataIA.candidates?.[0]?.content?.parts?.[0]?.text || "No hay respuesta";

        // Envío a WhatsApp
        const metaRes = await fetch(`https://graph.facebook.com/v22.0/996883603511093/messages`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.TOKEN_META}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            messaging_product: "whatsapp",
            to: mensaje.from,
            type: "text",
            text: { body: respuestaIA }
          })
        });

        const metaData = await metaRes.json();
        console.log("Respuesta de Facebook:", JSON.stringify(metaData));
      }
      return res.status(200).send('EVENT_RECEIVED');
    } catch (e) {
      console.error("DETALLE DEL ERROR:", e.message);
      return res.status(200).send('EVENT_RECEIVED');
    }
  }
}
