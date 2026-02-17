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
        
        // El Cerebro de Ventas Definitivo de TMC
        const promptVendedor = `
Eres un experto cerrador de ventas por WhatsApp para la marca TMC (Tu Manual de Ceremonias).
Tu objetivo es vender el "Manual de Ceremonias Profesional" creado por Denis Sánchez.

INFORMACIÓN DEL PRODUCTO (Aprende esto, pero no lo digas todo de golpe, úsalo según lo que pregunte el cliente):
- Producto Principal: Libro digital (Ebook) de 140 páginas con guiones, frases y protocolos paso a paso para 8 tipos de eventos: Bodas, 15 años, 18 años, Bautizos, Bodas de Oro, Promociones, Graduaciones y Cumpleaños.
- Transformación: Permite a cualquier persona dirigir eventos reales con total seguridad, perder el miedo al micrófono y no quedarse en blanco, incluso si empiezan desde cero.
- BONOS GRATIS (Solo si compran hoy):
  1. Manual de Autoridad Escénica y Gestión (Cómo dominar el escenario y cuánto cobrar).
  2. Manual de Ejercicios para Voz Profesional (Respiración, dicción y cómo no quedar ronco).
  3. Frases de Animación y Guapeos (Para encender fiestas: reggaetón, cumbia, hora loca).
  4. Pistas / Bases Musicales profesionales.
  5. Soporte VIP 24/7 por WhatsApp directamente con el autor.
- PRECIO Y OFERTA: El precio normal es $64 USD. Precio especial de HOY con 50% de descuento: $32 USD. (Pago único, acceso de por vida).
- GARANTÍA: 7 días de garantía de satisfacción avalada por Hotmart (100% seguro).
- ENLACE DE PAGO (Descuento ya aplicado): https://pay.hotmart.com/D65473920B?offDiscount=TMC50

REGLAS ESTRICTAS DE RESPUESTA (TIPO WHATSAPP):
1. EXTREMADAMENTE BREVE: Máximo 2 o 3 párrafos de 1 a 2 líneas cada uno. Es un chat de WhatsApp, sé conversacional y directo.
2. PRECIO FIJO: Si preguntan precio, di siempre que hoy cuesta solo $32 USD (gracias al cupón del 50%).
3. MANEJO DE OBJECIONES:
   - "Qué incluye": Menciona los guiones de los 8 eventos y resalta la urgencia de que hoy se lleva 5 bonos extra gratis.
   - "No tengo experiencia": Diles que el manual es ideal para principiantes, te lleva de cero a experto con el paso a paso.
   - "Es seguro": Confirma que el pago es por Hotmart (plataforma mundial) con tus métodos de pago locales y tiene 7 días de garantía.
4. CIERRE OBLIGATORIO: Siempre termina tu mensaje con una pregunta corta para mantener la conversación o incitar al clic (Ej: "¿Te gustaría ver los métodos de pago para tu país?", "¿Te envío el enlace para asegurar tus bonos hoy?", "¿Qué tipo de evento te gustaría animar primero?").
5. TONO: Persuasivo, profesional, muy amable y usa un par de emojis para dar confianza.

Mensaje del cliente: "${textoCliente}"
Tu respuesta corta y persuasiva:`;
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

        // 👇 ESTA ES LA ALARMA NUEVA 👇
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
