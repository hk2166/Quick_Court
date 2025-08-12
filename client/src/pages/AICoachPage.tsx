import React, { useState } from 'react';
import { Brain, Send, Loader2 } from 'lucide-react';

interface AIResponse {
  text: string;
  timestamp: Date;
}

const AICoachPage: React.FC = () => {
  const [userInput, setUserInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [conversation, setConversation] = useState<AIResponse[]>([{
    text: "Hi there! I'm your AI sports coach. Ask me anything about techniques, training, or sports strategies!",
    timestamp: new Date()
  }]);

  const callGeminiAPI = async (prompt: string) => {
    const apiKey = 'AIzaSyDNNN6PECwTBPzSQqM7nOkblJms8NWgo0Q';
    const url = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';
    
    const requestBody = {
      contents: [
        {
          parts: [
            {
              text: prompt
            }
          ]
        }
      ]
    };

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-goog-api-key': apiKey
        },
        body: JSON.stringify(requestBody)
      });

      if (response.ok) {
        const data = await response.json();
        if (data.candidates && data.candidates[0] && data.candidates[0].content) {
          const aiResponse = data.candidates[0].content.parts[0].text;
          return aiResponse;
        } else {
          return "I couldn't generate a response. Please try again.";
        }
      } else {
        const errorData = await response.text();
        console.error('API Error:', response.status, errorData);
        return "Sorry, I encountered an error. Please try again later.";
      }
    } catch (error) {
      console.error('Network Error:', error);
      return "Sorry, there was a network error. Please check your connection and try again.";
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userInput.trim()) return;

    // Add user message to conversation
    const userMessage = {
      text: userInput,
      timestamp: new Date()
    };
    setConversation(prev => [...prev, userMessage]);
    setUserInput('');
    setIsLoading(true);

    try {
      // Enhance the prompt with sports coaching context
      const enhancedPrompt = `As an AI sports coach, please provide advice on: ${userInput}`;
      const aiResponseText = await callGeminiAPI(enhancedPrompt);
      
      // Add AI response to conversation
      const aiResponse = {
        text: aiResponseText,
        timestamp: new Date()
      };
      setConversation(prev => [...prev, aiResponse]);
    } catch (error) {
      console.error('Error getting AI response:', error);
      setConversation(prev => [...prev, {
        text: "Sorry, I encountered an error. Please try again later.",
        timestamp: new Date()
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-center justify-center mb-8">
        <div className="p-3 bg-purple-600 rounded-full mr-3">
          <Brain className="h-8 w-8 text-white" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900">AI Sports Coach</h1>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {/* Conversation Display */}
        <div className="h-[500px] overflow-y-auto p-6 space-y-4">
          {conversation.map((message, index) => (
            <div 
              key={index} 
              className={`flex ${index % 2 === 0 ? 'justify-start' : 'justify-end'}`}
            >
              <div 
                className={`max-w-[80%] rounded-lg p-4 ${index % 2 === 0 
                  ? 'bg-purple-100 text-gray-800' 
                  : 'bg-blue-600 text-white'}`}
              >
                <p className="whitespace-pre-wrap">{message.text}</p>
                <p className="text-xs mt-2 opacity-70">
                  {message.timestamp.toLocaleTimeString()}
                </p>
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="max-w-[80%] rounded-lg p-4 bg-purple-100 text-gray-800">
                <div className="flex items-center">
                  <Loader2 className="h-5 w-5 animate-spin mr-2" />
                  <p>Thinking...</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Input Form */}
        <div className="border-t border-gray-200 p-4">
          <form onSubmit={handleSubmit} className="flex items-center">
            <input
              type="text"
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              placeholder="Ask your sports coach anything..."
              className="flex-1 p-3 border border-gray-300 rounded-l-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              disabled={isLoading}
            />
            <button
              type="submit"
              className="bg-purple-600 text-white p-3 rounded-r-lg hover:bg-purple-700 transition-colors disabled:bg-purple-400"
              disabled={isLoading || !userInput.trim()}
            >
              {isLoading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Send className="h-5 w-5" />
              )}
            </button>
          </form>
        </div>
      </div>

      <div className="mt-8 bg-gray-50 rounded-lg p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">How AI Coaching Works</h2>
        <p className="text-gray-600 mb-4">
          Our AI sports coach uses Google's Gemini 2.0 Flash model to provide personalized advice on:
        </p>
        <ul className="list-disc pl-5 space-y-2 text-gray-600">
          <li>Technique improvements for various sports</li>
          <li>Training regimens and workout plans</li>
          <li>Game strategies and tactical advice</li>
          <li>Injury prevention and recovery tips</li>
          <li>Mental preparation and sports psychology</li>
        </ul>
        <p className="text-gray-600 mt-4">
          While our AI coach provides valuable insights, always consult with professional coaches or healthcare providers for personalized advice.
        </p>
      </div>
    </div>
  );
};

export default AICoachPage;