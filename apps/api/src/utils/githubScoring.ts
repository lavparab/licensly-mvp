export function daysSince(dateInput?: string | Date | null): number {
    if (!dateInput) return Infinity;
    const date = new Date(dateInput);
    if (isNaN(date.getTime())) return Infinity;
    
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    return Math.floor(diffTime / (1000 * 60 * 60 * 24));
}

export function getActivityScore(lastCommitDate?: string | Date | null, lastPrDate?: string | Date | null, lastReviewDate?: string | Date | null): number {
    // Score 0-100 based on recent activity
    const lastCommitDays = daysSince(lastCommitDate);
    const lastPrDays = daysSince(lastPrDate);
    const lastReviewDays = daysSince(lastReviewDate);
    
    let score = 100;
    score -= Math.min(lastCommitDays === Infinity ? 50 : lastCommitDays, 50);   // max 50 point penalty
    score -= Math.min(lastPrDays === Infinity ? 30 : lastPrDays, 30);       // max 30 point penalty
    score -= Math.min(lastReviewDays === Infinity ? 20 : lastReviewDays, 20);   // max 20 point penalty
    
    return Math.max(score, 0);
}
