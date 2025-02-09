import express from "express";
const router = express();
import authRouter from "./auth.js";

router.use("/", authRouter);

module.exports = router;