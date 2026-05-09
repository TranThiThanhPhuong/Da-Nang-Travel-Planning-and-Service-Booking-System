import Trip from "../models/Trip.js";
import { generateTripItinerary } from "../services/apiTripService.js";

// @desc    Generate trip itinerary using AI
// @route   POST /api/trips/generate
// @access  Private
export const generateTrip = async (req, res) => {
  try {
    const {
      destination,
      days,
      startDate,
      budget,
      travelStyle,
      preferences,
      peopleCount,
    } = req.body;

    if (!destination || !days || !startDate) {
      return res.status(400).json({
        success: false,
        message: "Vui lòng điền đầy đủ thông tin",
      });
    }

    const itineraryData = await generateTripItinerary({
      destination,
      days: Number(days),
      startDate,
      budget: budget ? Number(budget) : null,
      travelStyle,
      preferences,
      peopleCount: peopleCount ? Number(peopleCount) : 1,
    });
    if (!itineraryData || !itineraryData.itinerary) {
      return res.status(500).json({
        success: false,
        message: "AI không tạo được lịch trình hợp lệ",
      });
    }

    const start = new Date(startDate);
    const endDate = new Date(start);
    endDate.setDate(start.getDate() + Number(days) - 1);

    const trip = await Trip.create({
      userId: req.user._id,
      title: itineraryData.title,
      summary: itineraryData.summary,
      destination,
      startDate: start,
      endDate,
      days: Number(days),
      budget: budget ? Number(budget) : null,
      estimatedBudget: itineraryData.estimatedBudget,
      travelStyle,
      peopleCount: peopleCount ? Number(peopleCount) : 1,
      itinerary: itineraryData.itinerary,
      status: "DRAFT",
    });

    await trip.populate("itinerary.activities.serviceId");

    res.status(201).json({
      success: true,
      data: trip,
      message: "Tạo lịch trình thành công",
    });
  } catch (error) {
    console.error("Generate trip error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Có lỗi khi tạo lịch trình",
    });
  }
};

// @desc    Get user's trips
// @route   GET /api/trips
// @access  Private
export const getMyTrips = async (req, res) => {
  try {
    const trips = await Trip.find({ userId: req.user._id })
      .sort({ createdAt: -1 })
      .populate("itinerary.activities.serviceId")
      .lean();

    res.json({
      success: true,
      count: trips.length,
      data: trips,
    });
  } catch (error) {
    console.error("Get trips error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Get single trip
// @route   GET /api/trips/:id
// @access  Private
export const getTripById = async (req, res) => {
  try {
    const trip = await Trip.findOne({
      _id: req.params.id,
      userId: req.user._id,
    }).populate("itinerary.activities.serviceId");

    if (!trip) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy lịch trình",
      });
    }

    res.json({
      success: true,
      data: trip,
    });
  } catch (error) {
    console.error("Get trip error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Update trip
// @route   PUT /api/trips/:id
// @access  Private
export const updateTrip = async (req, res) => {
  try {
    let trip = await Trip.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!trip) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy lịch trình",
      });
    }

    trip = await Trip.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true, runValidators: true },
    ).populate("itinerary.activities.serviceId");

    res.json({
      success: true,
      data: trip,
      message: "Cập nhật lịch trình thành công",
    });
  } catch (error) {
    console.error("Update trip error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Delete trip
// @route   DELETE /api/trips/:id
// @access  Private
export const deleteTrip = async (req, res) => {
  try {
    const trip = await Trip.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!trip) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy lịch trình",
      });
    }

    await trip.deleteOne();

    res.json({
      success: true,
      message: "Đã xóa lịch trình",
    });
  } catch (error) {
    console.error("Delete trip error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Confirm trip (change status to CONFIRMED)
// @route   PATCH /api/trips/:id/confirm
// @access  Private
export const confirmTrip = async (req, res) => {
  try {
    const trip = await Trip.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      { status: "CONFIRMED" },
      { new: true },
    ).populate("itinerary.activities.serviceId");

    if (!trip) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy lịch trình",
      });
    }

    res.json({
      success: true,
      data: trip,
      message: "Đã xác nhận lịch trình",
    });
  } catch (error) {
    console.error("Confirm trip error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};