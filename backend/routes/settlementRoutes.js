import { Router } from "express";
import {
    createSettlement,
    getGroupSettlements,
    getGroupBalances
} from "../controllers/settlementController.js";
import { verifyJWT } from "../middleware/auth.middleware.js";

const router = Router({ mergeParams: true }); // mergeParams to access :groupId

router.use(verifyJWT);

router.route("/")
    .get(getGroupSettlements)
    .post(createSettlement);

router.get("/balances", getGroupBalances);

export default router;
