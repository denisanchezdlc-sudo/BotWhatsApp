if (req.method === 'POST') {
    try {
      // 1. Verificamos que la API KEY exista antes de seguir
      if (!process.env.GEMINI_API_KEY) {
        throw new Error("La API KEY no está configurada en Vercel");
      }

      const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

      const mensaje = req.body.entry?.[0]?.changes?.[0]?.value?.messages?.[0];
      
      if (mensaje && mensaje.text) {
        // 2. Llamada a Gemini
        const result = await model.generateContent(mensaje.text.body);
        const response = await result.response;
        const respuesta = response.text(); 

        // 3. Envío a Meta
        const fbResponse = await fetch(`https://graph.facebook.com/v22.0/996883603511093/messages`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.TOKEN_META}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            messaging_product: "whatsapp",
            to: mensaje.from,
            type: "text",
            text: { body: respuesta }
          })
        });

        const fbData = await fbResponse.json();
        if (fbData.error) console.error("Error de Meta:", fbData.error);
      }
      
      return res.status(200).send('EVENT_RECEIVED');
    } catch (e) {
      console.error("Error Crítico:", e.message);
      return res.status(200).send('EVENT_RECEIVED'); 
    }
}
