import ServiceInventory from "../models/ServiceInventory.js";
import Service from "../models/Service.js";
import mongoose from "mongoose";

// @desc    Bulk update inventory for date range
// @route   POST /api/inventory/bulk
// @access  Private/Owner
// Tạo hoặc cập nhật inventory cho tất cả ngày trong khoảng thời gian đó. Sử dụng transaction để đảm bảo tính nhất quán.
export const bulkUpdateInventory = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { serviceId, startDate, endDate, totalSlots, note } = req.body;

    if (!serviceId || !startDate || !endDate || !totalSlots) {
      await session.abortTransaction();
      return res.status(400).json({
        success: false,
        message: "Vui lòng điền đầy đủ thông tin",
      });
    }

    if (totalSlots < 0) {
      await session.abortTransaction();
      return res.status(400).json({
        success: false,
        message: "Số lượng không thể âm",
      });
    }

    const service = await Service.findById(serviceId).session(session);
    if (!service) {
      await session.abortTransaction();
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy dịch vụ",
      });
    }

    if (service.ownerId.toString() !== req.user._id.toString()) {
      await session.abortTransaction();
      return res.status(403).json({
        success: false,
        message: "Bạn không có quyền cập nhật tồn kho này",
      });
    }

    const dateRange = [];
    const [startYear, startMonth, startDay] = startDate.split("-");
    const [endYear, endMonth, endDay] = endDate.split("-");

    const start = new Date(startYear, startMonth - 1, startDay);
    const end = new Date(endYear, endMonth - 1, endDay);

    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      dateRange.push(new Date(d.getFullYear(), d.getMonth(), d.getDate()));
    }

    // Dùng bulkWrite để upsert nhiều ngày cùng lúc, tránh lỗi concurrency và đảm bảo tính nhất quán
    const operations = dateRange.map((date) => ({
      updateOne: {
        filter: { serviceId, date },
        update: {
          $set: { totalSlots, note },
          $setOnInsert: { bookedSlots: 0, version: 0 },
        },
        upsert: true,
      },
    }));

    const result = await ServiceInventory.bulkWrite(operations, { session });

    // Sau khi bulk upsert, cần cập nhật lại availableSlots và status cho tất cả ngày trong khoảng để đảm bảo tính chính xác
    await ServiceInventory.updateMany(
      { serviceId, date: { $gte: start, $lte: end } },
      [
        {
          $set: {
            availableSlots: { $subtract: ["$totalSlots", "$bookedSlots"] },
            status: {
              $cond: {
                if: {
                  $eq: [{ $subtract: ["$totalSlots", "$bookedSlots"] }, 0],
                },
                then: "SOLD_OUT",
                else: {
                  $cond: {
                    if: {
                      $lte: [
                        {
                          $multiply: [
                            {
                              $divide: [
                                { $subtract: ["$totalSlots", "$bookedSlots"] },
                                "$totalSlots",
                              ],
                            },
                            100,
                          ],
                        },
                        30,
                      ],
                    },
                    then: "LIMITED",
                    else: "AVAILABLE",
                  },
                },
              },
            },
          },
        },
      ],
      { session },
    );

    await session.commitTransaction();

    res.json({
      success: true,
      message: `Đã cập nhật ${dateRange.length} ngày`,
      data: {
        modifiedCount: result.modifiedCount,
        upsertedCount: result.upsertedCount,
      },
    });
  } catch (error) {
    await session.abortTransaction();
    console.error("Bulk update inventory error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  } finally {
    session.endSession();
  }
};

// @desc    Get monthly inventory
// @route   GET /api/inventory/:serviceId?year=2024&month=5
// @access  Private/Owner
// Lấy tồn kho của 1 dịch vụ cho 1 tháng
export const getMonthlyInventory = async (req, res) => {
  try {
    const { serviceId } = req.params;
    const { year, month } = req.query;

    if (!year || !month) {
      return res.status(400).json({
        success: false,
        message: "Vui lòng cung cấp năm và tháng",
      });
    }

    const service = await Service.findById(serviceId);
    if (!service) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy dịch vụ",
      });
    }

    if (service.ownerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Bạn không có quyền xem tồn kho này",
      });
    }

    const inventory = await ServiceInventory.getMonthlyInventory(
      serviceId,
      parseInt(year),
      parseInt(month),
    );

    res.json({
      success: true,
      count: inventory.length,
      data: inventory,
    });
  } catch (error) {
    console.error("Get monthly inventory error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Update single day inventory
// @route   PUT /api/inventory/:id
// @access  Private/Owner
export const updateInventory = async (req, res) => {
  try {
    const { totalSlots, note } = req.body;
    const { id } = req.params;

    let inventory = await ServiceInventory.findById(id).populate("serviceId");

    if (!inventory) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy tồn kho",
      });
    }

    if (inventory.serviceId.ownerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Bạn không có quyền chỉnh sửa",
      });
    }

    if (totalSlots !== undefined && totalSlots < inventory.bookedSlots) {
      return res.status(400).json({
        success: false,
        message: `Không thể đặt tổng số (${totalSlots}) nhỏ hơn số đã đặt (${inventory.bookedSlots})`,
      });
    }

    inventory.totalSlots =
      totalSlots !== undefined ? totalSlots : inventory.totalSlots;
    inventory.note = note !== undefined ? note : inventory.note;
    inventory.version += 1;

    await inventory.save();

    res.json({
      success: true,
      data: inventory,
      message: "Cập nhật thành công",
    });
  } catch (error) {
    console.error("Update inventory error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Delete inventory
// @route   DELETE /api/inventory/:id
// @access  Private/Owner
export const deleteInventory = async (req, res) => {
  try {
    const inventory = await ServiceInventory.findById(req.params.id).populate(
      "serviceId",
    );

    if (!inventory) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy tồn kho",
      });
    }

    if (inventory.serviceId.ownerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Bạn không có quyền xóa",
      });
    }

    if (inventory.bookedSlots > 0) {
      return res.status(400).json({
        success: false,
        message: "Không thể xóa ngày đã có booking",
      });
    }

    await inventory.deleteOne();

    res.json({
      success: true,
      message: "Đã xóa tồn kho",
    });
  } catch (error) {
    console.error("Delete inventory error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Get my services for dropdown
// @route   GET /api/inventory/my-services
// @access  Private/Owner
export const getMyServices = async (req, res) => {
  try {
    const services = await Service.find({
      ownerId: req.user._id,
      approvalStatus: "APPROVED",
    })
      .select("name type thumbnail")
      .sort({ name: 1 });

    res.json({
      success: true,
      count: services.length,
      data: services,
    });
  } catch (error) {
    console.error("Get my services error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
