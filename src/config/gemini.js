


// node --version # Should be >= 18
// npm install @google/generative-ai

import {
    GoogleGenerativeAI,
    HarmCategory,
    HarmBlockThreshold,
  } from "@google/generative-ai";
  
  const MODEL_NAME = "gemini-2.0-flash";
  const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

  
  function fileToGenerativePart(file) {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64Data = reader.result.split(',')[1];
        resolve({
          inlineData: {
            data: base64Data,
            mimeType: file.type
          }
        });
      };
      reader.readAsDataURL(file);
    });
  }

  async function runChat(prompt, imageFile = null, language = 'en') {
    try {
      console.log("runChat called with:", { prompt, imageFile, language });
      
      const genAI = new GoogleGenerativeAI(API_KEY);
      
      const generationConfig = {
        temperature: 0.9,
        topK: 1,
        topP: 1,
        maxOutputTokens: 2048,
      };
    
      const safetySettings = [
        {
          category: HarmCategory.HARM_CATEGORY_HARASSMENT,
          threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
        },
        {
          category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
          threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
        },
        {
          category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
          threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
        },
        {
          category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
          threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
        },
      ];

      // Simplified system instruction
      const systemInstruction = language !== 'en' 
        ? "Always respond in Hindi (हिंदी) language only."
        : "You are a helpful AI assistant.";

      let result;
      
      if (imageFile) {
        const imagePart = await fileToGenerativePart(imageFile);
        const model = genAI.getGenerativeModel({ 
          model: MODEL_NAME,
          systemInstruction: systemInstruction
        });
        result = await model.generateContent([prompt, imagePart]);
      } else {
        // Simplified approach - direct generateContent instead of chat
        const model = genAI.getGenerativeModel({ 
          model: MODEL_NAME,
          systemInstruction: systemInstruction,
          generationConfig,
          safetySettings
        });
        result = await model.generateContent(prompt);
      }
      
      const response = result.response;
      const text = response.text();
      console.log("API Response received:", text);
      return text;
      
    } catch (error) {
      console.error("Error in runChat:", error);
      throw error;
    }
  }
  
 export default runChat;
