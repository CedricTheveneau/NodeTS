import User from "../models/user";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import  sendConfirmationEmail from "../utils/emailUtils";
import crypto from "crypto";
import { Request, Response } from "express";

declare global {
  namespace Express {
    interface Request {
      auth?: {
        userId: string;
        userRole: string;
        userSkills: string[]
      };
    }
  }
}

const register = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { username, email, password, skills } = req.body;

    const confirmationToken = crypto.randomBytes(32).toString("hex");

    const user = new User({
      username,
      email,
      password,
      skills,
      confirmationToken,
      emailConfirmed: false,
    });

    await user.save();

    const confirmationUrl = `${process.env.FRONTEND_URL}/emailConfirmation/${confirmationToken}`;

    const subject = "Edusign | Activez votre compte";
    const htmlContent = `
    <h1 style="text-align:center;color:#141414;">Merci de l'intérêt que vous portez à Edusign !</h1>
    <h2 style="text-align:center;color:#141414;">Nous sommes plus que ravis de voir que vous souhaitez rejoindre notre plateforme.</h2><br/><br/>
    <p style="text-align:justify;color:#141414;">Votre compte a bien été créé, cependant, pour l'activer, nous vous prions de bien vouloir confirmer votre email. Pour ce faire, il vous suffit de cliquer sur le lien ci-dessous :</p>
    <a style="color:#B0ABED;text-decoration:underline;font-weight:bold;font-style:italic;font-size:18px;text-transform:uppercase;" href="${confirmationUrl}">Je confirme mon adresse e-mail !</a><br/><br/><br/>
    <p style="text-align:justify;color:#141414;">Par ailleurs, dans le cas où vous n'auriez pas activé votre compte d'ici une semaine, votre compte et toutes les données vous concernant se verraient être supprimés de nos bases de données.</p><br/><br/><br/>
    <h2>À très bientôt !</h2><br/><br/>
    <p style="font-weight:bold;font-style:italic;text-align:right;display:block;">L'équipe Edusign</p>
  `;
    
    await sendConfirmationEmail({userEmail: user.email, subject, htmlContent});

    return res.status(201).json(user);
  } catch (err: unknown) {
    if (err instanceof Error) {
      return res.status(500).json({
        message: err.message || "Something wrong happened with your request to create a new user.",
      });
    } else {
      return res.status(500).json({
        message: "Something wrong happened with your request to create a new user.",
      });
    }
  }
};

const confirmEmail = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { token } = req.params;

    const user = await User.findOne({ confirmationToken: token });

    if (!user) {
      return res.status(404).json({ message: "Invalid or expired token" });
    }

    user.emailConfirmed = true;
    user.confirmationToken = undefined;
    await user.save();

    const subject = "Edusign | Compte activé";
    const htmlContent = `
    <h1 style="text-align:center;color:#141414;">C'est officiel, vous êtes un membre de la plateforme Edusign !</h1>
    <h2 style="text-align:center;color:#141414;">Maintenant que votre compte est activé, vous pouvez bénéficier de tout ce que l'application a à vous offrir.</h2><br/><br/>
    <p style="text-align:justify;color:#141414;">Pour vous connecter et découvrir tout notre contenu, vous n'avez qu'à cliquer juste en dessous ! </p>
    <a style="color:#B0ABED;text-decoration:underline;font-weight:bold;font-style:italic;font-size:18px;text-transform:uppercase;" href="http://localhost:3000/login">Je me connecte !</a><br/><br/><br/>
    <h2>À très bientôt !</h2><br/><br/>
    <p style="font-weight:bold;font-style:italic;text-align:right;display:block;">L'équipe Edusign</p>
  `;
    await sendConfirmationEmail({userEmail: user.email, subject, htmlContent});

    return res.status(200).json({
      message: {
        title: "Email confirmé !",
        content:
          "Votre compte a été activé et vous pouvez à présent vous connecter.",
      },
    });
  } catch (err: unknown) {
    if (err instanceof Error) {
      return res.status(500).json({
        message: err.message || "Something wrong happened with your request to confirm your email adress.",
      });
    } else {
      return res.status(500).json({
        message: "Something wrong happened with your request to confirm your email adress.",
      });
    }
  }
};

