import mongoose from "mongoose";
import { SPLIT_TYPES, CURRENCIES, EXPENSE_CATEGORIES } from "../config/constants.js";

const splitSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    amount: {
        type: Number,
        required: true,
        min: [0, "Split amount cannot be negative"]
    },
    percentage: {
        type: Number,
        min: 0,
        max: 100
    }
}, { _id: false });

const expenseSchema = new mongoose.Schema({
    description: {
        type: String,
        required: [true, "Description is required"],
        trim: true,
        maxlength: [200, "Description cannot exceed 200 characters"]
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
    paidBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: [true, "Payer is required"]
    },
    group: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Group",
        required: [true, "Group is required"]
    },
    splitType: {
        type: String,
        required: [true, "Split type is required"],
        enum: Object.values(SPLIT_TYPES)
    },
    splits: {
        type: [splitSchema],
        validate: {
            validator: function (splits) {
                return splits.length >= 1;
            },
            message: "At least one split entry is required"
        }
    },
    date: {
        type: Date,
        default: Date.now
    },
    category: {
        type: String,
        default: "General",
        enum: EXPENSE_CATEGORIES
    },
    addedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    }
}, { timestamps: true });

// Indexes for efficient querying
expenseSchema.index({ group: 1, date: -1 });
expenseSchema.index({ paidBy: 1 });
expenseSchema.index({ "splits.user": 1 });

// Pre-save hook to calculate/validate splits
expenseSchema.pre("save", function (next) {
    const expense = this;

    if (expense.splitType === SPLIT_TYPES.EQUAL) {
        // Auto-calculate equal split amounts
        const splitAmount = Math.round((expense.amount / expense.splits.length) * 100) / 100;
        const remainder = Math.round((expense.amount - splitAmount * expense.splits.length) * 100) / 100;

        expense.splits.forEach((split, index) => {
            // Give the remainder to the first person to avoid rounding issues
            split.amount = index === 0 ? splitAmount + remainder : splitAmount;
        });
    } else if (expense.splitType === SPLIT_TYPES.UNEQUAL) {
        // Validate that split amounts sum to total
        const total = expense.splits.reduce((sum, split) => sum + split.amount, 0);
        const roundedTotal = Math.round(total * 100) / 100;
        const roundedAmount = Math.round(expense.amount * 100) / 100;

        if (roundedTotal !== roundedAmount) {
            return next(new Error(`Split amounts (${roundedTotal}) must equal the total amount (${roundedAmount})`));
        }
    } else if (expense.splitType === SPLIT_TYPES.PERCENTAGE) {
        // Validate percentages sum to 100 and compute amounts
        const totalPercentage = expense.splits.reduce((sum, split) => sum + (split.percentage || 0), 0);

        if (Math.round(totalPercentage) !== 100) {
            return next(new Error(`Split percentages must sum to 100 (got ${totalPercentage})`));
        }

        expense.splits.forEach(split => {
            split.amount = Math.round((split.percentage / 100) * expense.amount * 100) / 100;
        });
    }

    next();
});

const Expense = mongoose.model("Expense", expenseSchema);
export default Expense;
