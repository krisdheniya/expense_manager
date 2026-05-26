import mongoose from "mongoose";
import { SETTLEMENT_STATUS, CURRENCIES } from "../config/constants.js";

const settlementSchema = new mongoose.Schema({
    group: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Group",
        required: [true, "Group is required"]
    },
    paidBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: [true, "Payer is required"]
    },
    paidTo: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: [true, "Receiver is required"]
    },
    amount: {
        type: Number,
        required: [true, "Amount is required"],
        min: [0.01, "Amount must be greater than 0"]
    },
    currency: {
        type: String,
        default: "₹",
        enum: CURRENCIES
    },
    status: {
        type: String,
        enum: Object.values(SETTLEMENT_STATUS),
        default: SETTLEMENT_STATUS.SETTLED
    },
    note: {
        type: String,
        maxlength: [200, "Note cannot exceed 200 characters"],
        default: ""
    }
}, { timestamps: true });

// Indexes
settlementSchema.index({ group: 1, createdAt: -1 });
settlementSchema.index({ paidBy: 1, paidTo: 1 });

const Settlement = mongoose.model("Settlement", settlementSchema);
export default Settlement;
