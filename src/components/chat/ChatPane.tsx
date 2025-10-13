import { useState, useRef, useEffect } from 'react';
import { Send, Sparkles, MapPin, BarChart3, Download } from 'lucide-react';
import type { ChatMessage } from '../../types';
import { GradientButton } from '../ui/GradientButton';

interface ChatPaneProps {
  messages: ChatMessage[];
  onSendMessage: (content: string) => void;
  isProcessing: boolean;
}

export function ChatPane({ messages, onSendMessage, isProcessing }: ChatPaneProps) {
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !isProcessing) {
      onSendMessage(input.trim());
      setInput('');
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    e.target.style.height = 'auto';
    e.target.style.height = `${Math.min(e.target.scrollHeight, 200)}px`;
  };

  const quickActions = [
    { label: 'Show map 🗺️', action: 'Show me the verification map' },
    { label: 'Explain clusters 📍', action: 'Explain the location clusters' },
    { label: 'Outliers 🚩', action: 'Show me the outliers' },
    { label: 'Export PDF 📄', action: 'Export this report as PDF' },
  ];

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {messages.length === 0 && (
          <div className="text-center py-12">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-brand flex items-center justify-center shadow-glow">
              <Sparkles className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
              FlowSwitch Analyst
            </h3>
            <p className="text-slate-600 dark:text-slate-400 max-w-md mx-auto">
              Ask me anything about this agent's verification patterns, location consistency, or movement behavior.
            </p>
            <div className="flex flex-wrap gap-2 justify-center mt-6">
              {quickActions.map((qa) => (
                <button
                  key={qa.label}
                  onClick={() => onSendMessage(qa.action)}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-sm text-slate-700 dark:text-slate-300 transition-colors"
                >
                  {qa.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex gap-4 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {message.role === 'analyst' && (
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-brand flex items-center justify-center shadow-glow">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
            )}

            <div
              className={`flex-1 max-w-3xl ${
                message.role === 'user'
                  ? 'bg-brand-green/10 border-brand-green/20'
                  : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700'
              } border rounded-2xl p-4 shadow-soft`}
            >
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                  {message.role === 'user' ? 'You' : 'FlowSwitch Analyst'}
                </span>
                <span className="text-xs text-slate-500 dark:text-slate-500">
                  {new Date(message.timestamp).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </div>

              <div className="prose prose-sm dark:prose-invert max-w-none">
                <div
                  className="text-slate-900 dark:text-slate-100 whitespace-pre-wrap"
                  dangerouslySetInnerHTML={{ __html: formatMarkdown(message.content) }}
                />
              </div>

              {message.actionChips && message.actionChips.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                  {message.actionChips.map((chip, idx) => (
                    <button
                      key={idx}
                      onClick={() => onSendMessage(chip.action)}
                      className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-xs font-medium text-slate-700 dark:text-slate-300 transition-colors"
                    >
                      {chip.icon && getIcon(chip.icon)}
                      {chip.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {message.role === 'user' && (
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-slate-700 dark:text-slate-300 font-semibold text-sm">
                U
              </div>
            )}
          </div>
        ))}

        {isProcessing && (
          <div className="flex gap-4">
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-brand flex items-center justify-center shadow-glow">
              <Sparkles className="w-5 h-5 text-white animate-pulse" />
            </div>
            <div className="flex-1 max-w-3xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 shadow-soft">
              <div className="flex items-center gap-2">
                <div className="flex gap-1">
                  <div className="w-2 h-2 rounded-full bg-brand-green animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-2 h-2 rounded-full bg-brand-cyan animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-2 h-2 rounded-full bg-brand-accent animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
                <span className="text-sm text-slate-600 dark:text-slate-400">Analyzing...</span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      <div className="border-t border-slate-200 dark:border-slate-800 p-4 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm">
        <form onSubmit={handleSubmit} className="flex gap-3">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={handleTextareaChange}
            onKeyDown={handleKeyDown}
            placeholder="Ask about location patterns, clusters, outliers... (Shift+Enter for new line)"
            className="flex-1 px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-accent resize-none min-h-[48px] max-h-[200px]"
            rows={1}
            disabled={isProcessing}
          />
          <GradientButton
            type="submit"
            disabled={!input.trim() || isProcessing}
            className="self-end"
            size="lg"
          >
            <Send className="w-5 h-5" />
          </GradientButton>
        </form>
        <div className="text-xs text-slate-500 dark:text-slate-500 mt-2">
          Press Enter to send • Shift+Enter for new line
        </div>
      </div>
    </div>
  );
}

function formatMarkdown(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/\n/g, '<br/>')
    .replace(/• /g, '&bull; ');
}

function getIcon(name: string) {
  switch (name) {
    case 'map':
      return <MapPin className="w-3 h-3" />;
    case 'chart':
      return <BarChart3 className="w-3 h-3" />;
    case 'download':
      return <Download className="w-3 h-3" />;
    default:
      return null;
  }
}
