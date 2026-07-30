import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaPaperPlane, FaTimes, FaRobot } from "react-icons/fa";
import chatbotService from "../services/chatbotService";
import { supabase } from "../supabaseClient";
import "./Chatbot.css";

const initialMessages = [
  {
    id: 1,
    sender: "bot",
    text: "Hi! I’m Elvre Assistant. I can help you browse products, search FAQs, check orders, and support your shopping experience.",
  },
];

const Chatbot = ({ isOpen = false, setIsOpen = () => {} }) => {
  const [messages, setMessages] = useState(initialMessages);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  useEffect(() => {
    const handleOpenChat = () => setIsOpen(true);
    window.addEventListener("open-elvre-chatbot", handleOpenChat);
    return () => window.removeEventListener("open-elvre-chatbot", handleOpenChat);
  }, [setIsOpen]);

  const quickReplies = ["Show me products", "What are your prices?", "Where is my order?", "Open contact support"];

  const pushMessage = (msg) => setMessages((prev) => [...prev, msg]);

  // helper: safely read current user object from localStorage
  const getCurrentUser = () => {
    try {
      const raw = localStorage.getItem("currentUser");
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      return parsed || null;
    } catch (err) {
      return null;
    }
  };

  // helper: save conversation row to Supabase
  async function saveConversation(userId, role, message) {
    try {
      await supabase.from("chatbot_conversations").insert([
        {
          user_id: userId || null,
          role,
          message,
        },
      ]);
    } catch (err) {
      console.error("saveConversation error:", err);
    }
  }

  const handleSend = async (messageText = input) => {
    const text = (messageText || "").trim();
    if (!text) return;

    const userMessage = { id: Date.now(), sender: "user", text };
    pushMessage(userMessage);
    setInput("");
    setIsTyping(true);
    // save user message to DB (fire-and-forget but await to keep order)
    try {
      const currentUser = getCurrentUser();
      await saveConversation(currentUser?.id || null, "user", text);
    } catch (err) {
      // saving should never block chat; just log
      console.error("Error saving user message:", err);
    }

    try {
      const resp = await chatbotService.getReply(text);
      // small UX delay
      await new Promise((res) => setTimeout(res, 350));

      if (resp && resp.action && resp.action.type === "navigate" && resp.action.to) {
        // allow bot to say something and navigate
        if (resp.text) {
          pushMessage({ id: Date.now() + 1, sender: "bot", text: resp.text });
          // save assistant reply
          try {
            const currentUser = getCurrentUser();
            await saveConversation(currentUser?.id || null, "assistant", resp.text);
          } catch (err) {
            console.error("Error saving assistant message:", err);
          }
        }
        setIsTyping(false);
        navigate(resp.action.to);
        return;
      }

      const botMessage = { id: Date.now() + 1, sender: "bot", text: (resp && resp.text) || "" };
      pushMessage(botMessage);
      // save assistant reply
      try {
        const currentUser = getCurrentUser();
        await saveConversation(currentUser?.id || null, "assistant", botMessage.text);
      } catch (err) {
        console.error("Error saving assistant message:", err);
      }
    } catch (err) {
      console.error("Chatbot handleSend error:", err);
      pushMessage({ id: Date.now() + 1, sender: "bot", text: "Something went wrong. Please try again later." });
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <>
      {isOpen && (
        <div className="chatbot-shell" role="dialog" aria-label="Elvre assistant chat">
          <div className="chatbot-header">
            <div className="chatbot-title-wrap">
              <div className="chatbot-icon">
                <FaRobot />
              </div>
              <div>
                <h3>Elvre Assistant</h3>
                <p>Always here to help</p>
              </div>
            </div>
            <button className="chatbot-close" onClick={() => setIsOpen(false)} aria-label="Close chat">
              <FaTimes />
            </button>
          </div>

          <div className="chatbot-body">
            {messages.map((msg) => (
              <div key={msg.id} className={`chat-bubble ${msg.sender}`}>
                {msg.text}
              </div>
            ))}

            {isTyping && <div className="chat-bubble bot typing">Typing...</div>}
            <div ref={messagesEndRef} />
          </div>

          <div className="chatbot-quick-replies">
            {quickReplies.map((item) => (
              <button key={item} onClick={() => handleSend(item)}>
                {item}
              </button>
            ))}
          </div>

          <div className="chatbot-input-area">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about products, orders, or support..."
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
            />
            <button onClick={() => handleSend()} aria-label="Send message">
              <FaPaperPlane />
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default Chatbot;