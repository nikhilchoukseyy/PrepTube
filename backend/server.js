import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import connectDB from "./config/db.js";

dotenv.config();
console.log("PORT from .env:", process.env.PORT);

const app = express();

app.use(cors()); 
app.use(express.json()); 

app.get("/", (req, res) => {
  res.send("Welcome to PrepTube");
});

const PORT = process.env.PORT || 8000;

const startServer = async ()=>{
  try{
    await connectDB(); 
    app.listen(PORT, () => console.log(`Server is listening on PORT : ${PORT}`));
  }catch(error){
    console.log(`Server failed to start : ${error}`);
  }
}

startServer(); 


