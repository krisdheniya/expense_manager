export const SPLIT_TYPES = {
    EQUAL: "equal",
    UNEQUAL: "unequal",
    PERCENTAGE: "percentage"
};

export const CURRENCIES = ["₹", "$", "€", "£"];

export const EXPENSE_CATEGORIES = [
    "Food",
    "Travel",
    "Rent",
    "Shopping",
    "Bills",
    "Entertainment",
    "Transport",
    "General",
    "Other"
];

export const SETTLEMENT_STATUS = {
    PENDING: "pending",
    SETTLED: "settled"
};

export const COOKIE_OPTIONS = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
};
