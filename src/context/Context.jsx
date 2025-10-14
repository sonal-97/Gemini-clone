import { createContext, useState } from "react";
import runChat from "../config/gemini";

export const Context = createContext();

const ContextProvider = (props) => {
  //props means properties

  const [input, setInput] = useState("");
  const [recentPrompt, setRecentPrompt] = useState("");
  const [prevPrompts, setPrevPrompts] = useState([]);
  const [showResult, setShowResult] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resultData, setResultData] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [uploadedImage, setUploadedImage] = useState(null);
  const [detectedLanguage, setDetectedLanguage] = useState("en");
  const [isProcessingAudio, setIsProcessingAudio] = useState(false);

  // Chat management
  const [chats, setChats] = useState([]);
  const [currentChatId, setCurrentChatId] = useState(null);
  const [conversationHistory, setConversationHistory] = useState([]);

  const delayPara = (index, nextWord) => {
    setTimeout(function () {
      setResultData((prev) => prev + nextWord);
    }, 75 * index);
  };

  const formatResponse = (response) => {
    let formatted = response;

    // First handle **bold text** (must be done before single asterisks)
    formatted = formatted.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");

    // Handle numbered lists and bullet points better
    formatted = formatted.replace(/^\* /gm, "• ");

    // Convert newlines to line breaks
    formatted = formatted.replace(/\n/g, "<br>");

    // Handle remaining single asterisks (but be more careful)
    formatted = formatted.replace(/(?<!\*)\*(?!\*)/g, "");

    // Handle backticks for code
    formatted = formatted.replace(
      /`([^`]+)`/g,
      '<code style="background-color: #f1f3f4; padding: 2px 4px; border-radius: 3px; font-family: monospace;">$1</code>'
    );

    // Clean up multiple consecutive <br> tags
    formatted = formatted.replace(/(<br>\s*){3,}/g, "<br><br>");

    return formatted;
  };

  const newChat = () => {
    // Save current chat if it has messages
    if (currentChatId && conversationHistory.length > 0) {
      setChats((prev) =>
        prev.map((chat) =>
          chat.id === currentChatId
            ? {
                ...chat,
                messages: conversationHistory,
                lastUpdated: new Date().toISOString(),
              }
            : chat
        )
      );
    }

    // Create new chat
    const newChatId = Date.now().toString();
    const newChatObj = {
      id: newChatId,
      title: "New Chat",
      messages: [],
      createdAt: new Date().toISOString(),
      lastUpdated: new Date().toISOString(),
    };

    setChats((prev) => [newChatObj, ...prev]);
    setCurrentChatId(newChatId);
    setConversationHistory([]);
    setLoading(false);
    setShowResult(false);
    setUploadedImage(null);
    setResultData("");
  };

  const switchToChat = (chatId) => {
    // Save current chat first
    if (currentChatId && conversationHistory.length > 0) {
      setChats((prev) =>
        prev.map((chat) =>
          chat.id === currentChatId
            ? {
                ...chat,
                messages: conversationHistory,
                lastUpdated: new Date().toISOString(),
              }
            : chat
        )
      );
    }

    // Switch to selected chat
    const selectedChat = chats.find((chat) => chat.id === chatId);
    if (selectedChat) {
      setCurrentChatId(chatId);
      setConversationHistory(selectedChat.messages || []);
      setShowResult(selectedChat.messages.length > 0);
      setResultData("");
      setLoading(false);
    }
  };

  const updateChatTitle = (chatId, firstMessage) => {
    const title =
      firstMessage.length > 30
        ? firstMessage.substring(0, 30) + "..."
        : firstMessage;
    setChats((prev) =>
      prev.map((chat) => (chat.id === chatId ? { ...chat, title } : chat))
    );
  };

  const detectLanguage = (text) => {
    // Simple language detection - check for Hindi/Devanagari characters
    const hindiPattern = /[\u0900-\u097F]/;
    const arabicPattern = /[\u0600-\u06FF]/;
    const urduPattern = /[\u0600-\u06FF\u0750-\u077F]/;

    if (hindiPattern.test(text)) {
      return "hi";
    } else if (arabicPattern.test(text) || urduPattern.test(text)) {
      return "hi"; // Force Hindi for Arabic/Urdu as requested
    } else {
      return "en";
    }
  };

  let currentRecognition = null;

  const startVoiceSearch = () => {
    if (
      !("webkitSpeechRecognition" in window) &&
      !("SpeechRecognition" in window)
    ) {
      alert("Voice search not supported in this browser");
      return;
    }

    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    currentRecognition = new SpeechRecognition();

    currentRecognition.continuous = true;
    currentRecognition.interimResults = true;
    currentRecognition.lang = "en-US";

    currentRecognition.onstart = () => {
      console.log("Voice recognition started");
      setIsListening(true);
    };

    currentRecognition.onresult = (event) => {
      let finalTranscript = "";
      let interimTranscript = "";

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript;
        } else {
          interimTranscript += transcript;
        }
      }

      // Show interim results in input field
      setInput(finalTranscript + interimTranscript);
    };

    currentRecognition.onerror = (event) => {
      console.error("Voice recognition error:", event.error);
      setIsListening(false);
      setIsProcessingAudio(false);
      alert(`Voice recognition failed: ${event.error}. Please try again.`);
    };

    currentRecognition.onend = () => {
      console.log("Voice recognition ended");
      setIsListening(false);
      if (input.trim()) {
        setIsProcessingAudio(true);
        // Simulate processing delay
        setTimeout(() => {
          const lang = detectLanguage(input);
          setDetectedLanguage(lang);
          setIsProcessingAudio(false);
        }, 1000);
      }
    };

    try {
      currentRecognition.start();
    } catch (error) {
      console.error("Failed to start voice recognition:", error);
      setIsListening(false);
      alert("Failed to start voice recognition. Please try again.");
    }
  };

  const stopVoiceSearch = () => {
    if (currentRecognition) {
      currentRecognition.stop();
    }
    setIsListening(false);
  };

  const handleImageUpload = (file) => {
    if (file && file.type.startsWith("image/")) {
      setUploadedImage(file);
    } else {
      alert("Please select a valid image file");
    }
  };

  const onSent = async (prompt, imageFile = null) => {
    // Get the final prompt BEFORE clearing input
    const finalPrompt = prompt !== undefined ? prompt : input;
    const finalImageFile = imageFile || uploadedImage;

    // Don't proceed if no prompt
    if (!finalPrompt || finalPrompt.trim() === "") {
      console.log("No prompt provided, not sending");
      return;
    }

    console.log("Sending message:", finalPrompt);

    // Create new chat if none exists
    let chatId = currentChatId;
    if (!chatId) {
      const newChatId = Date.now().toString();
      const newChatObj = {
        id: newChatId,
        title: "New Chat",
        messages: [],
        createdAt: new Date().toISOString(),
        lastUpdated: new Date().toISOString(),
      };
      setChats((prev) => [newChatObj, ...prev]);
      setCurrentChatId(newChatId);
      chatId = newChatId;
    }

    // Clear input right away
    setInput("");
    setResultData("");
    setLoading(true);
    setShowResult(true);

    // Detect language if not already detected
    const currentLang =
      prompt !== undefined ? detectLanguage(prompt) : detectedLanguage;

    if (prompt !== undefined) {
      setRecentPrompt(prompt);
    } else {
      setPrevPrompts((prev) => [...prev, finalPrompt]);
      setRecentPrompt(finalPrompt);
    }

    try {
      let response;

      // Build conversation context - send the ENTIRE conversation history to Gemini
      let fullConversationPrompt = "";

      if (conversationHistory.length > 0) {
        fullConversationPrompt = "Previous conversation:\n";
        conversationHistory.forEach((msg) => {
          if (msg.role === "user") {
            fullConversationPrompt += `Human: ${msg.content}\n`;
          } else {
            fullConversationPrompt += `Assistant: ${msg.content}\n`;
          }
        });
        fullConversationPrompt += `\nHuman: ${finalPrompt}\nAssistant: `;
      } else {
        // First message in conversation
        fullConversationPrompt = `Human: ${finalPrompt}\nAssistant: `;
        // Update chat title with first message
        updateChatTitle(chatId, finalPrompt);
      }

      // Add language instruction if needed
      if (currentLang !== "en") {
        fullConversationPrompt = `Please respond in Hindi (हिंदी) language only.\n\n${fullConversationPrompt}`;
      }

      console.log("Sending full conversation to API:", fullConversationPrompt);

      if (finalImageFile) {
        console.log("Sending with image");
        response = await runChat(
          fullConversationPrompt,
          finalImageFile,
          currentLang
        );
        setUploadedImage(null);
      } else {
        console.log("Sending text only");
        response = await runChat(fullConversationPrompt, null, currentLang);
      }

      console.log("API Response received:", response);

      if (!response || response.trim() === "") {
        throw new Error("Empty response from API");
      }

      // Add user message to conversation history immediately
      const userMessage = {
        role: "user",
        content: finalPrompt,
        timestamp: new Date().toISOString(),
      };

      const newConversationHistory = [...conversationHistory, userMessage];
      setConversationHistory(newConversationHistory);

      // Format response for typing animation
      const formattedResponse = formatResponse(response);
      let newResponseArray = formattedResponse.split(" ");

      for (let i = 0; i < newResponseArray.length; i++) {
        const nextWord = newResponseArray[i];
        delayPara(i, nextWord + " ");
      }

      // Stop loading immediately after getting response
      setLoading(false);

      // Add AI response to conversation history after typing animation completes
      setTimeout(() => {
        const aiMessage = {
          role: "assistant",
          content: formattedResponse, // Store formatted version
          timestamp: new Date().toISOString(),
        };
        const finalHistory = [...newConversationHistory, aiMessage];
        setConversationHistory(finalHistory);

        // Update chat in chats array
        setChats((prev) =>
          prev.map((chat) =>
            chat.id === chatId
              ? {
                  ...chat,
                  messages: finalHistory,
                  lastUpdated: new Date().toISOString(),
                }
              : chat
          )
        );

        setResultData(""); // Clear the typing animation
      }, newResponseArray.length * 75 + 100);
    } catch (error) {
      console.error("API Error:", error);
      setResultData(
        `Error: ${
          error.message ||
          "Sorry, there was an error processing your request. Please try again."
        }`
      );
      setLoading(false);
    }
  };

  const contextValue = {
    prevPrompts,
    setPrevPrompts,
    onSent,
    recentPrompt,
    setRecentPrompt,
    showResult,
    loading,
    resultData,
    input,
    setInput,
    newChat,
    isListening,
    startVoiceSearch,
    stopVoiceSearch,
    uploadedImage,
    handleImageUpload,
    detectedLanguage,
    isProcessingAudio,
    conversationHistory,
    chats,
    currentChatId,
    switchToChat,
  };
  return (
    <Context.Provider value={contextValue}>{props.children}</Context.Provider>
  );
};

export default ContextProvider;
