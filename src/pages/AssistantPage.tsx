import React, { useState, useRef, useEffect } from 'react';
import { Send, Mic, MicOff, Bot, User } from 'lucide-react';
import { ChatMessage } from '../types';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase/config';

// --- Groq API integration ---
// REMOVE: import Groq from 'groq-sdk';
// REMOVE: import type { ChatCompletionMessageParam } from 'groq-sdk/resources/chat/completions.js';

const GROQ_API_KEY = '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';
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

async function fetchGroqChat(messages: {role: string, content: string}[]) {
  const response = await fetch(GROQ_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${GROQ_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'llama3-8b-8192',
      messages,
      max_tokens: 512,
      temperature: 0.7,
    }),
  });
  if (!response.ok) {
    throw new Error('Groq API error: ' + response.statusText);
  }
  const data = await response.json();
  return data.choices?.[0]?.message?.content || 'No response from Groq';
}

// Add translation helper
async function translateText(text: string, targetLang: string, sourceLang?: string): Promise<string> {
  if (targetLang === 'English') return text;
  // Map dropdown language to LibreTranslate codes
  const langMap: Record<string, string> = {
    English: 'en',
    Hindi: 'hi',
    Tamil: 'ta',
    Malayalam: 'ml',
    Telugu: 'te',
    Kannada: 'kn',
  };
  const to = langMap[targetLang] || 'en';
  const from = sourceLang ? langMap[sourceLang] : 'auto';
  try {
    const res = await fetch('https://libretranslate.de/translate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ q: text, source: from, target: to, format: 'text' })
    });
    const data = await res.json();
    return data.translatedText || text;
  } catch {
    return text;
  }
}

// Helper to check if user is asking for a bus from X to Y
function parseBusQuery(text: string) {
  // e.g. 'bus from City Center to Airport' or 'buses from X to Y'
  const match = text.match(/bus(?:es)? from ([\w\s]+) to ([\w\s]+)/i);
  if (match) {
    return { from: match[1].trim(), to: match[2].trim() };
  }
  return null;
}

