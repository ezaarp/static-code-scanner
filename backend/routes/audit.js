import express from "express";
import multer from "multer";
import { handleAudit } from "../controllers/auditController.js";

const router = express.Router();
const upload = multer({ dest: "uploads/" });

router.post("/", upload.single("archive"), handleAudit);

export default router;
