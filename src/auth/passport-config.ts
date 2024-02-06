import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { ExtractJwt, Strategy as JWTStrategy } from "passport-jwt";
import bcrypt from "bcrypt";

passport.use(
    new LocalStrategy({ usernameField: "user", passwordField: "pass" }, async (username, password, done) => {
        try {
            const isValid = await bcrypt.compare(password, process.env.pass || "");
            if (isValid) return done(null, { user: "root" });
            return done(null, false, { message: "Invalid password" });
        } catch (err) {
            return done(err, null);
        }
    })
);

passport.use(
    new JWTStrategy(
        { secretOrKey: process.env.JWT_SECRET, jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken() },
        (token, done) => {
            try {
                return done(null, token);
            } catch (error) {
                console.log(error);
            }
        }
    )
);
