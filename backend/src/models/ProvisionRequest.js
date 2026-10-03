const mongoose = require('mongoose');

const provisionRequestSchema = new mongoose.Schema(
  {
    requestId: { type: String, required: true, unique: true },
    status: {
      type: String,
      enum: ['REQUESTED', 'PROVISIONING', 'AVAILABLE', 'FAILED'],
      default: 'REQUESTED',
    },
    mode: { type: String, default: 'demo' },
    productId: { type: String, required: true },
    product: { type: String, required: true },
    environment: { type: String, required: true },
    instanceType: { type: String, default: '' },
    region: { type: String, default: '' },
    subnet: { type: String, default: '' },
    vpc: { type: String, default: '' },
    userId: { type: String, index: true },
    requestedBy: { type: String, required: true },
    requestedAt: { type: Date, required: true },
    message: { type: String, required: true },
    provisionedProductId: { type: String },
    provisionedProductName: { type: String },
  },
  { versionKey: false },
);

module.exports = mongoose.model('ProvisionRequest', provisionRequestSchema);
