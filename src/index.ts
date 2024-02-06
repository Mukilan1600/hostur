import express from "express";
import dotenv from "dotenv";
import passport from "passport";
dotenv.config();

import "./auth/passport-config";

import Routes from "./routes";

const app = express();

app.use(express.json());

app.use("/", Routes);

app.get("/temp", passport.authenticate("jwt", { session: false }), (req, res) => {
    return res.json(req.user);
});

const PORT = 3000 || process.env.PORT;

app.listen(PORT, () => console.log(`Running on port ${PORT}...`));
