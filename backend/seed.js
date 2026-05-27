import mongoose from "mongoose";
import dotenv from "dotenv";
import bcrypt from "bcrypt";
import User from "./models/userModel.js";
import Group from "./models/groupModel.js";
import Expense from "./models/expenseModel.js";
import Settlement from "./models/settlementModel.js";
import { SPLIT_TYPES } from "./config/constants.js";

dotenv.config({ path: "./.env" });

const seedDB = async () => {
    try {
        console.log("Connecting to MongoDB for seeding...");
        await mongoose.connect(process.env.MONGODB_URI);
        console.log("Connected successfully!");

        // 1. Clean existing tables
        console.log("Cleaning existing database collections...");
        await Promise.all([
            User.deleteMany({}),
            Group.deleteMany({}),
            Expense.deleteMany({}),
            Settlement.deleteMany({})
        ]);
        console.log("Database cleared.");

        // 2. Create users (passwords are auto-hashed by userSchema pre-save hook)
        console.log("Seeding users...");
        const users = await User.create([
            {
                name: "Demo User",
                email: "user@example.com",
                password: "password123",
                avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80"
            },
            {
                name: "Rahul",
                email: "rahul@example.com",
                password: "password123",
                avatar: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=100&q=80"
            },
            {
                name: "Priya",
                email: "priya@example.com",
                password: "password123",
                avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=100&q=80"
            },
            {
                name: "Amit",
                email: "amit@example.com",
                password: "password123",
                avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=100&q=80"
            }
        ]);

        const [demoUser, rahul, priya, amit] = users;
        console.log(`Created ${users.length} users successfully!`);

        // 3. Create groups
        console.log("Seeding groups...");
        const groups = await Group.create([
            {
                name: "Goa Trip 🏖️",
                description: "Expenses for our Goa trip in May",
                currency: "₹",
                createdBy: demoUser._id,
                members: [
                    { user: demoUser._id, role: "admin" },
                    { user: rahul._id, role: "member" },
                    { user: priya._id, role: "member" },
                    { user: amit._id, role: "member" }
                ]
            },
            {
                name: "Pune Flatmates 🏠",
                description: "Monthly apartment expenses",
                currency: "₹",
                createdBy: rahul._id,
                members: [
                    { user: demoUser._id, role: "member" },
                    { user: rahul._id, role: "admin" },
                    { user: priya._id, role: "member" }
                ]
            },
            {
                name: "Dinner & Drinks 🍕",
                description: "Weekend party splits",
                currency: "₹",
                createdBy: priya._id,
                members: [
                    { user: demoUser._id, role: "member" },
                    { user: rahul._id, role: "member" },
                    { user: priya._id, role: "admin" },
                    { user: amit._id, role: "member" }
                ]
            },
            {
                name: "Office Lunch 🍔",
                description: "Daily office lunch splits",
                currency: "₹",
                createdBy: demoUser._id,
                members: [
                    { user: demoUser._id, role: "admin" },
                    { user: rahul._id, role: "member" },
                    { user: priya._id, role: "member" }
                ]
            }
        ]);

        const [goaTrip, puneFlatmates, dinnerDrinks, officeLunch] = groups;
        console.log(`Created ${groups.length} groups successfully!`);

        // 4. Seed Expenses and settlements
        console.log("Seeding expenses and transactions...");

        // Goa Trip Expenses (Equal Splits)
        // Description: Flight Booking, Rahul paid 45,000 INR
        const exp1 = await Expense.create({
            description: "Flight to Goa",
            amount: 45000,
            currency: "₹",
            paidBy: rahul._id,
            group: goaTrip._id,
            splitType: SPLIT_TYPES.EQUAL,
            addedBy: rahul._id,
            splits: users.map(u => ({ user: u._id, amount: 11250 })),
            date: new Date("2026-05-10")
        });

        // Description: Villa Stay, Demo User paid 60,000 INR
        const exp2 = await Expense.create({
            description: "Villa Resort Booking",
            amount: 60000,
            currency: "₹",
            paidBy: demoUser._id,
            group: goaTrip._id,
            splitType: SPLIT_TYPES.EQUAL,
            addedBy: demoUser._id,
            splits: users.map(u => ({ user: u._id, amount: 15000 })),
            date: new Date("2026-05-12")
        });

        // Description: Cab to Beach, Priya paid 2,400 INR
        await Expense.create({
            description: "Beach Cab Rides",
            amount: 2400,
            currency: "₹",
            paidBy: priya._id,
            group: goaTrip._id,
            splitType: SPLIT_TYPES.EQUAL,
            addedBy: priya._id,
            splits: users.map(u => ({ user: u._id, amount: 600 })),
            date: new Date("2026-05-13")
        });

        // Description: Seafood Dinner, Amit paid 8,000 INR
        await Expense.create({
            description: "Seafood Dinner Party",
            amount: 8000,
            currency: "₹",
            paidBy: amit._id,
            group: goaTrip._id,
            splitType: SPLIT_TYPES.EQUAL,
            addedBy: amit._id,
            splits: users.map(u => ({ user: u._id, amount: 2000 })),
            date: new Date("2026-05-14")
        });

        // Add a demo payment/settlement (Rahul paid Demo User 5000 INR)
        await Settlement.create({
            group: goaTrip._id,
            paidBy: rahul._id,
            paidTo: demoUser._id,
            amount: 5000,
            currency: "₹",
            note: "Partial settlement for villa resort"
        });


        // Pune Flatmates Expenses
        // Rent: Rahul paid 24,000
        await Expense.create({
            description: "Apartment Rent",
            amount: 24000,
            currency: "₹",
            paidBy: rahul._id,
            group: puneFlatmates._id,
            splitType: SPLIT_TYPES.EQUAL,
            addedBy: rahul._id,
            splits: [demoUser, rahul, priya].map(u => ({ user: u._id, amount: 8000 })),
            date: new Date("2026-05-01")
        });

        // Groceries: Demo User paid 6,650
        await Expense.create({
            description: "Weekly Groceries",
            amount: 6650,
            currency: "₹",
            paidBy: demoUser._id,
            group: puneFlatmates._id,
            splitType: SPLIT_TYPES.EQUAL,
            addedBy: demoUser._id,
            splits: [demoUser, rahul, priya].map(u => ({ user: u._id, amount: 2216.66 })),
            date: new Date("2026-05-05")
        });


        // Dinner & Drinks Expenses
        // Priya paid 12,000
        await Expense.create({
            description: "Pizza & Drinks Party",
            amount: 12000,
            currency: "₹",
            paidBy: priya._id,
            group: dinnerDrinks._id,
            splitType: SPLIT_TYPES.EQUAL,
            addedBy: priya._id,
            splits: users.map(u => ({ user: u._id, amount: 3000 })),
            date: new Date("2026-05-20")
        });

        // Demo User settled up with Priya: paid 3000
        await Settlement.create({
            group: dinnerDrinks._id,
            paidBy: demoUser._id,
            paidTo: priya._id,
            amount: 3000,
            currency: "₹",
            note: "Pizza night payout"
        });


        // Office Lunch Expenses
        // Lunch: Demo User paid 1,200
        await Expense.create({
            description: "Subway Lunches",
            amount: 1200,
            currency: "₹",
            paidBy: demoUser._id,
            group: officeLunch._id,
            splitType: SPLIT_TYPES.EQUAL,
            addedBy: demoUser._id,
            splits: [demoUser, rahul, priya].map(u => ({ user: u._id, amount: 400 })),
            date: new Date("2026-05-25")
        });

        console.log("Seeding transaction history completed successfully!");
        console.log("\n=============================================");
        console.log("🎉 DATABASE SEEDED SUCCESSFULLY 🎉");
        console.log("=============================================");
        console.log("Demo Login Credentials:");
        console.log("Email:    user@example.com");
        console.log("Password: password123");
        console.log("=============================================");

        await mongoose.connection.close();
        process.exit(0);
    } catch (err) {
        console.error("Seeding failed:", err);
        process.exit(1);
    }
};

seedDB();
