import express, { Request, Response } from "express";

const app = express();
app.use(express.json());

app.get("/", (req: Request, res: Response) => {
    res.send("Hello, TypeScript with Node.js!");
});

app.listen(3000, () => console.log("Server running on port 3000"));