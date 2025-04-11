const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  content: {
    type: String,
    required: true
  },
  encrypted: {
    type: Boolean,
    default: true
  },
  // For end-to-end encryption, store initialization vector
  iv: String,
  // For storing file attachments
  attachments: [{
    fileUrl: String,
    fileName: String,
    fileType: String,
    fileSize: Number,
    encryptedKey: String // Encrypted file key if using per-file encryption
  }],
  read: {
    type: Boolean,
    default: false
  },
  readAt: Date,
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Add indexes for faster queries
messageSchema.index({ sender: 1, recipient: 1 });
messageSchema.index({ createdAt: -1 });

// Virtual for checking if message is expired (for self-destructing messages in future)
messageSchema.virtual('isExpired').get(function() {
  // Implement expiration logic if needed
  return false;
});

const Message = mongoose.models.Message || mongoose.model('Message', messageSchema);

module.exports = Message; 