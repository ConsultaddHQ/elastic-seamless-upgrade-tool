import { Router } from "express";
import { updateSettings, getSettings } from "../controllers/settings.controller";
const router = Router();

router.post("/", updateSettings);
router.get("/", getSettings);

export default router;
