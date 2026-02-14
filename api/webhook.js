import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export default async function handler(req, res) {
  if (req.method === 'POST') {
    try {
      const body = req.body;
      
      if (body.object === 'whatsapp_business_account') {
        const changes = body.entry[0].changes[0].value;
        
        if (changes.messages && changes.messages[0]) {
          const mensajeCliente = changes.messages[0].text.body; 
          const miNumeroId = changes.metadata.phone_number_id; 

          // 👇 AQUÍ ESTÁ TU SYSTEM INSTRUCTION 👇
          let instruccionesAI = `Rol: Eres un experto cerrador de ventas y asesor de eventos profesionales. Trabajas para la plataforma TMC.
Objetivo: Vender el "Manual de Ceremonias Profesional" a clientes que te escriben por WhatsApp.
Tono: Amable, persuasivo, empático, seguro y muy profesional. Usa emojis moderadamente para dar calidez (✨, 🤝, 📜, 🎓).

Reglas estrictas:
1. NUNCA des el precio en el primer mensaje. Primero pregúntale al cliente qué tipo de eventos suele dirigir (bodas, graduaciones, quinceaños) para entender su necesidad.
2. Cuando el cliente pregunte el precio o muestre interés real, dile que el precio es de $47 USD (o su equivalente en moneda local).
3. Manejo de objeciones: Si dicen que es caro, recuérdales que un solo evento cobrado profesionalmente paga el manual 10 veces, y que el manual les da seguridad para no quedarse en blanco frente al público.
4. Cierre: Cuando el cliente diga "lo quiero" o pregunte cómo pagar, entrégale ÚNICAMENTE este enlace de pago: [AQUÍ_PON_TU_LINK_DE_PAGO_REAL] y dile que el acceso es inmediato.
5. Respuestas cortas: Estás en WhatsApp, no envíes testamentos. Máximo 3 o 4 líneas por mensaje.`;
          // 👆 HASTA AQUÍ LLEGA TU INSTRUCCIÓN 👆

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
