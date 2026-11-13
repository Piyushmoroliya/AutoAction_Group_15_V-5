import { useState, useRef, useEffect } from 'react';
import { Card, CardContent } from '../../components/common/Card';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import { Send, Bot, User, Sparkles, RefreshCw } from 'lucide-react';
import { chatService, type ChatMessage } from '../../services/assistant';
import { toast } from 'sonner';

const SUGGESTED_QUESTIONS = [
  'What assignments do I have this week?',
  'How much did I spend this month?',
  'What exam is next?',
];

export default function AssistantPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadChatHistory();
  }, []);

  const loadChatHistory = async () => {
    try {
      setIsLoadingHistory(true);
      const history = await chatService.listMessages();
      setMessages(history);
    } catch (error) {
      console.error('Failed to load chat history:', error);
      // If no history, add welcome message
      setMessages([
        {
          id: 0,
          user_id: 0,
          role: 'assistant',
          content: "Hello! I'm your AI assistant. I can help you with your assignments, academic materials, expenses, and more. What would you like to know?",
          created_at: new Date().toISOString(),
        },
      ]);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage = {
      role: 'user' as const,
      content: input,
    };

    setMessages((prev) => [...prev, { ...userMessage, id: 0, user_id: 0, created_at: new Date().toISOString() }]);
    setInput('');
    setIsLoading(true);

    try {
      // Save user message
      await chatService.createMessage(userMessage);

      // Generate a simple response (in production, this would call an AI service)
      // For now, we'll create a placeholder response
      const assistantMessage = {
        role: 'assistant' as const,
        content: "I'm currently in demo mode. In the full implementation, I would analyze your data and provide contextual answers. For now, you can use the other pages to manage your captures, tasks, and expenses.",
      };

      await chatService.createMessage(assistantMessage);

      setMessages((prev) => [
        ...prev,
        { ...assistantMessage, id: 0, user_id: 0, created_at: new Date().toISOString() },
      ]);
    } catch (error: any) {
      console.error('Failed to send message:', error);
      toast.error(error.response?.data?.detail || 'Failed to send message');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearHistory = async () => {
    try {
      await chatService.clearHistory();
      setMessages([
        {
          id: 0,
          user_id: 0,
          role: 'assistant',
          content: "Chat history cleared. How can I help you?",
          created_at: new Date().toISOString(),
        },
      ]);
      toast.success('Chat history cleared');
    } catch (error: any) {
      console.error('Failed to clear history:', error);
      toast.error(error.response?.data?.detail || 'Failed to clear history');
    }
  };

  const handleSuggestedQuestion = (question: string) => {
    setInput(question);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (isLoadingHistory) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <RefreshCw className="h-8 w-8 text-navy-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-navy-900 dark:text-white">
            AI Assistant
          </h1>
          <p className="text-navy-500 dark:text-navy-400 mt-1">
            Ask questions about your captures, tasks, and academic materials
          </p>
        </div>
        <Button variant="outline" onClick={handleClearHistory}>
          Clear History
        </Button>
      </div>

      {/* Chat Container */}
      <Card className="flex-1 flex flex-col overflow-hidden">
        <CardContent className="flex-1 overflow-y-auto p-4">
          <div className="space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`flex items-start space-x-2 max-w-[80%] ${
                    message.role === 'user' ? 'flex-row-reverse space-x-reverse' : ''
                  }`}
                >
                  <div
                    className={`flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center ${
                      message.role === 'user'
                        ? 'bg-primary-600'
                        : 'bg-navy-200 dark:bg-navy-700'
                    }`}
                  >
                    {message.role === 'user' ? (
                      <User className="h-4 w-4 text-white" />
                    ) : (
                      <Bot className="h-4 w-4 text-navy-600 dark:text-navy-300" />
                    )}
                  </div>
                  <div
                    className={`rounded-lg px-4 py-2 ${
                      message.role === 'user'
                        ? 'bg-primary-600 text-white'
                        : 'bg-navy-100 dark:bg-navy-800 text-navy-900 dark:text-white'
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                    <p className="text-xs mt-1 opacity-70">
                      {new Date(message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="flex items-start space-x-2">
                  <div className="flex-shrink-0 h-8 w-8 rounded-full bg-navy-200 dark:bg-navy-700 flex items-center justify-center">
                    <Bot className="h-4 w-4 text-navy-600 dark:text-navy-300" />
                  </div>
                  <div className="bg-navy-100 dark:bg-navy-800 rounded-lg px-4 py-2">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-navy-400 rounded-full animate-bounce" />
                      <div className="w-2 h-2 bg-navy-400 rounded-full animate-bounce delay-100" />
                      <div className="w-2 h-2 bg-navy-400 rounded-full animate-bounce delay-200" />
                    </div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </CardContent>

        {/* Suggested Questions */}
        {messages.length <= 1 && (
          <div className="px-4 pb-2">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="h-4 w-4 text-primary-600" />
              <span className="text-sm font-medium text-navy-700 dark:text-navy-300">Suggested questions</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {SUGGESTED_QUESTIONS.map((question) => (
                <button
                  key={question}
                  onClick={() => handleSuggestedQuestion(question)}
                  className="text-xs px-3 py-1.5 rounded-full bg-navy-100 dark:bg-navy-800 text-navy-700 dark:text-navy-300 hover:bg-navy-200 dark:hover:bg-navy-700 transition-colors"
                >
                  {question}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Input Area */}
        <div className="p-4 border-t border-navy-200 dark:border-navy-700">
          <div className="flex space-x-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask me anything..."
              className="flex-1"
            />
            <Button onClick={handleSend} disabled={!input.trim() || isLoading}>
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
