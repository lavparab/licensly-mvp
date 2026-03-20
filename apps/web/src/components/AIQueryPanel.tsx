import { useState, useRef, useEffect } from 'react';
import { MessageSquare, X, Send, Loader2, Sparkles, ChevronRight } from 'lucide-react';
import { api } from '../lib/api';

interface Message {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    type?: 'text' | 'list' | 'table' | 'metric';
    data?: any;
    followUpQuestions?: string[];
    timestamp: string;
}

const SUGGESTED_QUESTIONS = [
    "What's my total monthly SaaS spend?",
    "Which licenses are expiring soon?",
    "Show me platforms with unused seats",
    "What compliance alerts do I have?",
    "Which integrations are connected?",
];

export function AIQueryPanel() {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (isOpen && messages.length === 0) {
            // Add welcome message
            setMessages([{
                id: 'welcome',
                role: 'assistant',
                content: "Hi! I'm Licensly AI. Ask me anything about your licenses, costs, or integrations.",
                type: 'text',
                followUpQuestions: SUGGESTED_QUESTIONS.slice(0, 3),
                timestamp: new Date().toISOString()
            }]);
        }
        if (isOpen) {
            setTimeout(() => inputRef.current?.focus(), 100);
        }
    }, [isOpen]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const sendMessage = async (question: string) => {
        if (!question.trim() || isLoading) return;

        const userMessage: Message = {
            id: Date.now().toString(),
            role: 'user',
            content: question,
            timestamp: new Date().toISOString()
        };

        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setIsLoading(true);

        try {
            const response = await api.post('/api/ai/query', { question });
            
            const assistantMessage: Message = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: response.answer,
                type: response.type,
                data: response.data,
                followUpQuestions: response.followUpQuestions,
                timestamp: response.timestamp
            };

            setMessages(prev => [...prev, assistantMessage]);
        } catch (err: any) {
            setMessages(prev => [...prev, {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: 'Sorry, I had trouble processing that. Please try again.',
                type: 'text',
                timestamp: new Date().toISOString()
            }]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        sendMessage(input);
    };

    const renderMessageContent = (message: Message) => {
        if (message.role === 'user') {
            return <p className="text-[14px] text-white">{message.content}</p>;
        }

        return (
            <div className="space-y-3">
                <p className="text-[14px] text-gray-900 dark:text-[#ededed] leading-relaxed whitespace-pre-wrap">
                    {message.content}
                </p>

                {/* List type */}
                {message.type === 'list' && message.data && Array.isArray(message.data) && (
                    <ul className="space-y-1.5 mt-2">
                        {message.data.map((item: any, i: number) => (
                            <li key={i} className="flex items-start gap-2 text-[13px] text-gray-700 dark:text-[#a1a1a1]">
                                <ChevronRight className="h-3.5 w-3.5 mt-0.5 shrink-0 text-blue-500" />
                                <span>{typeof item === 'string' ? item : JSON.stringify(item)}</span>
                            </li>
                        ))}
                    </ul>
                )}

                {/* Metric type */}
                {message.type === 'metric' && message.data && (
                    <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg p-3 mt-2">
                        <p className="text-2xl font-bold text-blue-700 dark:text-blue-400 font-mono">
                            {message.data.value}
                        </p>
                        {message.data.label && (
                            <p className="text-[12px] text-blue-600 dark:text-blue-500 mt-0.5">
                                {message.data.label}
                            </p>
                        )}
                    </div>
                )}

                {/* Table type */}
                {message.type === 'table' && message.data && Array.isArray(message.data) && message.data.length > 0 && (
                    <div className="overflow-x-auto mt-2 rounded-lg border border-gray-200 dark:border-[#2e2e2e]">
                        <table className="w-full text-[12px]">
                            <thead>
                                <tr className="bg-gray-50 dark:bg-[#1a1a1a]">
                                    {Object.keys(message.data[0]).map(key => (
                                        <th key={key} className="px-3 py-2 text-left font-medium text-gray-500 dark:text-[#666666] uppercase text-[10px] tracking-wide">
                                            {key}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {message.data.map((row: any, i: number) => (
                                    <tr key={i} className="border-t border-gray-100 dark:border-[#2e2e2e]">
                                        {Object.values(row).map((val: any, j: number) => (
                                            <td key={j} className="px-3 py-2 text-gray-700 dark:text-[#a1a1a1]">
                                                {String(val)}
                                            </td>
                                        ))}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Follow-up questions */}
                {message.followUpQuestions && message.followUpQuestions.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-3">
                        {message.followUpQuestions.map((q, i) => (
                            <button
                                key={i}
                                onClick={() => sendMessage(q)}
                                className="text-[11px] px-2.5 py-1 bg-gray-100 dark:bg-[#1a1a1a] text-gray-600 dark:text-[#a1a1a1] rounded-full hover:bg-gray-200 dark:hover:bg-[#2e2e2e] transition-colors text-left"
                            >
                                {q}
                            </button>
                        ))}
                    </div>
                )}
            </div>
        );
    };

    return (
        <>
            {/* Floating button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="fixed bottom-6 right-4 sm:right-6 z-[9998] flex items-center gap-2 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg transition-all duration-200 hover:scale-105"
            >
                {isOpen ? (
                    <X className="h-5 w-5" />
                ) : (
                    <>
                        <Sparkles className="h-4 w-4" />
                        <span className="text-[13px] font-medium">Ask AI</span>
                    </>
                )}
            </button>

            {/* Panel */}
            {isOpen && (
                <div className="fixed bottom-20 right-3 left-3 sm:left-auto sm:right-6 z-[9997] w-auto sm:w-[420px] h-[500px] sm:h-[600px] max-h-[calc(100vh-8rem)] bg-white dark:bg-[#111111] border border-gray-200 dark:border-[#2e2e2e] rounded-2xl shadow-2xl flex flex-col overflow-hidden">
                    
                    {/* Header */}
                    <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100 dark:border-[#2e2e2e] bg-gradient-to-r from-blue-600 to-blue-700">
                        <div className="flex items-center justify-center h-8 w-8 bg-white/20 rounded-lg">
                            <Sparkles className="h-4 w-4 text-white" />
                        </div>
                        <div>
                            <p className="text-[14px] font-semibold text-white">Licensly AI</p>
                            <p className="text-[11px] text-blue-200">Ask anything about your licenses</p>
                        </div>
                        <button
                            onClick={() => setIsOpen(false)}
                            className="ml-auto flex items-center justify-center h-8 w-8 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    </div>

                    {/* Messages */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-4">
                        {messages.map(message => (
                            <div
                                key={message.id}
                                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                            >
                                <div className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                                    message.role === 'user'
                                        ? 'bg-blue-600 rounded-br-sm'
                                        : 'bg-gray-50 dark:bg-[#1a1a1a] border border-gray-100 dark:border-[#2e2e2e] rounded-bl-sm'
                                }`}>
                                    {renderMessageContent(message)}
                                </div>
                            </div>
                        ))}

                        {isLoading && (
                            <div className="flex justify-start">
                                <div className="bg-gray-50 dark:bg-[#1a1a1a] border border-gray-100 dark:border-[#2e2e2e] rounded-2xl rounded-bl-sm px-4 py-3">
                                    <div className="flex items-center gap-2">
                                        <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
                                        <span className="text-[13px] text-gray-500 dark:text-[#666666]">Analyzing your data...</span>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div ref={messagesEndRef} />
                    </div>

                    {/* Suggested questions — only show when no messages except welcome */}
                    {messages.length <= 1 && (
                        <div className="px-4 pb-2">
                            <p className="text-[11px] text-gray-400 dark:text-[#666666] mb-2 font-medium uppercase tracking-wide">Suggested</p>
                            <div className="space-y-1.5">
                                {SUGGESTED_QUESTIONS.slice(0, 3).map((q, i) => (
                                    <button
                                        key={i}
                                        onClick={() => sendMessage(q)}
                                        className="w-full text-left text-[12px] px-3 py-2 bg-gray-50 dark:bg-[#1a1a1a] text-gray-600 dark:text-[#a1a1a1] rounded-lg hover:bg-gray-100 dark:hover:bg-[#2e2e2e] transition-colors border border-gray-100 dark:border-[#2e2e2e]"
                                    >
                                        {q}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Input */}
                    <div className="px-4 py-3 border-t border-gray-100 dark:border-[#2e2e2e]">
                        <form onSubmit={handleSubmit} className="flex items-center gap-2">
                            <input
                                ref={inputRef}
                                type="text"
                                value={input}
                                onChange={e => setInput(e.target.value)}
                                placeholder="Ask about your licenses..."
                                disabled={isLoading}
                                className="flex-1 text-[13px] px-3 py-2 bg-gray-50 dark:bg-[#1a1a1a] border border-gray-200 dark:border-[#2e2e2e] rounded-lg text-gray-900 dark:text-[#ededed] placeholder:text-gray-400 dark:placeholder:text-[#666666] focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 disabled:opacity-50"
                            />
                            <button
                                type="submit"
                                disabled={!input.trim() || isLoading}
                                className="flex items-center justify-center h-9 w-9 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
                            >
                                <Send className="h-4 w-4" />
                            </button>
                        </form>
                        <p className="text-[10px] text-gray-400 dark:text-[#666666] mt-2 text-center flex-shrink-0">
                            Powered by Gemini AI • Answers based on your real data
                        </p>
                    </div>
                </div>
            )}
        </>
    );
}
