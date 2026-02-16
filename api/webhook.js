import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export default async function handler(req, res) {
  // 🔐 1. EL SALUDO SECRETO CON FACEBOOK (VERIFICACIÓN)
  if (req.method === 'GET') {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    // Esta es la contraseña que le daremos a Facebook en un momento
    if (mode === 'subscribe' && token === 'tmc_ventas_123') {
      res.status(200).send(challenge);
    } else {
      res.status(403).send('Error de verificación');
    }
    return;
  }

  // 🤖 2. RECIBIR MENSAJES Y RESPONDER CON LA IA
  if (req.method === 'POST') {
    try {
      const body = req.body;
      
      if (body.object === 'whatsapp_business_account') {
        const changes = body.entry[0].changes[0].value;
        
        if (changes.messages && changes.messages[0]) {
          const mensajeCliente = changes.messages[0].text.body; 

          // 👇 TUS INSTRUCCIONES DE VENTA INTACTAS 👇
          let instruccionesAI = `Rol: Eres un experto cerrador de ventas y asesor de eventos profesionales. Trabajas para la plataforma TMC.
Objetivo: Vender el "Manual de Ceremonias Profesional" a clientes que te escriben por WhatsApp.
Tono: Amable, persuasivo, empático, seguro y muy profesional. Usa emojis moderadamente para dar calidez (✨, 🤝, 📜, 🎓).

Reglas estrictas:
1. NUNCA des el precio en el primer mensaje. Primero pregúntale al cliente qué tipo de eventos suele dirigir.
2. Cuando pregunte el precio, dile que es de $32 USD.
3. Manejo de objeciones: Si dicen que es caro, recuérdales que un solo evento paga el manual 10 veces.
4. Cierre: Entrégale ÚNICAMENTE este enlace de pago: https://pay.hotmart.com/D65473920B?offDiscount=TMC50
5. Respuestas cortas: Máximo 3 o 4 líneas por mensaje.`;
          // 👆 FIN DE INSTRUCCIONES 👆

          const model = genAI.getGenerativeModel({ 
              model: "gemini-2.0-flash", 
              systemInstruction: instruccionesAI 
          });

          const resultado = await model.generateContent(mensajeCliente);
          const respuestaVendedor = resultado.response.text();

          console.log(`Respuesta generada: ${respuestaVendedor}`);
        }
      }
      res.status(200).send('EVENT_RECEIVED');
    } catch (error) {
      console.error("Error:", error);
      res.status(500).send('Error');
    }
  }
}
