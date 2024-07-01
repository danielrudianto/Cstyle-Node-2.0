import { Router } from "express";
import MigrationController from "../controllers/migration.controller";

const router = Router();

router.post("/", MigrationController.sync);

export default router;
