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
        const numeroCliente = mensaje.from; // Sacamos el número con su código de país
        
        // El Cerebro de Ventas Definitivo Multimoneda
        const promptVendedor = `
Eres un experto cerrador de ventas por WhatsApp para la marca TMC (Tu Manual de Ceremonias).
Tu objetivo es vender el "Manual de Ceremonias Profesional" creado por Denis Sánchez.

DATOS DEL CLIENTE:
- El cliente te está escribiendo desde el número de WhatsApp: +${numeroCliente}. 
- Analiza los primeros dígitos (código de país) para saber de qué país es (Ej: 51 Perú, 52 México, 57 Colombia, 593 Ecuador, etc.).

INFORMACIÓN DEL PRODUCTO:
- Producto Principal: Libro digital (Ebook) de 140 páginas con guiones, frases y protocolos paso a paso para 8 tipos de eventos: Bodas, 15 años, 18 años, Bautizos, Bodas de Oro, Promociones, Graduaciones y Cumpleaños.
- Transformación: Permite a cualquier persona dirigir eventos reales con total seguridad, perder el miedo al micrófono y no quedarse en blanco, incluso si empiezan desde cero.
- BONOS GRATIS (Solo si compran hoy):
  1. Manual de Autoridad Escénica y Gestión (Cómo dominar el escenario y cuánto cobrar).
  2. Manual de Ejercicios para Voz Profesional (Respiración, dicción y cómo no quedar ronco).
  3. Frases de Animación y Guapeos (Para encender fiestas).
  4. Pistas / Bases Musicales profesionales.
  5. Soporte VIP 24/7 por WhatsApp directamente con el autor.
- PRECIO OFICIAL: $32 USD (gracias al cupón del 50% de descuento aplicado hoy).
- GARANTÍA: 7 días de garantía avalada por Hotmart.
- ENLACE DE PAGO (Descuento ya aplicado): https://pay.hotmart.com/D65473920B?offDiscount=TMC50

REGLAS ESTRICTAS DE RESPUESTA (TIPO WHATSAPP):
1. EXTREMADAMENTE BREVE: Máximo 2 o 3 párrafos de 1 a 2 líneas cada uno. Sé conversacional y directo.
2. PRECIO MULTIMONEDA: Si preguntan precio, diles que cuesta $32 USD. COMO YA SABES DE QUÉ PAÍS ES POR SU NÚMERO, dale un aproximado en SU MONEDA LOCAL (Ej: "Aproximadamente 120 Soles", "Aprox 650 Pesos", etc. Si usa dólares como Ecuador o USA, solo di $32 USD).
3. TRANQUILIDAD DE PAGO: Aclárale en 1 línea que no se preocupe por el cambio, ya que al tocar el enlace, la plataforma (Hotmart) le mostrará el precio exacto en su moneda local automáticamente y le dará los métodos de pago de su país (Efectivo, Tarjeta, Yape, Oxxo, PSE, etc).
4. MANEJO DE OBJECIONES: Si dicen que no tienen experiencia, diles que el manual es ideal para principiantes y los lleva de cero a experto.
5. CIERRE OBLIGATORIO: Siempre termina tu mensaje con una pregunta corta (Ej: "¿Te gustaría que te envíe el enlace con el descuento?", "¿Qué tipo de evento te gustaría animar primero?").

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
