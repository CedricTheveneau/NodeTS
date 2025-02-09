import express, { Request, Response } from "express";
import dotenv from "dotenv";
import cors from "cors";
import proxy from "express-http-proxy";

const bouncer = require("./app/middlewares/bouncer");

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const proxyURIAuth = process.env.PROXY_URI_AUTH;
const proxyURIOffers = process.env.PROXY_URI_OFFERS;

const allowedOrigins = (process.env.CORS_ORIGIN ?? '').split(',');

app.use(cors());
app.use(express.json());

const corsOptions = {
  origin: allowedOrigins,
  optionsSuccessStatus: 200,
};

app.use(cors(corsOptions));

app.use("/api/auth", proxy(proxyURIAuth ?? ''));
app.use("/api/offers", bouncer, proxy(proxyURIOffers ?? ''));

app.get("/", (req: Request, res: Response) => {
  res.send("API Gateway is running 🚀");
});

app.listen(PORT, () => {
  console.log(`🚀 API Gateway is running on http://localhost:${PORT}`);
});