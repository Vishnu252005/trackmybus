import React, { useState, useRef, useEffect } from 'react';
import { Send, Mic, MicOff, Bot, User } from 'lucide-react';
import { ChatMessage } from '../types';

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

  const processMessage = (message: string): string => {
    const lowerMessage = message.toLowerCase();

    // Booking keywords
    if (lowerMessage.includes('book') && lowerMessage.includes('ticket')) {
      return "I can help you book a ticket! To proceed, I'll need:\n\n• Starting location\n• Destination\n• Preferred date and time\n\nWould you like me to redirect you to our booking page, or can you provide these details now?";
    }

    // Route finding keywords
    if (lowerMessage.includes('route') || lowerMessage.includes('direction')) {
      return "I can help you find the best route! Our route finder can show you:\n\n• Shortest path between locations\n• Real-time traffic updates\n• Multiple route options\n• Estimated travel times\n\nShall I take you to the route finder, or do you have specific locations in mind?";
    }

    // Bus tracking keywords
    if (lowerMessage.includes('track') || lowerMessage.includes('where') || lowerMessage.includes('bus location')) {
      return "I can help you track buses in real-time! Our tracking system shows:\n\n• Live bus locations\n• Estimated arrival times\n• Route information\n• Bus capacity\n\nWould you like to see the live tracking map, or are you looking for a specific bus?";
    }

    // Next bus keywords
    if (lowerMessage.includes('next bus') || lowerMessage.includes('when')) {
      return "Based on current schedules, here are the next departures:\n\n🚌 **City Center to Airport**: 15 mins (Bus B101)\n🚌 **Downtown to University**: 8 mins (Bus B205)\n🚌 **Mall to Residential**: 22 mins (Bus B312)\n\nWould you like more details about any of these routes?";
    }

    // Payment/price keywords
    if (lowerMessage.includes('price') || lowerMessage.includes('cost') || lowerMessage.includes('payment')) {
      return "Here are our current ticket prices:\n\n💰 **City Center to Airport**: $12.50\n💰 **Downtown to University**: $4.75\n💰 **Mall to Residential**: $6.25\n\nWe accept all major credit cards and digital payments. Senior citizens and students get 20% off!";
    }

    // Schedule keywords
    if (lowerMessage.includes('schedule') || lowerMessage.includes('timetable')) {
      return "Our buses run from 6:00 AM to 11:00 PM daily with:\n\n⏰ **Peak hours** (7-9 AM, 5-7 PM): Every 10-15 minutes\n⏰ **Regular hours**: Every 20-30 minutes\n⏰ **Late evening**: Every 45 minutes\n\nWould you like the detailed schedule for a specific route?";
    }

    // Default response
    return "I understand you're asking about public transport. I can help you with:\n\n• **Booking tickets** - Say 'book a ticket'\n• **Finding routes** - Say 'find route'\n• **Tracking buses** - Say 'track buses'\n• **Schedule information** - Say 'bus schedule'\n• **Pricing** - Say 'ticket prices'\n\nWhat would you like help with today?";
  };

  const handleSendMessage = () => {
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

    // Simulate AI response delay
    setTimeout(() => {
      const aiResponse: ChatMessage = {
        id: (Date.now() + 1).toString(),
        content: processMessage(inputValue),
        isUser: false,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, aiResponse]);
      setIsTyping(false);
    }, 1000 + Math.random() * 1000);
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

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 overflow-hidden">
          {/* Chat Messages */}
          <div className="h-96 overflow-y-auto p-6 space-y-4">
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

            {/* Input Area */}
            <div className="flex space-x-4">
              <div className="flex-1 relative">
                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
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
                >
                  {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                </button>
              </div>
              <button
                onClick={handleSendMessage}
                disabled={!inputValue.trim()}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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
      </div>
    </div>
  );
};

export default AssistantPage;