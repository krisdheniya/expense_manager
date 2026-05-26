import mongoose from "mongoose";
import Settlement from "../models/settlementModel.js";
import Group from "../models/groupModel.js";
import Expense from "../models/expenseModel.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";
import { ioInstance } from "../socket/socketHandler.js";

// ─── CREATE SETTLEMENT ───────────────────────────────────────
export const createSettlement = asyncHandler(async (req, res) => {
    const { groupId } = req.params;
    const { paidTo, amount, currency, note } = req.body;

    if (!paidTo || !amount) {
        throw new ApiError(400, "paidTo and amount are required");
    }

    if (amount <= 0) {
        throw new ApiError(400, "Amount must be greater than 0");
    }

    // Verify group exists
    const group = await Group.findById(groupId);
    if (!group) {
        throw new ApiError(404, "Group not found");
    }

    // Verify both users are members
    if (!group.isMember(req.user._id)) {
        throw new ApiError(403, "You are not a member of this group");
    }
    if (!group.isMember(paidTo)) {
        throw new ApiError(400, "The receiver must be a member of the group");
    }

    // Cannot settle with yourself
    if (req.user._id.toString() === paidTo) {
        throw new ApiError(400, "You cannot settle a payment with yourself");
    }

    const settlement = await Settlement.create({
        group: groupId,
        paidBy: req.user._id,
        paidTo,
        amount,
        currency: currency || group.currency,
        note: note || ""
    });

    const populatedSettlement = await Settlement.findById(settlement._id)
        .populate("paidBy", "name email avatar")
        .populate("paidTo", "name email avatar");

    // Emit Socket.IO event
    if (ioInstance) {
        ioInstance.to(`group_${groupId}`).emit("settlement_created", {
            settlement: populatedSettlement
        });
    }

    return res.status(201).json(
        new ApiResponse(201, populatedSettlement, "Settlement recorded successfully")
    );
});

// ─── GET GROUP SETTLEMENTS ───────────────────────────────────
export const getGroupSettlements = asyncHandler(async (req, res) => {
    const { groupId } = req.params;
    const { page = 1, limit = 20 } = req.query;

    // Verify membership
    const group = await Group.findById(groupId);
    if (!group) {
        throw new ApiError(404, "Group not found");
    }
    if (!group.isMember(req.user._id)) {
        throw new ApiError(403, "You are not a member of this group");
    }

    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(50, Math.max(1, parseInt(limit)));
    const skip = (pageNum - 1) * limitNum;

    const [settlements, totalSettlements] = await Promise.all([
        Settlement.find({ group: groupId })
            .populate("paidBy", "name email avatar")
            .populate("paidTo", "name email avatar")
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limitNum),
        Settlement.countDocuments({ group: groupId })
    ]);

    return res.status(200).json(
        new ApiResponse(200, {
            settlements,
            pagination: {
                currentPage: pageNum,
                totalPages: Math.ceil(totalSettlements / limitNum),
                totalSettlements,
                hasNextPage: pageNum < Math.ceil(totalSettlements / limitNum),
                hasPrevPage: pageNum > 1
            }
        }, "Settlements fetched successfully")
    );
});

// ─── GET GROUP BALANCES (simplified debts) ───────────────────
export const getGroupBalances = asyncHandler(async (req, res) => {
    const { groupId } = req.params;

    // Verify membership
    const group = await Group.findById(groupId)
        .populate("members.user", "name email avatar");

    if (!group) {
        throw new ApiError(404, "Group not found");
    }
    if (!group.isMember(req.user._id)) {
        throw new ApiError(403, "You are not a member of this group");
    }

    // Build balance map
    const balanceMap = {};

    // Initialize all members with 0
    group.members.forEach(m => {
        balanceMap[m.user._id.toString()] = 0;
    });

    // Process expenses
    const expenses = await Expense.find({ group: groupId });

    for (const expense of expenses) {
        const payerId = expense.paidBy.toString();

        for (const split of expense.splits) {
            const userId = split.user.toString();
            balanceMap[userId] -= split.amount;
            balanceMap[payerId] += split.amount;
        }
    }

    // Process settlements
    const settlements = await Settlement.find({ group: groupId });

    for (const settlement of settlements) {
        const payerId = settlement.paidBy.toString();
        const receiverId = settlement.paidTo.toString();
        balanceMap[payerId] += settlement.amount;
        balanceMap[receiverId] -= settlement.amount;
    }

    // Build member balances array
    const memberMap = {};
    group.members.forEach(m => {
        memberMap[m.user._id.toString()] = m.user;
    });

    const memberBalances = Object.entries(balanceMap).map(([userId, balance]) => ({
        user: memberMap[userId] || { _id: userId, name: "Unknown" },
        netBalance: Math.round(balance * 100) / 100
    }));

    // Compute simplified debts
    const creditors = [];
    const debtors = [];

    for (const [userId, balance] of Object.entries(balanceMap)) {
        const rounded = Math.round(balance * 100) / 100;
        if (rounded > 0.01) {
            creditors.push({ userId, amount: rounded });
        } else if (rounded < -0.01) {
            debtors.push({ userId, amount: Math.abs(rounded) });
        }
    }

    creditors.sort((a, b) => b.amount - a.amount);
    debtors.sort((a, b) => b.amount - a.amount);

    const simplifiedDebts = [];
    let i = 0, j = 0;

    while (i < debtors.length && j < creditors.length) {
        const transfer = Math.min(debtors[i].amount, creditors[j].amount);
        const roundedTransfer = Math.round(transfer * 100) / 100;

        if (roundedTransfer > 0) {
            simplifiedDebts.push({
                from: memberMap[debtors[i].userId] || { _id: debtors[i].userId, name: "Unknown" },
                to: memberMap[creditors[j].userId] || { _id: creditors[j].userId, name: "Unknown" },
                amount: roundedTransfer
            });
        }

        debtors[i].amount -= transfer;
        creditors[j].amount -= transfer;

        if (debtors[i].amount < 0.01) i++;
        if (creditors[j].amount < 0.01) j++;
    }

    return res.status(200).json(
        new ApiResponse(200, {
            memberBalances,
            simplifiedDebts
        }, "Balances calculated successfully")
    );
});
