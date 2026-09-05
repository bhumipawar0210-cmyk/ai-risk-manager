import { Router, type IRouter } from "express";
import healthRouter from "./health";
import riskRouter from "./risk";

const router: IRouter = Router();

router.use(healthRouter);
router.use(riskRouter);

export default router;
