import React, { useState, useRef, useEffect } from 'react';
import { Send, User, Sparkles, Trash2 } from 'lucide-react';
import { Idea, ChatMessage } from '@/types/types';
import { chatWithIdea, clearChatHistory } from '@/services/apiService';
import { v4 as uuidv4 } from 'uuid';
import { useLanguage } from '@/contexts/LanguageContext';

interface ChatPanelProps {
  idea: Idea;
  onUpdateIdea: (updates: any) => void;
}

export const ChatPanel: React.FC<ChatPanelProps> = ({ idea, onUpdateIdea }) => {
  const { t } = useLanguage();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Load chat history when idea changes
  useEffect(() => {
    if (idea.chat_history && idea.chat_history.length > 0) {
      // Load existing chat history
      setMessages(idea.chat_history.map(msg => ({
        ...msg,
        timestamp: typeof msg.timestamp === 'string' ? new Date(msg.timestamp) : msg.timestamp
      })));
    } else {
      // Initialize with welcome message
      setMessages([{
        id: 'init',
        role: 'model',
        content: t('chat_init', idea.distilled_data.one_liner),
        timestamp: new Date()
      }]);
    }
  }, [idea.idea_id]); // 只依赖 idea_id，避免因翻译函数变化导致重置

  // Auto scroll
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMsg: ChatMessage = {
      id: uuidv4(),
      role: 'user',
      content: input,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const history = messages.map(m => ({ role: m.role, text: m.content }));
      history.push({ role: 'user', text: userMsg.content });

      const response = await chatWithIdea(history, idea);

      const aiMsg: ChatMessage = {
        id: uuidv4(),
        role: 'model',
        content: response.text,
        timestamp: new Date()
      };
      const updatedMessages = [...messages, userMsg, aiMsg];
      setMessages(updatedMessages);
      
      // Save chat history to idea
      onUpdateIdea({ chat_history: updatedMessages });

      // Handle evolution suggestions
      if (response.evolution_suggestion && response.evolution_suggestion.message) {
        // Add evolution suggestion as a system message
        const suggestionMsg: ChatMessage = {
          id: uuidv4(),
          role: 'model',
          content: `💡 ${response.evolution_suggestion.message}`,
          timestamp: new Date()
        };
        setMessages(prev => [...prev, suggestionMsg]);
      }
    } catch (err) {
      console.error(err);
      // Optional: Add error message to chat
      setMessages(prev => [...prev, {
          id: uuidv4(),
          role: 'model',
          content: t('error_connect'),
          timestamp: new Date()
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleClearChat = async () => {
    if (!confirm(t('confirm_clear_chat') || '确定要清除聊天记录吗？')) {
      return;
    }

    try {
      await clearChatHistory(idea.idea_id);
      
      // Reset to initial welcome message
      const welcomeMsg: ChatMessage = {
        id: 'init',
        role: 'model',
        content: t('chat_init', idea.distilled_data.one_liner),
        timestamp: new Date()
      };
      setMessages([welcomeMsg]);
      
      // Update idea to remove chat history
      onUpdateIdea({ chat_history: [] });
      
      console.log('✅ Chat history cleared');
    } catch (error) {
      console.error('Failed to clear chat history:', error);
      alert(t('error_clear_chat') || '清除聊天记录失败');
    }
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header with Clear Button */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-white/5 bg-zinc-900/50">
        <div className="flex items-center gap-2 text-xs text-zinc-400">
          <span>{t('chat_workbench') || 'AI Assistant'}</span>
        </div>
        <button
          onClick={handleClearChat}
          className="flex items-center gap-1 px-2 py-1 text-xs text-zinc-400 hover:text-red-400 hover:bg-zinc-800/50 rounded transition-all active:scale-95"
          title={t('clear_chat') || '清除聊天记录'}
        >
          <Trash2 className="w-3 h-3" />
          <span>{t('clear_chat') || '清除'}</span>
        </button>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 bg-zinc-950/20">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div className="flex gap-3 max-w-[85%]">
              {msg.role !== 'user' && (
                <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center border border-purple-500/30 flex-shrink-0 mt-1">
                  <Sparkles className="w-4 h-4 text-purple-400" />
                </div>
              )}
              <div className={`
                rounded-xl px-4 py-3 text-sm leading-relaxed
                ${msg.role === 'user' 
                  ? 'bg-purple-600 text-white rounded-br-sm shadow-lg' 
                  : 'bg-zinc-800/50 text-zinc-300 rounded-tl-sm border border-white/10 backdrop-blur-sm'
                }
              `}>
                <p className="whitespace-pre-wrap">{msg.content}</p>
              </div>
              {msg.role === 'user' && (
                <div className="w-8 h-8 rounded-full bg-zinc-700/50 flex items-center justify-center border border-zinc-600/50 flex-shrink-0 mt-1">
                  <User className="w-4 h-4 text-zinc-400" />
                </div>
              )}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="flex gap-3 max-w-[85%]">
              <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center border border-purple-500/30 flex-shrink-0">
                <Sparkles className="w-4 h-4 text-purple-400" />
              </div>
              <div className="bg-zinc-800/50 rounded-xl rounded-tl-sm px-4 py-3 border border-white/10 backdrop-blur-sm">
                <div className="flex space-x-1 items-center">
                  <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{animationDelay: '0ms'}}></div>
                  <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{animationDelay: '150ms'}}></div>
                  <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{animationDelay: '300ms'}}></div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="p-4 border-t border-white/5 bg-zinc-900/50">
        <div className="relative">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={t('chat_placeholder') || '输入一个想法...'}
            className="w-full bg-zinc-950/50 border border-white/10 rounded-xl pl-4 pr-12 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all resize-none scrollbar-hide placeholder-zinc-500"
            rows={2}
            style={{ minHeight: '60px', maxHeight: '140px' }}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className="absolute right-2 top-2 p-1.5 bg-purple-600 hover:bg-purple-500 disabled:bg-zinc-700 disabled:opacity-50 text-white rounded-lg transition-all active:scale-95"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
        <div className="mt-2 flex items-center justify-between text-xs text-zinc-500">
           <div className="flex items-center space-x-1">
             <Sparkles className="w-3 h-3 text-amber-500" />
             <span>{t('rag_support') || 'AI 增强对话'}</span>
           </div>
           <span>{t('shift_enter') || 'Shift + Enter 换行'}</span>
        </div>
      </div>
    </div>
  );
};
