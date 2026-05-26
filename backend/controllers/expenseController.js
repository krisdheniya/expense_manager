import mongoose from "mongoose";
import Expense from "../models/expenseModel.js";
import Group from "../models/groupModel.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";
import { ioInstance } from "../socket/socketHandler.js";

// ─── ADD EXPENSE ─────────────────────────────────────────────
export const addExpense = asyncHandler(async (req, res) => {
    const { groupId } = req.params;
    const { description, amount, currency, paidBy, splitType, splits, category, date } = req.body;

    // Validate required fields
    if (!description || !amount || !paidBy || !splitType || !splits || !splits.length) {
        throw new ApiError(400, "Missing required fields: description, amount, paidBy, splitType, splits");
    }

    // Find the group and verify membership
    const group = await Group.findById(groupId);
    if (!group) {
        throw new ApiError(404, "Group not found");
    }

    if (!group.isMember(req.user._id)) {
        throw new ApiError(403, "You are not a member of this group");
    }

    // Verify paidBy is a member
    if (!group.isMember(paidBy)) {
        throw new ApiError(400, "The payer must be a member of the group");
    }

    // Verify all split users are members
    for (const split of splits) {
        if (!split.user) {
            throw new ApiError(400, "Each split must specify a user");
        }
        if (!group.isMember(split.user)) {
            throw new ApiError(400, `User ${split.user} in splits is not a member of this group`);
        }
    }

    // Create the expense (pre-save hook handles split calculations/validation)
    const expense = await Expense.create({
        description: description.trim(),
        amount,
        currency: currency || group.currency,
        paidBy,
        group: groupId,
        splitType,
        splits,
        category: category || "General",
        date: date || Date.now(),
        addedBy: req.user._id
    });

    // Populate for response
    const populatedExpense = await Expense.findById(expense._id)
        .populate("paidBy", "name email avatar")
        .populate("splits.user", "name email avatar")
        .populate("addedBy", "name email");

    // Emit Socket.IO event
    if (ioInstance) {
        ioInstance.to(`group_${groupId}`).emit("expense_added", { expense: populatedExpense });
    }

    return res.status(201).json(
        new ApiResponse(201, populatedExpense, "Expense added successfully")
    );
});

// ─── GET GROUP EXPENSES (paginated + filtered) ───────────────
export const getGroupExpenses = asyncHandler(async (req, res) => {
    const { groupId } = req.params;
    const {
        page = 1,
        limit = 20,
        category,
        startDate,
        endDate,
        sortBy = "date",
        order = "desc"
    } = req.query;

    // Verify membership
    const group = await Group.findById(groupId);
    if (!group) {
        throw new ApiError(404, "Group not found");
    }
    if (!group.isMember(req.user._id)) {
        throw new ApiError(403, "You are not a member of this group");
    }

    // Build query filter
    const filter = { group: groupId };

    if (category) {
        filter.category = category;
    }

    if (startDate || endDate) {
        filter.date = {};
        if (startDate) filter.date.$gte = new Date(startDate);
        if (endDate) filter.date.$lte = new Date(endDate);
    }

    // Pagination
    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(50, Math.max(1, parseInt(limit)));
    const skip = (pageNum - 1) * limitNum;

    // Sort
    const sortOrder = order === "asc" ? 1 : -1;
    const sortField = ["date", "amount", "createdAt"].includes(sortBy) ? sortBy : "date";

    const [expenses, totalExpenses] = await Promise.all([
        Expense.find(filter)
            .populate("paidBy", "name email avatar")
            .populate("splits.user", "name email avatar")
            .populate("addedBy", "name email")
            .sort({ [sortField]: sortOrder })
            .skip(skip)
            .limit(limitNum),
        Expense.countDocuments(filter)
    ]);

    return res.status(200).json(
        new ApiResponse(200, {
            expenses,
            pagination: {
                currentPage: pageNum,
                totalPages: Math.ceil(totalExpenses / limitNum),
                totalExpenses,
                hasNextPage: pageNum < Math.ceil(totalExpenses / limitNum),
                hasPrevPage: pageNum > 1
            }
        }, "Expenses fetched successfully")
    );
});

// ─── GET EXPENSE BY ID ──────────────────────────────────────
export const getExpenseById = asyncHandler(async (req, res) => {
    const { groupId, expenseId } = req.params;

    const expense = await Expense.findOne({ _id: expenseId, group: groupId })
        .populate("paidBy", "name email avatar")
        .populate("splits.user", "name email avatar")
        .populate("addedBy", "name email");

    if (!expense) {
        throw new ApiError(404, "Expense not found");
    }

    // Verify membership
    const group = await Group.findById(groupId);
    if (!group || !group.isMember(req.user._id)) {
        throw new ApiError(403, "You are not a member of this group");
    }

    return res.status(200).json(
        new ApiResponse(200, expense, "Expense fetched successfully")
    );
});

