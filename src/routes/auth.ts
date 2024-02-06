import { Router } from "express";
import passport from "passport";
import jwt from "jsonwebtoken";

const router = Router();

router.post("/login", async (req, res, next) => {
    try {
        await passport.authenticate("local", { session: false }, async (err, user, info) => {
            if (err || !user) return res.status(401).json({ error: info.message });

            req.login(user, { session: false }, async (err) => {
                if (err) return res.status(500).json({ error: "Something went wrong" });

                const user = { user: "root" };
                const jwtOpts: jwt.SignOptions = {
                    expiresIn: "7d",
                };
                const jwtTok = jwt.sign(user, process.env.JWT_SECRET || "", jwtOpts);

                return res.json({ jwtTok: jwtTok });
            });
        })(req, res, next);
    } catch (err) {
        return res.status(500).json({ error: "Something went wrong" });
    }
});

export default router;
