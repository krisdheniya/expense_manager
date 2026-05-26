import { Router } from "express";
import {
    addExpense,
    getGroupExpenses,
    getExpenseById,
    updateExpense,
    deleteExpense,
    getExpenseStats
} from "../controllers/expenseController.js";
import { verifyJWT } from "../middleware/auth.middleware.js";

const router = Router({ mergeParams: true }); // mergeParams to access :groupId from parent

router.use(verifyJWT);

router.route("/")
    .get(getGroupExpenses)
    .post(addExpense);

router.get("/stats", getExpenseStats);

router.route("/:expenseId")
    .get(getExpenseById)
    .patch(updateExpense)
    .delete(deleteExpense);

export default router;
