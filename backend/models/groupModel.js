import mongoose from "mongoose";
import crypto from "crypto";
import { CURRENCIES } from "../config/constants.js";

const memberSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    role: {
        type: String,
        enum: ["admin", "member"],
        default: "member"
    }
}, { _id: false });

const groupSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, "Group name is required"],
        trim: true,
        maxlength: [100, "Group name cannot exceed 100 characters"]
    },
    description: {
        type: String,
        trim: true,
        maxlength: [500, "Description cannot exceed 500 characters"],
        default: ""
    },
    members: {
        type: [memberSchema],
        validate: {
            validator: function (members) {
                return members.length >= 1;
            },
            message: "A group must have at least one member"
        }
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    inviteCode: {
        type: String,
        unique: true
    },
    currency: {
        type: String,
        default: "₹",
        enum: CURRENCIES
    }
}, { timestamps: true });

// Indexes
groupSchema.index({ "members.user": 1 });
groupSchema.index({ inviteCode: 1 });

// Auto-generate invite code before first save
groupSchema.pre("save", function (next) {
    if (!this.inviteCode) {
        this.inviteCode = crypto.randomBytes(4).toString("hex");
    }
    next();
});

// Instance methods
groupSchema.methods.isMember = function (userId) {
    return this.members.some(member => member.user.toString() === userId.toString());
};

groupSchema.methods.isAdmin = function (userId) {
    const member = this.members.find(m => m.user.toString() === userId.toString());
    return member ? member.role === "admin" : false;
};

// Virtual
groupSchema.virtual("memberCount").get(function () {
    return this.members.length;
});

// Ensure virtuals are included in JSON
groupSchema.set("toJSON", { virtuals: true });
groupSchema.set("toObject", { virtuals: true });

const Group = mongoose.model("Group", groupSchema);
export default Group;
