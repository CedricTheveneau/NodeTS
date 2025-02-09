import express from "express";
import userCtrl from "../controllers/user";
import auth from "../middlewares/auth";

const authRouter = express.Router();

authRouter.post("/register", userCtrl.register);
authRouter.post("/login", userCtrl.login);
authRouter.put("/saveOffer/:id", auth, userCtrl.saveOffer);
authRouter.put("/applyOffer/:id", auth, userCtrl.applyOffer);
authRouter.get("/info", auth, userCtrl.getUserInfoFromToken);
authRouter.get("/confirm-email/:token", userCtrl.confirmEmail);

export default authRouter;