import { Router } from "express";
import {
    createGroup,
    getUserGroups,
    getGroupById,
    updateGroup,
    deleteGroup,
    addMember,
    removeMember,
    joinByInviteCode
} from "../controllers/groupController.js";
import { verifyJWT } from "../middleware/auth.middleware.js";

const router = Router();

// All group routes require authentication
router.use(verifyJWT);

router.route("/")
    .get(getUserGroups)
    .post(createGroup);

router.post("/join", joinByInviteCode);

router.route("/:groupId")
    .get(getGroupById)
    .patch(updateGroup)
    .delete(deleteGroup);

router.post("/:groupId/members", addMember);
router.delete("/:groupId/members/:userId", removeMember);

export default router;
