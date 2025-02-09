import { Request, Response, NextFunction } from "express";
import axios from "axios";

declare global {
  namespace Express {
    interface Request {
      userRole?: string;
      userId?: string;
    }
  }
}

const proxyURIAuth: string | undefined = process.env.PROXY_URI_AUTH;

if (!proxyURIAuth) {
  throw new Error("PROXY_URI_AUTH is not defined");
}

export const checkUserRole = async (req: Request, res: Response, next: NextFunction) => {
  try {
    let userRole = "guest";
    let userId = "";

    if (req.headers.authorization) {
      const token = req.headers.authorization.split(" ")[1];

      const response = await axios.get(`${proxyURIAuth}/info`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const { userId: fetchedUserId, userRole: fetchedUserRole } = response.data;
      userId = fetchedUserId;
      userRole = fetchedUserRole;
    }

    req.userRole = userRole;
    req.userId = userId;

    const path = req.path;

    if (path.startsWith("/api/offers")) {
      if (req.method === "POST") {
        if (userRole !== "admin") {
          return res
            .status(403)
            .json({ error: "Only admins can create offers." });
        }
      } else if (req.method === "PUT") {
        if (userRole === "guest") {
          return res
            .status(403)
            .json({ error: "Only connected users can interact with offers." });
        }
      }
    }

    next();
  } catch (err) {
    res
      .status(401)
      .json({ error: "Something went wrong while checking the user's role." });
  }
};