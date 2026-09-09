import { Router, type IRouter } from "express";
import assetsRouter from "./assets";
import healthRouter from "./health";
import swapRouter from "./swap";
import portfolioRouter from "./portfolio";
import exploreRouter from "./explore";

const router: IRouter = Router();

router.use(healthRouter);
router.use(assetsRouter);
router.use(swapRouter);
router.use(portfolioRouter);
router.use(exploreRouter);

export default router;
