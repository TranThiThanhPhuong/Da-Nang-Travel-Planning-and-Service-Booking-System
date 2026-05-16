import mongoose from 'mongoose';

const serviceInventorySchema = new mongoose.Schema(
  {
    serviceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Service',
      required: true,
      index: true,
    },
    date: {
      type: Date,
      required: true,
      index: true,
    },
    totalSlots: {
      type: Number,
      required: true,
      min: [0, 'Tổng số chỗ không thể âm'],
    },
    bookedSlots: {
      type: Number,
      default: 0,
      min: [0, 'Số chỗ đã đặt không thể âm'],
    },
    availableSlots: {
      type: Number,
      required: true,
      min: [0, 'Số chỗ còn lại không thể âm'],
    },
    status: {
      type: String,
      enum: ['AVAILABLE', 'LIMITED', 'SOLD_OUT'],
      default: 'AVAILABLE',
    },
    note: {
      type: String,
      maxlength: 500,
    },
    version: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Index chống trùng ngày: 1 dịch vụ chỉ có 1 inventory cho 1 ngày, Không thể tạo 2 record
serviceInventorySchema.index({ serviceId: 1, date: 1 }, { unique: true });

// Middleware tự động tính availableSlots và status khi lưu hoặc cập nhật
serviceInventorySchema.pre('save', function (next) {
  // Tự động tính availableSlots
  this.availableSlots = this.totalSlots - this.bookedSlots;

  // Tự động tính status dựa trên availableSlots
  const percentage = (this.availableSlots / this.totalSlots) * 100;

  if (this.availableSlots === 0) {
    this.status = 'SOLD_OUT';
  } else if (percentage <= 30) {
    this.status = 'LIMITED';
  } else {
    this.status = 'AVAILABLE';
  }

  next();
});

// Middleware cho findOneAndUpdate để tự động tính lại availableSlots và status khi cập nhật
serviceInventorySchema.pre('findOneAndUpdate', function (next) {
  const update = this.getUpdate();

  if (update.$set) {
    const totalSlots = update.$set.totalSlots;
    const bookedSlots = update.$set.bookedSlots;

    if (totalSlots !== undefined && bookedSlots !== undefined) {
      update.$set.availableSlots = totalSlots - bookedSlots;

      const percentage = (update.$set.availableSlots / totalSlots) * 100;

      if (update.$set.availableSlots === 0) {
        update.$set.status = 'SOLD_OUT';
      } else if (percentage <= 30) {
        update.$set.status = 'LIMITED';
      } else {
        update.$set.status = 'AVAILABLE';
      }
    }
  }

  next();
});

// Static method để bulk upsert inventory cho 1 dịch vụ trong 1 khoảng thời gian
serviceInventorySchema.statics.bulkUpsert = async function (serviceId, dateRange, totalSlots, note) {
  const operations = dateRange.map((date) => ({
    updateOne: {
      filter: { serviceId, date },
      update: {
        $set: { totalSlots, note },
        $setOnInsert: { bookedSlots: 0 },
      },
      upsert: true,
    },
  }));

  return this.bulkWrite(operations);
};

// Static method để lấy inventory cho 1 tháng của 1 dịch vụ
serviceInventorySchema.statics.getMonthlyInventory = async function (serviceId, year, month) {
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0, 23, 59, 59);

  return this.find({
    serviceId,
    date: { $gte: startDate, $lte: endDate },
  }).sort({ date: 1 });
};

const ServiceInventory = mongoose.models.ServiceInventory ||
  mongoose.model('ServiceInventory', serviceInventorySchema);

export default ServiceInventory;