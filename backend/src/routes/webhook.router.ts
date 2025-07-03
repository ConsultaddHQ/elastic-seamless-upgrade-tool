import { Router } from "express";
import { handleAnsibleWebhook } from "../controllers/ansible-webhooks.controller";
const router = Router();

router.post("/clusters/:clusterId/update-status", handleAnsibleWebhook);

export default router;
