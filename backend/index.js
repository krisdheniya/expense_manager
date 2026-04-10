import connectDB from "./db/db.js";
import dotenv from "dotenv";
import app from "./app.js";

dotenv.config({
    path:"./env"
});

connectDB()
    .then(() => {
        app.listen(process.env.PORT, () => {
            console.log(`Server is running on port ${process.env.PORT}`);
        }).on("error",(err)=>{
            console.log("Failed to start server",err);
        });
    })
    .catch
    ((err) => {
        console.log("MongoDB connection failed", err);
    })
