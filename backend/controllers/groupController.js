import Group from "../models/groupModel.js";
import User from "../models/userModel.js";
import Expense from "../models/expenseModel.js";
import Settlement from "../models/settlementModel.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";
import { ioInstance } from "../socket/socketHandler.js";

// Helper: compute net balances for a group
const computeGroupBalances = async (groupId) => {
    const balanceMap = {};

    // Get all expenses for this group
    const expenses = await Expense.find({ group: groupId });

    for (const expense of expenses) {
        const payerId = expense.paidBy.toString();

        for (const split of expense.splits) {
            const userId = split.user.toString();
            if (!balanceMap[userId]) balanceMap[userId] = 0;
            if (!balanceMap[payerId]) balanceMap[payerId] = 0;

            // The user owes this split amount
            balanceMap[userId] -= split.amount;
            // The payer is owed this split amount
            balanceMap[payerId] += split.amount;
        }
    }

    // Get all settlements for this group
    const settlements = await Settlement.find({ group: groupId });

    for (const settlement of settlements) {
        const payerId = settlement.paidBy.toString();
        const receiverId = settlement.paidTo.toString();

        if (!balanceMap[payerId]) balanceMap[payerId] = 0;
        if (!balanceMap[receiverId]) balanceMap[receiverId] = 0;

        // Payer's credit decreases (they paid off debt)
        balanceMap[payerId] += settlement.amount;
        // Receiver's credit increases (they received payment)
        balanceMap[receiverId] -= settlement.amount;
    }

    return balanceMap;
};

// ─── CREATE GROUP ────────────────────────────────────────────
export const createGroup = asyncHandler(async (req, res) => {
    const { name, description, currency } = req.body;

    if (!name || !name.trim()) {
        throw new ApiError(400, "Group name is required");
    }

    const group = await Group.create({
        name: name.trim(),
        description: description?.trim() || "",
        currency: currency || "₹",
        createdBy: req.user._id,
        members: [{ user: req.user._id, role: "admin" }]
    });

    const populatedGroup = await Group.findById(group._id)
        .populate("members.user", "name email avatar")
        .populate("createdBy", "name email");

    return res.status(201).json(
        new ApiResponse(201, populatedGroup, "Group created successfully")
    );
});

// ─── GET USER'S GROUPS (with balances) ───────────────────────
export const getUserGroups = asyncHandler(async (req, res) => {
    const groups = await Group.find({ "members.user": req.user._id })
        .populate("members.user", "name email avatar")
        .sort({ updatedAt: -1 });

    // Compute balances for each group
    const groupsWithBalances = await Promise.all(
        groups.map(async (group) => {
            const balanceMap = await computeGroupBalances(group._id);
            const userBalance = balanceMap[req.user._id.toString()] || 0;
            const netBalance = Math.round(userBalance * 100) / 100;

            return {
                _id: group._id,
                name: group.name,
                description: group.description,
                members: group.members.length,
                currency: group.currency,
                inviteCode: group.inviteCode,
                balance: netBalance,
                youOwe: netBalance < 0,
                createdAt: group.createdAt,
                updatedAt: group.updatedAt
            };
        })
    );

    return res.status(200).json(
        new ApiResponse(200, groupsWithBalances, "Groups fetched successfully")
    );
});

// ─── GET GROUP BY ID (with member details + balances) ────────
export const getGroupById = asyncHandler(async (req, res) => {
    const { groupId } = req.params;

    const group = await Group.findById(groupId)
        .populate("members.user", "name email avatar")
        .populate("createdBy", "name email");

    if (!group) {
        throw new ApiError(404, "Group not found");
    }

    if (!group.isMember(req.user._id)) {
        throw new ApiError(403, "You are not a member of this group");
    }

    // Compute balances
    const balanceMap = await computeGroupBalances(groupId);

    // Get total expenses
    const totalExpenses = await Expense.aggregate([
        { $match: { group: group._id } },
        { $group: { _id: null, total: { $sum: "$amount" } } }
    ]);

    // Build member balances
    const memberBalances = group.members.map(member => {
        const userId = member.user._id.toString();
        return {
            user: member.user,
            role: member.role,
            netBalance: Math.round((balanceMap[userId] || 0) * 100) / 100
        };
    });

    // Compute simplified debts
    const simplifiedDebts = computeSimplifiedDebts(balanceMap, group.members);

    const groupData = {
        _id: group._id,
        name: group.name,
        description: group.description,
        currency: group.currency,
        inviteCode: group.inviteCode,
        createdBy: group.createdBy,
        members: memberBalances,
        totalExpenses: totalExpenses[0]?.total || 0,
        simplifiedDebts,
        createdAt: group.createdAt,
        updatedAt: group.updatedAt
    };

    return res.status(200).json(
        new ApiResponse(200, groupData, "Group details fetched successfully")
    );
});

