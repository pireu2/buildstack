"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { streamChat, StreamEvent, ChatApiError } from "@/lib/api/chat";
import { MessageSquare, X, Send, Bot, Loader2, RotateCcw } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Button } from "@/components/ui/button";
import { useCopilot, Message } from "@/context/CopilotContext";
import { authClient } from "@/lib/auth/client";

export function CopilotWrapper({
  productContext = null,
  isOpen,
  onOpenChange,
}: {
  productContext?: any;
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  const pathname = usePathname();
  const copilotContext = useCopilot();
  const open = isOpen !== undefined ? isOpen : copilotContext.isOpen;
  const activeProduct = productContext || copilotContext.productContext;

  const isVisible = pathname ? pathname.startsWith("/catalog") : false;

  const handleOpenChange = useCallback(
    (newOpen: boolean) => {
      if (onOpenChange) onOpenChange(newOpen);
      copilotContext.setIsOpen(newOpen);
    },
    [onOpenChange, copilotContext],
  );

  // Dynamic layout adjustment: on desktop (>=1024px) shift body by 1/3 (33.333333%), on mobile (0px)
  useEffect(() => {
    const updateBodyShift = () => {
      if (isVisible && open && window.innerWidth >= 1024) {
        document.body.style.marginRight = "33.333333%";
        document.body.style.transition =
          "margin-right 0.3s cubic-bezier(0.16, 1, 0.3, 1)";
      } else {
        document.body.style.marginRight = "0px";
      }
    };

    updateBodyShift();
    window.addEventListener("resize", updateBodyShift);

    return () => {
      document.body.style.marginRight = "0px";
      window.removeEventListener("resize", updateBodyShift);
    };
  }, [open, isVisible]);

  if (!isVisible) {
    return null;
  }

  return (
    <>
      {/* Floating Action Button (FAB) */}
      <div
        className={`fixed bottom-6 z-40 transition-all duration-300 ${
          open ? "hidden lg:flex lg:right-[calc(33.333333%+1.5rem)]" : "right-6"
        }`}
      >
        <Button
          onClick={() => handleOpenChange(!open)}
          size="icon"
          className="h-14 w-14 rounded-full shadow-lg bg-zinc-950 hover:bg-zinc-800 text-white transition-all hover:scale-105 active:scale-95 cursor-pointer border border-zinc-700"
          aria-label={open ? "Close Copilot" : "Open Copilot"}
        >
          {open ? (
            <X className="h-6 w-6" />
          ) : (
            <MessageSquare className="h-6 w-6" />
          )}
        </Button>
      </div>

      {/* Side Panel: Fullscreen on mobile, 1/3 screen on desktop */}
      <aside
        className={`fixed top-0 right-0 h-dvh w-full md:w-[450px] lg:w-1/3 bg-white border-l border-zinc-200 shadow-2xl z-50 transform transition-transform duration-300 ease-in-out ${
          open ? "translate-x-0" : "translate-x-full"
        } flex flex-col overflow-hidden`}
        aria-label="Solution Architect Copilot Chat"
      >
        {/* Drawer Header */}
        <div className="p-4 sm:p-5 border-b border-zinc-100 bg-zinc-50/75 shrink-0">
          <div className="flex items-center justify-between mb-1">
            <h2 className="text-base sm:text-lg font-semibold text-zinc-950 flex items-center gap-2 font-heading">
              <Bot className="h-5 w-5 text-amber-600 shrink-0" />
              <span>Solution Architect Copilot</span>
            </h2>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                onClick={copilotContext.clearHistory}
                title="Clear chat history"
                className="h-8 w-8 text-zinc-400 hover:text-zinc-700 rounded-lg cursor-pointer"
              >
                <RotateCcw className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleOpenChange(false)}
                className="h-8 w-8 text-zinc-400 hover:text-zinc-900 rounded-lg cursor-pointer"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <p className="text-xs text-zinc-500 leading-relaxed">
            Engineering guidance for DIN/EN standards, acoustic Rw values, and
            assemblies.
          </p>

          {activeProduct && (
            <div className="mt-3 px-3 py-2 bg-white rounded-lg border border-zinc-200/90 shadow-2xs flex items-center gap-2.5">
              <div className="flex-1 min-w-0">
                <span className="text-[10px] uppercase font-mono font-semibold tracking-wider text-amber-600 block">
                  Active Context
                </span>
                <p className="text-xs font-semibold text-zinc-950 truncate">
                  {activeProduct.name}
                </p>
                {activeProduct.sku && (
                  <span className="text-[10px] font-mono text-zinc-400">
                    SKU: {activeProduct.sku}
                  </span>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Chat Conversation & Input Form */}
        <CopilotChat productContext={activeProduct} />
      </aside>
    </>
  );
}

function CopilotChat({ productContext }: { productContext: any }) {
  const { messages, setMessages } = useCopilot();
  const { data: session } = authClient.useSession();
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({
        behavior: "smooth",
        block: "end",
      });
    }
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading, scrollToBottom]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input.trim(),
    };
    const assistantMsgId = (Date.now() + 1).toString();

    setMessages((prev) => [
      ...prev,
      userMsg,
      { id: assistantMsgId, role: "assistant", content: "" },
    ]);
    setInput("");
    setIsLoading(true);

    const historyPayload = messages.map((m) => ({
      role: m.role,
      content: m.content,
    }));

    try {
      await streamChat(
        userMsg.content,
        productContext,
        historyPayload,
        (event: StreamEvent) => {
          setMessages((prev) =>
            prev.map((msg) => {
              if (msg.id === assistantMsgId) {
                if (event.type === "token") {
                  return {
                    ...msg,
                    content: msg.content + event.content,
                    activeTool: undefined,
                  };
                } else if (event.type === "tool_start") {
                  return { ...msg, activeTool: event.tool };
                } else if (event.type === "tool_end") {
                  return { ...msg, activeTool: undefined };
                }
              }
              return msg;
            }),
          );
        },
        session?.user?.id,
      );
    } catch (error: any) {
      if (error instanceof ChatApiError && error.statusCode === 429) {
        const rateLimitMessage = !session?.user
          ? `> **Daily Message Limit Reached (10 / 24h)**\n>\n> ${error.detail || error.message}\n>\n> [Sign in to BuildStack](/auth/sign-in) to unlock **100 messages per day**.`
          : `> **Daily Message Limit Reached (100 / 24h)**\n>\n> ${error.detail || error.message}\n>\n> Your quota will reset 24 hours after your earliest message.`;

        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === assistantMsgId
              ? {
                  ...msg,
                  content:
                    (msg.content ? msg.content + "\n\n" : "") + rateLimitMessage,
                  activeTool: undefined,
                }
              : msg
          )
        );
        return;
      }

      console.error("[Copilot] Unexpected chat error:", error);
      const fallbackMsg = error?.message
        ? `**Service Notice:** ${error.message}`
        : "**Error connecting to the AI Solution Architect service.**";

      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === assistantMsgId
            ? {
                ...msg,
                content:
                  (msg.content ? msg.content + "\n\n" : "") + fallbackMsg,
                activeTool: undefined,
              }
            : msg
        )
      );
    } finally {
      setIsLoading(false);
    }
  };

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(Math.max(textareaRef.current.scrollHeight, 42), 140)}px`;
    }
  }, [input]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <div className="flex-1 min-h-0 flex flex-col bg-white overflow-hidden">
      {/* Scrollable Message List */}
      <div
        ref={scrollContainerRef}
        className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-5 space-y-5 overscroll-contain"
      >
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 text-zinc-500 my-auto">
            <div className="h-12 w-12 rounded-2xl bg-zinc-100 border border-zinc-200 flex items-center justify-center mb-3.5 shadow-2xs">
              <Bot className="h-6 w-6 text-zinc-600" />
            </div>
            <p className="text-sm font-semibold text-zinc-900 font-heading">
              How can I assist your project?
            </p>
            <p className="text-xs text-zinc-500 mt-1 max-w-[260px] leading-relaxed">
              Ask about acoustic ratings (DIN 4109), fire partition builds (EN
              13501), or material estimates.
            </p>
          </div>
        ) : (
          <>
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                {msg.role === "assistant" && (
                  <div className="w-7 h-7 rounded-xl bg-zinc-100 border border-zinc-200 flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
                    <Bot className="h-3.5 w-3.5 text-zinc-700" />
                  </div>
                )}

                <div
                  className={`flex flex-col gap-1 max-w-[90%] sm:max-w-[85%] ${
                    msg.role === "user" ? "items-end" : "items-start"
                  }`}
                >
                  <div
                    className={`px-4 py-3 rounded-2xl text-[13px] leading-relaxed ${
                      msg.role === "user"
                        ? "bg-zinc-950 text-white rounded-br-sm shadow-xs"
                        : "bg-zinc-50 border border-zinc-200/80 text-zinc-900 rounded-bl-sm shadow-2xs w-full"
                    }`}
                  >
                    {msg.role === "assistant" ? (
                      msg.content ? (
                        <div className="prose prose-sm prose-zinc max-w-none">
                          <ReactMarkdown
                            remarkPlugins={[remarkGfm]}
                            components={{
                              a: ({ node, href, children, ...props }) => {
                                let targetUrl = href || "";

                                // If pointing to an external website or random URL, format as italic text
                                if (
                                  targetUrl.startsWith("http://") ||
                                  targetUrl.startsWith("https://")
                                ) {
                                  // If localhost catalog link, normalize to relative
                                  if (targetUrl.includes("/catalog/")) {
                                    targetUrl = targetUrl.substring(
                                      targetUrl.indexOf("/catalog/"),
                                    );
                                  } else {
                                    return (
                                      <em className="italic text-zinc-700 not-prose">
                                        {children}
                                      </em>
                                    );
                                  }
                                }

                                // Normalize /products/ to /catalog/
                                if (targetUrl.startsWith("/products/")) {
                                  targetUrl = targetUrl.replace(
                                    "/products/",
                                    "/catalog/",
                                  );
                                }

                                // Auth link
                                if (targetUrl.startsWith("/auth/")) {
                                  return (
                                    <Link
                                      href={targetUrl}
                                      className="inline-flex items-center text-amber-600 hover:text-amber-700 font-semibold underline cursor-pointer mt-1"
                                    >
                                      {children}
                                    </Link>
                                  );
                                }

                                // Standards or document references should be italicized, not linked
                                if (
                                  targetUrl.includes("din-") ||
                                  targetUrl.includes("en-") ||
                                  targetUrl.includes("standard") ||
                                  targetUrl.includes("norm") ||
                                  targetUrl === "#" ||
                                  !targetUrl.startsWith("/catalog/")
                                ) {
                                  return (
                                    <em className="italic text-zinc-700 not-prose">
                                      {children}
                                    </em>
                                  );
                                }

                                const cleanUrl = targetUrl.replace(/_/g, "-");
                                return (
                                  <Link
                                    href={cleanUrl}
                                    className="text-amber-600 hover:text-amber-700 underline font-medium cursor-pointer transition-colors"
                                  >
                                    {children}
                                  </Link>
                                );
                              },
                              img: ({ src, alt }) => (
                                <div className="my-2.5 rounded-lg overflow-hidden border border-zinc-200 shadow-2xs">
                                  <img
                                    src={src}
                                    alt={alt || "Product Image"}
                                    className="w-full h-auto object-cover max-h-44"
                                    loading="lazy"
                                  />
                                </div>
                              ),
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
                                <li className="text-xs leading-relaxed">
                                  {children}
                                </li>
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
                                <thead className="bg-zinc-100/90 text-zinc-900 font-semibold">
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
                              tr: ({ children }) => (
                                <tr className="even:bg-zinc-50/50 hover:bg-zinc-100/50 transition-colors">
                                  {children}
                                </tr>
                              ),
                              blockquote: ({ children }) => (
                                <blockquote className="border-l-2 border-amber-500 pl-3 my-2 text-zinc-600 italic text-xs bg-amber-50/30 py-1 rounded-r">
                                  {children}
                                </blockquote>
                              ),
                              code: ({
                                node,
                                className,
                                children,
                                ...props
                              }: any) => {
                                const isBlock =
                                  typeof children === "string" &&
                                  children.includes("\n");
                                if (!isBlock && !className) {
                                  return (
                                    <code className="font-mono text-[11px] bg-zinc-100 px-1.5 py-0.5 rounded text-zinc-800 border border-zinc-200">
                                      {children}
                                    </code>
                                  );
                                }
                                return (
                                  <code className="font-mono text-[11px] text-zinc-900 bg-transparent border-none p-0">
                                    {children}
                                  </code>
                                );
                              },
                              pre: ({ children }) => (
                                <div className="my-2.5 rounded-lg border border-zinc-200 bg-zinc-100/70 p-3 overflow-x-auto shadow-2xs">
                                  <pre className="text-[11px] font-mono text-zinc-900 leading-relaxed m-0 p-0 bg-transparent border-none">
                                    {children}
                                  </pre>
                                </div>
                              ),
                            }}
                          >
                            {msg.content}
                          </ReactMarkdown>
                        </div>
                      ) : (
                        /* Calm, intentional loading state before first token arrives */
                        <div className="flex items-center gap-2.5 py-1 px-1">
                          <div className="flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-600 animate-pulse [animation-duration:1s]" />
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-600/70 animate-pulse [animation-duration:1s] [animation-delay:200ms]" />
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-600/40 animate-pulse [animation-duration:1s] [animation-delay:400ms]" />
                          </div>
                          <span className="text-xs text-zinc-500 font-medium">
                            {msg.activeTool
                              ? `Running ${msg.activeTool.replace(/_/g, " ")}...`
                              : "Analyzing project specifications..."}
                          </span>
                        </div>
                      )
                    ) : (
                      msg.content
                    )}
                  </div>

                  {msg.role === "assistant" &&
                    msg.content &&
                    msg.activeTool && (
                      <div className="flex items-center gap-1.5 text-[10px] font-medium text-zinc-500 bg-white px-2.5 py-1 rounded-md border border-zinc-200 shadow-2xs mt-1">
                        <Loader2 className="h-3 w-3 animate-spin text-amber-600" />
                        <span>
                          Running {msg.activeTool.replace(/_/g, " ")}...
                        </span>
                      </div>
                    )}
                </div>
              </div>
            ))}
            {/* Scroll anchor */}
            <div ref={messagesEndRef} className="h-2 shrink-0" />
          </>
        )}
      </div>

      {/* Fixed Bottom Multiline Input Bar */}
      <div className="p-3 sm:p-4 border-t border-zinc-200 bg-white shrink-0 shadow-[0_-4px_20px_-15px_rgba(0,0,0,0.05)]">
        <form onSubmit={handleSubmit} className="relative flex items-end">
          <textarea
            ref={textareaRef}
            rows={1}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask a technical question... (Shift+Enter for new line)"
            className="w-full pl-3.5 pr-11 py-2.5 rounded-xl border border-zinc-300 bg-zinc-50/75 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 text-xs sm:text-[13px] transition-all shadow-2xs resize-none overflow-y-auto max-h-36 leading-relaxed"
            disabled={isLoading}
          />
          <Button
            type="submit"
            disabled={!input.trim() || isLoading}
            size="icon"
            variant="ghost"
            className="absolute right-1.5 bottom-1.5 h-8 w-8 text-zinc-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg cursor-pointer transition-colors disabled:opacity-30 shrink-0"
            aria-label="Send message"
          >
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </div>
  );
}
