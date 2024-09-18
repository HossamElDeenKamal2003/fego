const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
from: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
},
to: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
},
msg: {
    type: String,
    required: true
},
media: {
    type: String // URL or path for the media file
},
mediaType: {
    type: String // image, video, etc.
},
status: {
    type: String,
    enum: ['sent', 'delivered', 'read'],
    default: 'sent'
},
timestamp: {
    type: Date,
    default: Date.now
}
});

const Message = mongoose.model('Message', messageSchema);

module.exports = Message;
