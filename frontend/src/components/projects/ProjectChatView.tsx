'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import Link from 'next/link';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  Send,
  Loader2,
  Bot,
  RotateCcw,
  Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SolutionOption, streamSolutionsChat } from '@/lib/api/solutions';
import { ProjectChatMessage, ProjectRecord } from '@/types/project';

interface ProjectChatViewProps {
  project: ProjectRecord;
  selectedOption: SolutionOption;
  onPersistMessages: (messages: ProjectChatMessage[]) => Promise<void>;
}

export function ProjectChatView({
  project,
  selectedOption,
  onPersistMessages,
}: ProjectChatViewProps) {
  const query = project.data?.prompt || project.title;
  const dimensions = project.data?.dimensions || { length_m: 5.0, height_m: 2.8, area_m2: 14.0 };

  const defaultGreeting = `I am your Solution Architect for the **${selectedOption.title}**. You can ask me to explain installation procedures, verify DIN/EN compliance, or calculate component and fastener quantities.`;

  const initialMsgs: ProjectChatMessage[] =
    project.data?.messages && project.data.messages.length > 0
      ? project.data.messages
      : [
          {
            id: 'initial',
            role: 'assistant',
            content: defaultGreeting,
            timestamp: new Date().toISOString(),
          },
        ];

  const [messages, setMessages] = useState<ProjectChatMessage[]>(initialMsgs);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading, scrollToBottom]);

  const handleClearHistory = async () => {
    const resetMsg: ProjectChatMessage = {
      id: Date.now().toString(),
      role: 'assistant',
      content: defaultGreeting,
      timestamp: new Date().toISOString(),
    };
    const newMessages = [resetMsg];
    setMessages(newMessages);
    try {
      await onPersistMessages(newMessages);
    } catch (err) {
      console.error('[ProjectChat] Error saving cleared history:', err);
    }
  };

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const promptText = input.trim();
    if (!promptText || isLoading) return;

    const userMsg: ProjectChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: promptText,
      timestamp: new Date().toISOString(),
    };
    const assistantMsgId = (Date.now() + 1).toString();

    setInput('');
    const updatedMessages: ProjectChatMessage[] = [...messages, userMsg];
    const temporaryAssistantMsg: ProjectChatMessage = {
      id: assistantMsgId,
      role: 'assistant',
      content: '',
      timestamp: new Date().toISOString(),
    };

    setMessages([...updatedMessages, temporaryAssistantMsg]);
    setIsLoading(true);

    let accumulatedContent = '';

    await streamSolutionsChat({
      prompt: promptText,
      context: {
        query,
        dimensions,
        selected_option: selectedOption,
      },
      messages: updatedMessages.map((m) => ({ role: m.role, content: m.content })),
      onChunk: (token) => {
        accumulatedContent += token;
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === assistantMsgId
              ? { ...msg, content: msg.content + token }
              : msg
          )
        );
      },
      onDone: async () => {
        setIsLoading(false);
        const finalMessages: ProjectChatMessage[] = [
          ...updatedMessages,
          {
            id: assistantMsgId,
            role: 'assistant',
            content: accumulatedContent,
            timestamp: new Date().toISOString(),
          },
        ];
        try {
          await onPersistMessages(finalMessages);
        } catch (err) {
          console.error('[ProjectChat] Failed to auto-persist messages:', err);
        }
      },
      onError: (err) => {
        console.error('Chat error:', err);
        const errorContent =
          'Sorry, an error occurred while generating the consultation response. Please try again.';
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === assistantMsgId ? { ...msg, content: errorContent } : msg
          )
        );
        setIsLoading(false);
      },
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-zinc-200 shadow-xs flex flex-col h-full min-h-0 overflow-hidden">
      {/* 1. Header (Matching SolutionsChat & Copilot Drawer) */}
      <div className="p-4 sm:p-5 border-b border-zinc-100 bg-zinc-50/75 shrink-0">
        <div className="flex items-center justify-between mb-1">
          <h2 className="text-base sm:text-lg font-semibold text-zinc-950 flex items-center gap-2 font-heading">
            <Bot className="h-5 w-5 text-amber-600 shrink-0" />
            <span>Solution Architect Consultation</span>
          </h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleClearHistory}
            title="Clear conversation history"
            className="h-8 w-8 text-zinc-400 hover:text-zinc-700 rounded-lg cursor-pointer"
          >
            <RotateCcw className="h-3.5 w-3.5" />
          </Button>
        </div>
        <p className="text-xs text-zinc-500 leading-relaxed">
          Engineering guidance for DIN/EN standards, acoustic Rw values, moisture classes, and installation steps.
        </p>
      </div>

      {/* 2. Messages List (Scrollable Area matching Copilot & Solutions Chat) */}
      <div className="flex-1 p-4 sm:p-6 space-y-4 overflow-y-auto bg-white min-h-0">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex gap-3 ${
              msg.role === 'user' ? 'justify-end' : 'justify-start'
            }`}
          >
            {msg.role === 'assistant' && (
              <div className="w-7 h-7 rounded-xl bg-zinc-100 border border-zinc-200 flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
                <Bot className="h-3.5 w-3.5 text-zinc-700" />
              </div>
            )}

            <div
              className={`flex flex-col gap-1 max-w-[90%] sm:max-w-[85%] ${
                msg.role === 'user' ? 'items-end' : 'items-start'
              }`}
            >
              <div
                className={`px-4 py-3 rounded-2xl text-[13px] leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-zinc-950 text-white rounded-br-sm shadow-xs'
                    : 'bg-zinc-50 border border-zinc-200/80 text-zinc-900 rounded-bl-sm shadow-2xs w-full'
                }`}
              >
                {msg.role === 'assistant' ? (
                  msg.content ? (
                    <div className="prose prose-sm prose-zinc max-w-none">
                      <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        components={{
                          a: ({ node, href, children, ...props }) => {
                            let targetUrl = href || '';
                            if (targetUrl.includes('/catalog/')) {
                              targetUrl = targetUrl.substring(targetUrl.indexOf('/catalog/'));
                            }
                            if (targetUrl.startsWith('/products/')) {
                              targetUrl = targetUrl.replace('/products/', '/catalog/');
                            }
                            const cleanUrl = targetUrl.replace(/_/g, '-');
                            return (
                              <Link
                                href={cleanUrl}
                                target="_blank"
                                className="text-amber-600 hover:text-amber-700 underline font-medium cursor-pointer transition-colors"
                              >
                                {children}
                              </Link>
                            );
                          },
                          h1: ({ children }) => (
                            <h1 className="text-base font-bold text-zinc-950 font-heading mt-4 mb-2">
                              {children}
                            </h1>
                          ),
                          h2: ({ children }) => (
                            <h2 className="text-sm font-bold text-zinc-950 font-heading mt-3.5 mb-1.5 border-b border-zinc-200 pb-1">
                              {children}
                            </h2>
                          ),
                          h3: ({ children }) => (
                            <h3 className="text-xs font-semibold text-zinc-950 font-heading uppercase tracking-wider mt-3 mb-1 text-amber-700">
                              {children}
                            </h3>
                          ),
                          p: ({ children }) => (
                            <p className="my-1.5 text-xs text-zinc-800 leading-relaxed">
                              {children}
                            </p>
                          ),
                          ul: ({ children }) => (
                            <ul className="list-disc pl-4 my-2 space-y-1 text-xs text-zinc-700">
                              {children}
                            </ul>
                          ),
                          ol: ({ children }) => (
                            <ol className="list-decimal pl-4 my-2 space-y-1 text-xs text-zinc-700">
                              {children}
                            </ol>
                          ),
                          li: ({ children }) => (
                            <li className="text-xs leading-relaxed">{children}</li>
                          ),
                          strong: ({ children }) => (
                            <strong className="font-semibold text-zinc-950">
                              {children}
                            </strong>
                          ),
                          table: ({ children }) => (
                            <div className="my-3 overflow-x-auto rounded-lg border border-zinc-200 shadow-2xs">
                              <table className="w-full text-left text-xs border-collapse divide-y divide-zinc-200">
                                {children}
                              </table>
                            </div>
                          ),
                          thead: ({ children }) => (
                            <thead className="bg-zinc-100 text-zinc-900 font-semibold">
                              {children}
                            </thead>
                          ),
                          th: ({ children }) => (
                            <th className="px-3 py-2 text-[11px] font-semibold text-zinc-900 border-r border-zinc-200 last:border-r-0">
                              {children}
                            </th>
                          ),
                          td: ({ children }) => (
                            <td className="px-3 py-2 border-b border-zinc-100 border-r border-zinc-100 last:border-r-0 text-zinc-700 text-xs">
                              {children}
                            </td>
                          ),
                        }}
                      >
                        {msg.content}
                      </ReactMarkdown>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-zinc-400 py-1">
                      <Loader2 className="h-3.5 w-3.5 animate-spin text-amber-600" />
                      <span className="text-xs">Analyzing material assemblies...</span>
                    </div>
                  )
                ) : (
                  <span>{msg.content}</span>
                )}
              </div>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* 3. Fixed Bottom Input Bar (Identical to SolutionsChat) */}
      <div className="p-3 sm:p-4 border-t border-zinc-100 bg-white shrink-0">
        <form onSubmit={handleSendMessage} className="relative flex items-center">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={1}
            placeholder="Ask a technical question about materials, trade-offs, or DIN/EN standards..."
            disabled={isLoading}
            className="w-full resize-none rounded-xl border border-zinc-200 bg-zinc-50/50 pl-4 pr-12 py-3 text-xs text-zinc-900 placeholder:text-zinc-400 focus:bg-white focus:border-amber-500 focus:outline-hidden transition-all max-h-32 min-h-[44px]"
          />
          <Button
            type="submit"
            disabled={!input.trim() || isLoading}
            size="icon"
            className="absolute right-1.5 h-8 w-8 rounded-lg bg-zinc-950 text-white hover:bg-zinc-800 disabled:opacity-40 transition-all cursor-pointer shadow-2xs"
            aria-label="Send message"
          >
            {isLoading ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin text-amber-400" />
            ) : (
              <Send className="h-3.5 w-3.5" />
            )}
          </Button>
        </form>
      </div>
    </div>
  );
}