// Helper: simplify debts using greedy algorithm
const computeSimplifiedDebts = (balanceMap, members) => {
    const debts = [];
    const memberMap = {};

    // Build a map of userId → user info
    members.forEach(m => {
        memberMap[m.user._id.toString()] = m.user;
    });

    // Separate into creditors and debtors
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

    // Sort by amount descending
    creditors.sort((a, b) => b.amount - a.amount);
    debtors.sort((a, b) => b.amount - a.amount);

    // Match debtors with creditors
    let i = 0, j = 0;
    while (i < debtors.length && j < creditors.length) {
        const transfer = Math.min(debtors[i].amount, creditors[j].amount);
        const roundedTransfer = Math.round(transfer * 100) / 100;

        if (roundedTransfer > 0) {
            debts.push({
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

    return debts;
};

// ─── UPDATE GROUP ────────────────────────────────────────────
export const updateGroup = asyncHandler(async (req, res) => {
    const { groupId } = req.params;
    const { name, description, currency } = req.body;

    const group = await Group.findById(groupId);

    if (!group) {
        throw new ApiError(404, "Group not found");
    }

    if (!group.isAdmin(req.user._id)) {
        throw new ApiError(403, "Only group admins can update group settings");
    }

    const updateFields = {};
    if (name) updateFields.name = name.trim();
    if (description !== undefined) updateFields.description = description.trim();
    if (currency) updateFields.currency = currency;

    if (Object.keys(updateFields).length === 0) {
        throw new ApiError(400, "No fields to update");
    }

    const updatedGroup = await Group.findByIdAndUpdate(
        groupId,
        { $set: updateFields },
        { new: true, runValidators: true }
    ).populate("members.user", "name email avatar");

    return res.status(200).json(
        new ApiResponse(200, updatedGroup, "Group updated successfully")
    );
});

// ─── DELETE GROUP ────────────────────────────────────────────
export const deleteGroup = asyncHandler(async (req, res) => {
    const { groupId } = req.params;

    const group = await Group.findById(groupId);

    if (!group) {
        throw new ApiError(404, "Group not found");
    }

    if (group.createdBy.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "Only the group creator can delete the group");
    }

    // Delete all associated data
    await Promise.all([
        Expense.deleteMany({ group: groupId }),
        Settlement.deleteMany({ group: groupId }),
        Group.findByIdAndDelete(groupId)
    ]);

    // Notify members via Socket.IO
    if (ioInstance) {
        ioInstance.to(`group_${groupId}`).emit("group_deleted", { groupId });
    }

    return res.status(200).json(
        new ApiResponse(200, {}, "Group and all associated data deleted successfully")
    );
});

// ─── ADD MEMBER ──────────────────────────────────────────────
export const addMember = asyncHandler(async (req, res) => {
    const { groupId } = req.params;
    const { email } = req.body;

    if (!email) {
        throw new ApiError(400, "Email is required to add a member");
    }

    const group = await Group.findById(groupId);

    if (!group) {
        throw new ApiError(404, "Group not found");
    }

    if (!group.isAdmin(req.user._id)) {
        throw new ApiError(403, "Only group admins can add members");
    }

    const userToAdd = await User.findOne({ email: email.toLowerCase() });
    if (!userToAdd) {
        throw new ApiError(404, "No user found with this email");
    }

    if (group.isMember(userToAdd._id)) {
        throw new ApiError(400, "User is already a member of this group");
    }

    group.members.push({ user: userToAdd._id, role: "member" });
    await group.save();

    const updatedGroup = await Group.findById(groupId)
        .populate("members.user", "name email avatar");

    // Notify via Socket.IO
    if (ioInstance) {
        ioInstance.to(`group_${groupId}`).emit("member_joined", {
            groupId,
            user: { _id: userToAdd._id, name: userToAdd.name, email: userToAdd.email }
        });
    }

    return res.status(200).json(
        new ApiResponse(200, updatedGroup, "Member added successfully")
    );
});

// ─── REMOVE MEMBER ───────────────────────────────────────────
export const removeMember = asyncHandler(async (req, res) => {
    const { groupId, userId } = req.params;

    const group = await Group.findById(groupId);

    if (!group) {
        throw new ApiError(404, "Group not found");
    }

    if (!group.isAdmin(req.user._id)) {
        throw new ApiError(403, "Only group admins can remove members");
    }

    if (!group.isMember(userId)) {
        throw new ApiError(400, "User is not a member of this group");
    }

    // Prevent removing the sole admin
    const adminCount = group.members.filter(m => m.role === "admin").length;
    if (group.isAdmin(userId) && adminCount <= 1) {
        throw new ApiError(400, "Cannot remove the only admin. Transfer admin role first.");
    }

    group.members = group.members.filter(m => m.user.toString() !== userId);
    await group.save();

    const updatedGroup = await Group.findById(groupId)
        .populate("members.user", "name email avatar");

    // Notify via Socket.IO
    if (ioInstance) {
        ioInstance.to(`group_${groupId}`).emit("member_removed", { groupId, userId });
    }

    return res.status(200).json(
        new ApiResponse(200, updatedGroup, "Member removed successfully")
    );
});

// ─── JOIN BY INVITE CODE ─────────────────────────────────────
export const joinByInviteCode = asyncHandler(async (req, res) => {
    const { inviteCode } = req.body;

    if (!inviteCode) {
        throw new ApiError(400, "Invite code is required");
    }

    const group = await Group.findOne({ inviteCode });

    if (!group) {
        throw new ApiError(404, "Invalid invite code — no group found");
    }

    if (group.isMember(req.user._id)) {
        throw new ApiError(400, "You are already a member of this group");
    }

    group.members.push({ user: req.user._id, role: "member" });
    await group.save();

    const updatedGroup = await Group.findById(group._id)
        .populate("members.user", "name email avatar");

    // Notify via Socket.IO
    if (ioInstance) {
        ioInstance.to(`group_${group._id}`).emit("member_joined", {
            groupId: group._id,
            user: { _id: req.user._id, name: req.user.name, email: req.user.email }
        });
    }

    return res.status(200).json(
        new ApiResponse(200, updatedGroup, "Successfully joined the group")
    );
});
