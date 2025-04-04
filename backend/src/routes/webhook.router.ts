import { Router } from "express";
import { handleAnsibleWebhook } from "../controllers/ansible-webhooks";
const router = Router();

router.post("/clusters/:clusterId/update-status", handleAnsibleWebhook);

export default router;
