import { Router } from "express";
import passport from "passport";
import AuthRoutes from "./auth";
import ProjectRoutes from "./project";
import FilesRoutes from "./files";

const router = Router();

router.use("/project", passport.authenticate("jwt", { session: false }), ProjectRoutes);
router.use("/files", passport.authenticate("jwt", { session: false }), FilesRoutes);
router.use("/auth", AuthRoutes);

export default router;
