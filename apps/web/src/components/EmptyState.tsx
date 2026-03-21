import { LucideIcon } from 'lucide-react';
import { Button } from './ui/button';

interface EmptyStateProps {
    icon: LucideIcon;
    title: string;
    description: string;
    actionLabel?: string;
    onAction?: () => void;
    secondaryLabel?: string;
    onSecondary?: () => void;
}

export function EmptyState({ icon: Icon, title, description, actionLabel, onAction, secondaryLabel, onSecondary }: EmptyStateProps) {
    return (
        <div className="flex flex-col items-center justify-center py-16 px-8 text-center">
            {/* Icon container with glow */}
            <div className="relative mb-6">
                <div className="absolute inset-0 bg-[#2563eb]/10 rounded-full blur-xl scale-150" />
                <div className="relative h-16 w-16 rounded-2xl bg-gray-100 dark:bg-[#1a1a1a] border border-gray-200 dark:border-[#2e2e2e] flex items-center justify-center">
                    <Icon className="h-7 w-7 text-gray-400 dark:text-[#666666]" strokeWidth={1.5} />
                </div>
            </div>

            <h3 className="text-[16px] font-semibold text-gray-900 dark:text-[#ededed] mb-2">
                {title}
            </h3>
            <p className="text-[13px] text-gray-500 dark:text-[#666666] max-w-sm leading-relaxed mb-6">
                {description}
            </p>

            <div className="flex items-center gap-3">
                {actionLabel && onAction && (
                    <Button
                        onClick={onAction}
                        className="bg-[#2563eb] hover:bg-[#1d4ed8] text-white rounded-lg h-9 px-4 text-[13px]"
                    >
                        {actionLabel}
                    </Button>
                )}
                {secondaryLabel && onSecondary && (
                    <Button
                        variant="outline"
                        onClick={onSecondary}
                        className="rounded-lg h-9 px-4 text-[13px] dark:border-[#2e2e2e] dark:text-[#a1a1a1]"
                    >
                        {secondaryLabel}
                    </Button>
                )}
            </div>
        </div>
    );
}
