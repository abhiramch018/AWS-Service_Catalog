const mongoose = require('mongoose');

const productRequestSchema = new mongoose.Schema(
  {
    requestId: { type: String, required: true, unique: true },
    userId: { type: String, required: true, index: true },
    userName: { type: String, required: true },
    userEmail: { type: String, required: true },
    productId: { type: String, required: true },
    productName: { type: String, required: true },
    reason: { type: String, required: true },
    environment: { type: String, required: true },
    expectedUsage: { type: String, required: true },
    status: {
      type: String,
      enum: ['PENDING', 'APPROVED', 'REJECTED'],
      default: 'PENDING',
    },
    adminComment: { type: String, default: '' },
    reviewedBy: { type: String, default: '' },
    reviewedAt: { type: Date },
  },
  { timestamps: true, versionKey: false },
);

module.exports = mongoose.model('ProductRequest', productRequestSchema);
