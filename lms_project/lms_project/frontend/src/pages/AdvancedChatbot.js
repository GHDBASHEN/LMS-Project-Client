import React, { useState, useRef, useEffect } from "react";
import "./AdvancedChatbot.css";

function App() {
  const [messages, setMessages] = useState([
    { text: "👋 Hi! I'm your LMS Chatbot powered by Google Gemini 2.0 Flash. How can I help you with courses, assignments, or technical issues today?", sender: "bot" },
  ]);
  const [input, setInput] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Your working API key and endpoint
  const GEMINI_API_KEY = "AIzaSyBwmnHlq_p2CNwC5WFrO8Yo_S4qVM-b4cY";
  const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`;

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = { text: input, sender: "user" };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    setMessages((prev) => [...prev, { text: "⌨️ Gemini is thinking...", sender: "bot" }]);

    try {
      const response = await fetch(GEMINI_API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: `You are an LMS (Learning Management System) assistant chatbot. Help students with:

COURSE SUPPORT:
- Finding and accessing course materials
- Understanding course structure and modules
- Navigating learning resources

ASSIGNMENT HELP:
- Submission procedures and deadlines
- Understanding assignment requirements
- Technical issues with submissions

GRADES & FEEDBACK:
- Checking grades and feedback
- Understanding grading criteria
- Missing grade inquiries

TECHNICAL ISSUES:
- Platform navigation problems
- File upload difficulties
- Login and access issues
- Browser compatibility

GENERAL GUIDANCE:
- Communication with instructors
- Using discussion forums
- Mobile app functionality
- Best practices for online learning

Be friendly, patient, and educational. Provide clear, step-by-step guidance when needed. Keep responses helpful but concise.

Current student question: ${input}`
            }]
          }],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 1024,
            topP: 0.8,
            topK: 40
          },
          safetySettings: [
            {
              category: "HARM_CATEGORY_HARASSMENT",
              threshold: "BLOCK_MEDIUM_AND_ABOVE"
            },
            {
              category: "HARM_CATEGORY_HATE_SPEECH", 
              threshold: "BLOCK_MEDIUM_AND_ABOVE"
            }
          ]
        }),
      });

      console.log("API Response Status:", response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error("API Error Response:", errorText);
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      console.log("Gemini API Success:", data);

      const botReply = data.candidates?.[0]?.content?.parts?.[0]?.text 
        || "I understand your question. How can I assist you further with your LMS needs?";

      // Remove typing indicator and add bot response
      setMessages((prev) => {
        const updated = prev.slice(0, -1);
        return [...updated, { text: botReply, sender: "bot" }];
      });

    } catch (err) {
      console.error("Gemini API Error:", err);
      
      setMessages((prev) => {
        const updated = prev.slice(0, -1);
        let errorMessage = "";
        
        if (err.message.includes("API key") || err.message.includes("API_KEY")) {
          errorMessage = "🔑 API Key Issue: Please check your Gemini API key configuration.";
        } else if (err.message.includes("quota") || err.message.includes("rate limit")) {
          errorMessage = "📊 API Quota: You may have exceeded the free tier limits. Try again later.";
        } else if (err.message.includes("network") || err.message.includes("fetch")) {
          errorMessage = "🌐 Network Error: Please check your internet connection.";
        } else {
          errorMessage = `⚠️ Error: ${err.message}. Please try again.`;
        }
        
        return [...updated, { text: errorMessage, sender: "bot" }];
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const clearChat = () => {
    setMessages([
      { text: "👋 Hi! I'm your LMS Chatbot powered by Google Gemini 2.0 Flash. How can I help you with courses, assignments, or technical issues today?", sender: "bot" }
    ]);
  };

  const testAPI = async () => {
    console.log("Testing Gemini API...");
    try {
      const response = await fetch(GEMINI_API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: "Say 'API Test Successful' in a creative way"
            }]
          }]
        }),
      });
      const data = await response.json();
      console.log("API Test Result:", data);
    } catch (error) {
      console.error("API Test Failed:", error);
    }
  };

  // Test API on component mount
  useEffect(() => {
    testAPI();
  }, []);

  return (
    <div className="app">
      <button 
        className={`chat-toggle ${isOpen ? 'active' : ''}`} 
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? '✕' : '🤖'}
      </button>

      {isOpen && (
        <div className="chat-container">
          <div className="chat-header">
            <div className="header-title">
              <h3>LMS Assistant ⚡</h3>
              
            </div>
            <div className="chat-actions">
              <button className="clear-btn" onClick={clearChat}>Clear</button>
              <button className="close-btn" onClick={() => setIsOpen(false)}>✕</button>
            </div>
          </div>

          <div className="chat-box">
            {messages.map((msg, index) => (
              <div key={index} className={`message ${msg.sender}`}>
                <div className="message-content">
                  {msg.text}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          <div className="input-area">
            <div className="input-container">
              <input
                type="text"
                placeholder="Ask about courses, assignments, grades, or technical help..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                disabled={isLoading}
              />
              <button 
                onClick={sendMessage}
                disabled={isLoading || !input.trim()}
                className="send-btn"
              >
                {isLoading ? '⏳' : '🚀'}
              </button>
            </div>
            <div className="chat-footer">
              <small>Powered by Google Gemini 2.0 Flash • Real AI Responses</small>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;