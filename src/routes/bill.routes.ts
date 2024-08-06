import { Router } from "express";
import BillController from "../controllers/bill.controller";
import AuthInterceptor from "../interceptors/auth.interceptor";

const router = Router();

router.post("/", AuthInterceptor.intercept, BillController.fetch);

export default router;
