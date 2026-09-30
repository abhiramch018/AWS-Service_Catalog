const mongoose = require('mongoose');

const productSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    version: { type: String, required: true },
    category: { type: String, required: true },
    status: { type: String, required: true },
    description: { type: String, required: true },
    provider: { type: String, required: true },
    infrastructure: {
      ec2Instance: String,
      securityGroup: String,
      cloudFormationTemplate: String,
      environment: String,
    },
  },
  { versionKey: false },
);

module.exports = mongoose.model('Product', productSchema);
