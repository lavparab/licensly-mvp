import { useEffect, useState } from 'react';

const LOADING_MESSAGES = [
    'Analyzing your licenses...',
    'Calculating potential savings...',
    'Checking compliance status...',
    'Syncing integration data...',
    'Preparing your dashboard...',
    'Crunching the numbers...',
    'Almost there...',
];

export function LoadingScreen() {
    const [messageIndex, setMessageIndex] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            setMessageIndex(prev => (prev + 1) % LOADING_MESSAGES.length);
        }, 800);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="flex h-[80vh] flex-col items-center justify-center gap-6">
            {/* Animated logo mark */}
            <div className="relative">
                <div className="h-16 w-16 rounded-2xl bg-[#2563eb] flex items-center justify-center shadow-lg shadow-blue-500/20">
                    <svg className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z" />
                    </svg>
                </div>
                {/* Spinning ring */}
                <div className="absolute -inset-1 rounded-[18px] border-2 border-transparent border-t-[#2563eb]/40 animate-spin" />
            </div>

            {/* Animated message */}
            <div className="text-center space-y-2">
                <p
                    key={messageIndex}
                    className="text-[14px] text-gray-500 dark:text-[#666666] animate-pulse transition-all"
                >
                    {LOADING_MESSAGES[messageIndex]}
                </p>
                {/* Dot progress indicator */}
                <div className="flex items-center justify-center gap-1.5 mt-3">
                    {[0, 1, 2].map(i => (
                        <div
                            key={i}
                            className="h-1.5 w-1.5 rounded-full bg-[#2563eb] animate-bounce"
                            style={{ animationDelay: `${i * 150}ms` }}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
}

// Smaller inline loader for cards
export function CardLoader({ message }: { message?: string }) {
    return (
        <div className="flex flex-col items-center justify-center py-12 gap-3">
            <div className="relative">
                <div className="h-10 w-10 rounded-xl bg-[#2563eb]/10 flex items-center justify-center">
                    <svg className="h-5 w-5 text-[#2563eb]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z" />
                    </svg>
                </div>
                <div className="absolute -inset-1 rounded-[14px] border-2 border-transparent border-t-[#2563eb]/40 animate-spin" />
            </div>
            {message && <p className="text-[12px] text-gray-400 dark:text-[#666666]">{message}</p>}
        </div>
    );
}