const AssistantPage: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      content: "Hello! I'm your AI travel assistant. I can help you book tickets, find routes, track buses, and answer questions about public transport. Try saying something like 'Book a ticket from City Center to Airport' or 'When is the next bus to Downtown?'",
      isUser: false,
      timestamp: new Date()
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);
  const [language, setLanguage] = useState('English');

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    // Initialize speech recognition
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = 'en-US';

      recognitionRef.current.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInputValue(transcript);
        setIsListening(false);
      };

      recognitionRef.current.onerror = () => {
        setIsListening(false);
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    }
  }, []);

  // Remove processMessage, replace with Groq API call
  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      content: inputValue,
      isUser: true,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsTyping(true);

    try {
      // Check for bus route query
      const busQuery = parseBusQuery(inputValue);
      if (busQuery) {
        // Search Firestore buses
        const snap = await getDocs(collection(db, 'buses'));
        const buses = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        const found = buses.filter(b =>
          b.start && b.end &&
          b.start.toLowerCase().includes(busQuery.from.toLowerCase()) &&
          b.end.toLowerCase().includes(busQuery.to.toLowerCase())
        );
        let reply = '';
        if (found.length > 0) {
          reply = `Buses from ${busQuery.from} to ${busQuery.to} (from live data):\n` +
            found.map(b => `• ${b.name || b.number} (Capacity: ${b.capacity}${b.accessible ? ', Wheelchair Accessible' : ''})`).join('\n');
          // Optionally, fetch timings for each bus
        } else {
          reply = `Sorry, no buses found from ${busQuery.from} to ${busQuery.to}.`;
        }
        setMessages(prev => [...prev, { id: (Date.now() + 1).toString(), content: reply, isUser: false, timestamp: new Date() }]);
        setIsTyping(false);
        return;
      }
      // Translate user input if needed
      const translatedInput = await translateText(inputValue, language);
      const groqMessages = [
        { role: 'system', content: `You are an AI travel assistant. Respond in ${language}. Help users with public transport, bus tracking, booking, and schedules.` },
        ...messages.map(m => ({
          role: m.isUser ? 'user' : 'assistant',
          content: m.content
        })),
        { role: 'user', content: translatedInput }
      ];
      const aiContent = await fetchGroqChat(groqMessages);
      // Translate AI output back to English if needed
      let finalContent = aiContent;
      if (language !== 'English') {
        finalContent = await translateText(aiContent, 'English', language);
      }
      const aiResponse: ChatMessage = {
        id: (Date.now() + 1).toString(),
        content: finalContent,
        isUser: false,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, aiResponse]);
    } catch (err: any) {
      const aiResponse: ChatMessage = {
        id: (Date.now() + 1).toString(),
        content: err.message || 'Error contacting Groq API',
        isUser: false,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, aiResponse]);
    } finally {
      setIsTyping(false);
    }
  };

  const startListening = () => {
    if (recognitionRef.current) {
      setIsListening(true);
      recognitionRef.current.start();
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
    }
  };

  const quickPrompts = [
    "Book a ticket from City Center to Airport",
    "Find the next bus to Downtown",
    "What are the ticket prices?",
    "Show me bus schedules",
    "Track buses near me"
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            AI Travel Assistant
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Get instant help with booking, tracking, and travel information using natural language.
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 overflow-hidden flex flex-col h-[600px]">
          {/* Chat Messages */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4" style={{ minHeight: 0 }}>
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.isUser ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`flex max-w-xs lg:max-w-md space-x-3 ${message.isUser ? 'flex-row-reverse space-x-reverse' : ''}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${message.isUser ? 'bg-blue-600' : 'bg-gray-600'}`}>
                    {message.isUser ? (
                      <User className="h-4 w-4 text-white" />
                    ) : (
                      <Bot className="h-4 w-4 text-white" />
                    )}
                  </div>
                  <div
                    className={`px-4 py-2 rounded-lg ${
                      message.isUser
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white'
                    }`}
                  >
                    <div className="text-sm whitespace-pre-line">{message.content}</div>
                    <div className={`text-xs mt-1 ${message.isUser ? 'text-blue-100' : 'text-gray-500 dark:text-gray-400'}`}>
                      {message.timestamp.toLocaleTimeString()}
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {isTyping && (
              <div className="flex justify-start">
                <div className="flex space-x-3">
                  <div className="w-8 h-8 rounded-full bg-gray-600 flex items-center justify-center">
                    <Bot className="h-4 w-4 text-white" />
                  </div>
                  <div className="bg-gray-100 dark:bg-gray-700 px-4 py-2 rounded-lg">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Prompts */}
          <div className="border-t border-gray-200 dark:border-gray-700 p-4">
            <div className="flex flex-wrap gap-2 mb-4">
              {quickPrompts.map((prompt, index) => (
                <button
                  key={index}
                  onClick={() => setInputValue(prompt)}
                  className="px-3 py-1 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                >
                  {prompt}
                </button>
              ))}
            </div>

            {/* Input Area - sticky at bottom */}
            <div className="flex space-x-4 sticky bottom-0 bg-white dark:bg-gray-800 pt-2 pb-1 z-10">
              <div className="flex justify-end mb-2">
                <select
                  value={language}
                  onChange={e => setLanguage(e.target.value)}
                  className="px-2 py-1 rounded border bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600 text-sm focus:outline-none"
                  title="Select language"
                  aria-label="Select language"
                >
                  <option value="English">English</option>
                  <option value="Hindi">Hindi</option>
                  <option value="Tamil">Tamil</option>
                  <option value="Malayalam">Malayalam</option>
                  <option value="Telugu">Telugu</option>
                  <option value="Kannada">Kannada</option>
                </select>
              </div>
              <div className="flex-1 relative">
                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSendMessage())}
                  placeholder="Type your message or use voice input..."
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white pr-12"
                />
                <button
                  onClick={isListening ? stopListening : startListening}
                  className={`absolute right-3 top-1/2 transform -translate-y-1/2 p-1 rounded-full transition-colors ${
                    isListening 
                      ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400' 
                      : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
                  }`}
                  title={isListening ? 'Stop Listening' : 'Start Voice Input'}
                  aria-label={isListening ? 'Stop Listening' : 'Start Voice Input'}
                >
                  {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                </button>
              </div>
              <button
                onClick={handleSendMessage}
                disabled={!inputValue.trim()}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                title="Send"
                aria-label="Send"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
            <div className="mt-2 text-xs text-gray-500 dark:text-gray-400 text-center">
              {isListening ? (
                <span className="text-red-600 dark:text-red-400">🎤 Listening...</span>
              ) : (
                <span>Press and hold the microphone to use voice input</span>
              )}
            </div>
          </div>
        </div>
        <div className="mb-2 text-xs text-gray-500 dark:text-gray-400 text-right">
          {language !== 'English' ? (
            <span>Auto-translation enabled: Your message and AI replies will be translated to and from {language}.</span>
          ) : (
            <span>Type in any language. AI will reply in English.</span>
          )}
        </div>
      </div>
    </div>
  );
};

export default AssistantPage;