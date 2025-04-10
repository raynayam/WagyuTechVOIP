const mongoose = require('mongoose');

const callSchema = new mongoose.Schema({
  callerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  callerName: {
    type: String,
    required: true
  },
  recipientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  recipientName: {
    type: String,
    required: true
  },
  startTime: {
    type: Date,
    required: true,
    default: Date.now
  },
  endTime: {
    type: Date
  },
  duration: {
    type: Number // in seconds
  },
  status: {
    type: String,
    enum: ['missed', 'completed', 'rejected'],
    required: true
  },
  encrypted: {
    type: Boolean,
    default: true
  },
  callType: {
    type: String,
    enum: ['audio', 'video'],
    default: 'audio'
  },
  transferred: {
    type: Boolean,
    default: false
  },
  transferredTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  // Fields for external PSTN calls via Twilio
  callSid: {
    type: String,
    index: true,
    sparse: true
  },
  isPstnCall: {
    type: Boolean,
    default: false
  },
  twilioRecordingUrl: {
    type: String
  },
  twilioRecordingSid: {
    type: String
  },
  phoneNumber: {
    type: String
  }
});

const Call = mongoose.models.Call || mongoose.model('Call', callSchema);

module.exports = Call; 