// ─── UPDATE EXPENSE ──────────────────────────────────────────
export const updateExpense = asyncHandler(async (req, res) => {
    const { groupId, expenseId } = req.params;
    const { description, amount, currency, paidBy, splitType, splits, category, date } = req.body;

    const expense = await Expense.findOne({ _id: expenseId, group: groupId });

    if (!expense) {
        throw new ApiError(404, "Expense not found");
    }

    // Verify user is the one who added it or is a group admin
    const group = await Group.findById(groupId);
    if (!group) {
        throw new ApiError(404, "Group not found");
    }

    const isCreator = expense.addedBy.toString() === req.user._id.toString();
    const isAdmin = group.isAdmin(req.user._id);

    if (!isCreator && !isAdmin) {
        throw new ApiError(403, "Only the expense creator or group admin can update this expense");
    }

    // Update fields
    if (description) expense.description = description.trim();
    if (amount) expense.amount = amount;
    if (currency) expense.currency = currency;
    if (paidBy) expense.paidBy = paidBy;
    if (splitType) expense.splitType = splitType;
    if (splits && splits.length) expense.splits = splits;
    if (category) expense.category = category;
    if (date) expense.date = date;

    // Save triggers pre-save hook for split validation
    await expense.save();

    const populatedExpense = await Expense.findById(expense._id)
        .populate("paidBy", "name email avatar")
        .populate("splits.user", "name email avatar")
        .populate("addedBy", "name email");

    // Emit Socket.IO event
    if (ioInstance) {
        ioInstance.to(`group_${groupId}`).emit("expense_updated", { expense: populatedExpense });
    }

    return res.status(200).json(
        new ApiResponse(200, populatedExpense, "Expense updated successfully")
    );
});

// ─── DELETE EXPENSE ──────────────────────────────────────────
export const deleteExpense = asyncHandler(async (req, res) => {
    const { groupId, expenseId } = req.params;

    const expense = await Expense.findOne({ _id: expenseId, group: groupId });

    if (!expense) {
        throw new ApiError(404, "Expense not found");
    }

    // Verify user is the creator or group admin
    const group = await Group.findById(groupId);
    if (!group) {
        throw new ApiError(404, "Group not found");
    }

    const isCreator = expense.addedBy.toString() === req.user._id.toString();
    const isAdmin = group.isAdmin(req.user._id);

    if (!isCreator && !isAdmin) {
        throw new ApiError(403, "Only the expense creator or group admin can delete this expense");
    }

    await Expense.findByIdAndDelete(expenseId);

    // Emit Socket.IO event
    if (ioInstance) {
        ioInstance.to(`group_${groupId}`).emit("expense_deleted", { expenseId });
    }

    return res.status(200).json(
        new ApiResponse(200, {}, "Expense deleted successfully")
    );
});

// ─── GET EXPENSE STATS ───────────────────────────────────────
export const getExpenseStats = asyncHandler(async (req, res) => {
    const { groupId } = req.params;

    // Verify membership
    const group = await Group.findById(groupId);
    if (!group) {
        throw new ApiError(404, "Group not found");
    }
    if (!group.isMember(req.user._id)) {
        throw new ApiError(403, "You are not a member of this group");
    }

    const groupObjectId = new mongoose.Types.ObjectId(groupId);

    // Aggregation pipeline
    const [stats] = await Expense.aggregate([
        { $match: { group: groupObjectId } },
        {
            $group: {
                _id: null,
                totalSpending: { $sum: "$amount" },
                expenseCount: { $sum: 1 },
                averageExpense: { $avg: "$amount" },
                highestAmount: { $max: "$amount" }
            }
        }
    ]);

    // Category breakdown
    const categoryBreakdown = await Expense.aggregate([
        { $match: { group: groupObjectId } },
        {
            $group: {
                _id: "$category",
                total: { $sum: "$amount" },
                count: { $sum: 1 }
            }
        },
        { $sort: { total: -1 } },
        {
            $project: {
                category: "$_id",
                total: { $round: ["$total", 2] },
                count: 1,
                _id: 0
            }
        }
    ]);

    // Monthly breakdown
    const monthlyBreakdown = await Expense.aggregate([
        { $match: { group: groupObjectId } },
        {
            $group: {
                _id: {
                    year: { $year: "$date" },
                    month: { $month: "$date" }
                },
                total: { $sum: "$amount" },
                count: { $sum: 1 }
            }
        },
        { $sort: { "_id.year": -1, "_id.month": -1 } },
        { $limit: 12 }
    ]);

    // Highest expense
    const highestExpense = await Expense.findOne({ group: groupId })
        .sort({ amount: -1 })
        .select("description amount")
        .lean();

    return res.status(200).json(
        new ApiResponse(200, {
            totalSpending: stats?.totalSpending || 0,
            expenseCount: stats?.expenseCount || 0,
            averageExpense: Math.round((stats?.averageExpense || 0) * 100) / 100,
            highestExpense: highestExpense || null,
            byCategory: categoryBreakdown,
            byMonth: monthlyBreakdown
        }, "Expense stats fetched successfully")
    );
});