const login = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    if (!user.emailConfirmed) {
      return res.status(403).json({
        message:
          "Please confirm your email before logging in. We've sent an email to the email adress associated with your account.",
      });
    }
    const matchingPassword = await bcrypt.compare(password, user.password);
    if (!matchingPassword) {
      return res.status(401).json({ message: "Invalid password" });
    }
    const token = jwt.sign(
      { id: user._id, role: user.role, skills: user.skills },
      process.env.TOKEN_SECRET ?? '',
      {
        expiresIn: Number(process.env.TOKEN_EXPIRATION || 3600),
      }
    );
    const updatedUser = await User.findOneAndUpdate(
      {
        _id: user._id,
      },
      {
        lastConnected: Date.now(),
      },
      { new: true }
    );
    return res.status(200).json({ token, updatedUser });
  } catch (err: unknown) {
    if (err instanceof Error) {
      return res.status(500).json({
        message: err.message || "Something wrong happened with your request to log into your account.",
      });
    } else {
      return res.status(500).json({
        message: "Something wrong happened with your request to log into your account.",
      });
    }
  }
};

const getUserInfoFromToken = (req: Request, res: Response): Response => {
  try {
    const { userId, userRole } = req.auth || {};
    if (!userId || !userRole) {
      return res.status(400).json({
        message: "Missing user information in token.",
      });
    }
    return res.status(200).json({ userId, userRole });
  } catch (err: unknown) {
    if (err instanceof Error) {
      return res.status(500).json({
        message: err.message || "Something wrong happened while retrieving the user's data.",
      });
    } else {
      return res.status(500).json({
        message: "Something wrong happened while retrieving the user's data.",
      });
    }
  }
};

const saveOffer = async (req: Request, res: Response): Promise<Response> => {
  try {
    const userCheck = await User.findById(req.params.id);

    if (!userCheck) {
      return res.status(404).json({ message: "User not found." });
    }

    if (userCheck.id !== req.auth?.userId && req.auth?.userRole !== "admin") {
      return res
        .status(403)
        .json({ message: "You are not authorized to update this user." });
    }

    if (!req.body.savedOffers) {
      return res.status(400).json({ message: "No saved offer provided." });
    }

    if (Array.isArray(userCheck.savedOffers) && userCheck.savedOffers.includes(req.body.savedOffers)) {
      const user = await User.findOneAndUpdate(
        {
          _id: req.params.id,
        },
        {
          $pull: { savedOffers: req.body.savedOffers },
        },
        { new: true }
      );
      return res.status(200).json(user?.savedOffers || []);
    } else {
      const user = await User.findOneAndUpdate(
        {
          _id: req.params.id,
        },
        {
          $push: { savedOffers: req.body.savedOffers },
        },
        { new: true }
      );
      return res.status(200).json(user?.savedOffers || []);
    }
  } catch (err: unknown) {
    if (err instanceof Error) {
      return res.status(500).json({
        message: err.message || "Something wrong happened with your request to save the offer on the user's profile.",
      });
    } else {
      return res.status(500).json({
        message: "Something wrong happened with your request to save the offer on the user's profile.",
      });
    }
  }
};

const applyOffer = async (req: Request, res: Response): Promise<Response> => {
  try {
    const userCheck = await User.findById(req.params.id);

    if (!userCheck) {
      return res.status(404).json({ message: "User not found." });
    }

    if (userCheck.id !== req.auth?.userId && req.auth?.userRole !== "admin") {
      return res
        .status(403)
        .json({ message: "You are not authorized to update this user." });
    }

    if (!req.body.appliedOffers) {
      return res.status(400).json({ message: "No applied offer provided." });
    }

    if (Array.isArray(userCheck.appliedOffers) && userCheck.appliedOffers.includes(req.body.appliedOffers)) {
      const user = await User.findOneAndUpdate(
        {
          _id: req.params.id,
        },
        {
          $pull: { appliedOffers: req.body.appliedOffers },
        },
        { new: true }
      );
      return res.status(200).json(user?.appliedOffers || []);
    } else {
      const user = await User.findOneAndUpdate(
        {
          _id: req.params.id,
        },
        {
          $push: { appliedOffers: req.body.appliedOffers },
        },
        { new: true }
      );
      return res.status(200).json(user?.appliedOffers || []);
    }
  } catch (err: unknown) {
    if (err instanceof Error) {
      return res.status(500).json({
        message: err.message || "Something wrong happened with your request to save the offer on the user's profile's 'applied' section.",
      });
    } else {
      return res.status(500).json({
        message: "Something wrong happened with your request to save the offer on the user's profile's 'applied' section.",
      });
    }
  }
};

export default {
  register,
  login,
  saveOffer,
  applyOffer,
  getUserInfoFromToken,
  confirmEmail,
};