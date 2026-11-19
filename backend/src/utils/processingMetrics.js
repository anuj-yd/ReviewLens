const createProcessingMetrics = (totalReviews) => {
    const startTime = process.hrtime.bigint();

    const metrics = {
        totalReviews,
        processed: 0,
        aiCalls: 0,
        cacheHits: 0,
        failed: 0,
        retries: 0,

        getProcessingTime() {
            const elapsed = process.hrtime.bigint() - startTime;
            return Number(elapsed / 1000000n);
        },

        getSummary() {
            return {
                totalReviews: this.totalReviews,
                processed: this.processed,
                aiCalls: this.aiCalls,
                cacheHits: this.cacheHits,
                failed: this.failed,
                retries: this.retries,
                processingTimeMs: this.getProcessingTime()
            };
        }
    };

    return metrics;
};

module.exports = createProcessingMetrics;