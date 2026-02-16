import mongoose from 'mongoose';

const systemMetricSchema = new mongoose.Schema({
  metricType: {
    type: String,
    enum: ['storage', 'users', 'files', 'performance', 'errors'],
    required: true
  },
  value: {
    type: Number,
    required: true
  },
  label: {
    type: String,
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  metadata: {
    type: Map,
    of: mongoose.Schema.Types.Mixed
  }
});

// Index by metricType and timestamp for efficient queries
systemMetricSchema.index({ metricType: 1, timestamp: -1 });

export default mongoose.model('SystemMetric', systemMetricSchema);
