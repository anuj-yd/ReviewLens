import mongoose from 'mongoose';

const reviewAnalysisCacheSchema = new mongoose.Schema(
    {
        hash: {
            type: String,
            required: true,
            unique: true
        },
        model: {
            type: String,
            required: true
        },
        promptVersion: {
            type: String,
            required: true
        },
        result: {
            type: mongoose.Schema.Types.Mixed,
            required: true
        }
    },
    {
        timestamps: true
    }
);

export default mongoose.model(
    'ReviewAnalysisCache',
    reviewAnalysisCacheSchema
);