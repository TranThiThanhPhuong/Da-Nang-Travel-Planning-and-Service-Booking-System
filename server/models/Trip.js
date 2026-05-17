import mongoose from "mongoose";

const activitySchema = new mongoose.Schema({
  time: {
    type: String,
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  address: {
    type: String,
    required: true,
  },
  serviceId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Service",
    default: null,
  },
});

const itineraryDaySchema = new mongoose.Schema({
  dayNumber: {
    type: Number,
    required: true,
  },
  date: {
    type: Date,
    required: true,
  },
  activities: [activitySchema],
});

const tripSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
    },
    startDate: {
      type: Date,
      required: true,
    },
    days: {
      type: Number,
      required: true,
    },
    budget: {
      type: Number,
    },
    estimatedBudget: {
      type: Number,
    },
    travelStyle: [{ type: String }],
    peopleCount: {
      type: Number,
      default: 1,
    },
    itinerary: [itineraryDaySchema],
    status: {
      type: String,
      enum: ["DRAFT", "CONFIRMED", "ONGOING", "COMPLETED"],
      default: "DRAFT",
    },
  },
  {
    timestamps: true,
  },
);

tripSchema.index({ userId: 1, createdAt: -1 });

const Trip = mongoose.models.Trip || mongoose.model("Trip", tripSchema);

export default Trip;