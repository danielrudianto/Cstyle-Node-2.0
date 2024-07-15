import { Router } from "express";
import ReportController from "../controllers/report.controller";

const router = Router();

router.post("/sales", ReportController.fetchSalesReport);
router.post("/sales-product", ReportController.fetchSalesProductReport);

export default router;
