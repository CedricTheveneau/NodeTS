import express, { Request, Response } from "express";
import dotenv from "dotenv";

dotenv.config();

require("./app/models/index.js");
import router from "./app/routes/index";


const app = express();
const port: number = Number(process.env.PORT) || 8081;


app.use(express.json());

app.use("/", router);

app.get("/", (req : Request, res : Response) => {
  res.send("Hello World!");
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
