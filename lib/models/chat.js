const mongoose = require('mongoose');

const chatSchema = new mongoose.Schema({
  // Participants in the chat
  participants: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }],
  // For group chats
  isGroup: {
    type: Boolean,
    default: false
  },
  name: {
    type: String,
    trim: true,
    // Required for group chats
    required: function() {
      return this.isGroup;
    }
  },
  // Group admin (only for group chats)
  admin: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  // Encryption key metadata
  encryptionEnabled: {
    type: Boolean,
    default: true
  },
  // Last message for preview
  lastMessage: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Message'
  },
  lastMessageText: String,
  lastMessageTime: Date,
  // For handling unread messages
  unreadCount: {
    type: Map,
    of: Number,
    default: {}
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update timestamps when the document is modified
chatSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Create compound index for faster lookups
chatSchema.index({ participants: 1 });
chatSchema.index({ updatedAt: -1 });

const Chat = mongoose.models.Chat || mongoose.model('Chat', chatSchema);

module.exports = Chat; 