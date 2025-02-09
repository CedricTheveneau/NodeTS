import { Request, Response, NextFunction } from "express";

import jwt from "jsonwebtoken";

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

const auth = (req : Request, res : Response, next : NextFunction) => {
  try {
    const token: string | undefined = req.headers.authorization?.split(" ")[1];
    if (!token) {
      return res.status(401).json({error: "The token is missing."});
    }
    const tokenSecret = process.env.TOKEN_SECRET
    if (!tokenSecret) {
      return res.status(500).json({error: "Server issue : TOKEN_SECRET is not defined."});
    }
    const decodedToken = jwt.verify(token, tokenSecret) as { id: string; role: string; skills: string[] };
    const { id, role, skills } = decodedToken;

    if (!id || !role || !skills) {
      return res.status(401).json({ error: "Invalid token content." });
    }

    req.auth = {
      userId: id,
      userRole: role,
      userSkills: skills
    };
    next();
  } catch (err) {
    return res.status(401).json({
      error: "Access denied ! Invalid or expired token.",
    });
  }
};

export default auth;