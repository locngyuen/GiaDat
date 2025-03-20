const mongoose = require('mongoose');

const StreetSegmentSchema = new mongoose.Schema({
  from: {
    type: String,
    required: function() {
      return !this.isFullStreet;
    }
  },
  to: {
    type: String,
    required: function() {
      return !this.isFullStreet;
    }
  },
  isFullStreet: {
    type: Boolean,
    default: false
  },
  marketPrice: {
    type: Number,
    required: true
  },
  governmentPrice: {
    type: Number,
    required: true
  },
  coordinates: {
    type: {
      type: String,
      enum: ['LineString'],
      required: true
    },
    coordinates: {
      type: [[Number]],  // Mảng các điểm [longitude, latitude]
      required: true
    }
  }
});

const StreetSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    index: true
  },
  district: {
    type: String,
    required: true
  },
  segments: [StreetSegmentSchema],
  updatedAt: {
    type: Date,
    default: Date.now
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
});

// Tạo index cho tìm kiếm
StreetSchema.index({ name: 'text' });

module.exports = mongoose.model('Street', StreetSchema); 