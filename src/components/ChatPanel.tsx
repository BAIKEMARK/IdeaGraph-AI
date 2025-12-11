import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Sparkles, Trash2 } from 'lucide-react';
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
    <div className="flex flex-col h-full bg-slate-900">
      {/* Header with Clear Button */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-slate-800">
        <div className="flex items-center gap-2 text-sm text-slate-400">
          <Bot className="w-4 h-4 text-cyan-400" />
          <span>{t('chat_workbench') || '对话工作台'}</span>
        </div>
        <button
          onClick={handleClearChat}
          className="flex items-center gap-1 px-2 py-1 text-xs text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded transition-colors"
          title={t('clear_chat') || '清除聊天记录'}
        >
          <Trash2 className="w-3 h-3" />
          <span>{t('clear_chat') || '清除'}</span>
        </button>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`
              max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed
              ${msg.role === 'user' 
                ? 'bg-indigo-600 text-white rounded-br-none' 
                : 'bg-slate-800 text-slate-200 rounded-bl-none border border-slate-700'
              }
            `}>
              <div className="flex items-center gap-2 mb-1 opacity-70 text-xs font-semibold uppercase tracking-wider">
                {msg.role === 'user' ? <User className="w-3 h-3"/> : <Bot className="w-3 h-3 text-cyan-400"/>}
                <span>{msg.role === 'user' ? t('you') : t('ai_partner')}</span>
              </div>
              <p className="whitespace-pre-wrap">{msg.content}</p>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-slate-800 rounded-2xl rounded-bl-none px-4 py-3 border border-slate-700">
               <div className="flex space-x-1 items-center">
                 <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce" style={{animationDelay: '0ms'}}></div>
                 <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce" style={{animationDelay: '150ms'}}></div>
                 <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce" style={{animationDelay: '300ms'}}></div>
               </div>
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="p-4 bg-slate-900 border-t border-slate-800">
        <div className="relative">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={t('chat_placeholder')}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-4 pr-12 py-3 text-sm text-slate-200 focus:ring-2 focus:ring-indigo-500 focus:outline-none resize-none scrollbar-hide"
            rows={1}
            style={{ minHeight: '44px', maxHeight: '120px' }}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className="absolute right-2 bottom-2 p-1.5 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-700 text-white rounded-lg transition-colors"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
        <div className="mt-2 flex items-center justify-between text-xs text-slate-600">
           <div className="flex items-center space-x-1">
             <Sparkles className="w-3 h-3 text-amber-500" />
             <span>{t('rag_support')}</span>
           </div>
           <span>{t('shift_enter')}</span>
        </div>
      </div>
    </div>
  );
};
