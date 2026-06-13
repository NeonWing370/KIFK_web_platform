require("dotenv").config();

const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");

const app = express();

app.use(cors({
    origin: [
        "http://localhost:8080",
        "http://127.0.0.1:8080"
    ],
    credentials: true
}));

app.use(express.json());

app.get("/", (req,res)=>{
    res.send("CodeStudy API");
});

app.get("/api/test", (req, res) => {
    res.json({
        message: "Backend is working!"
    });
});

app.use(
    "/api/auth",
    require("./routes/auth")
);

app.use(
    "/api/users",
    require("./routes/users")
);

app.use(
"/api/materials",
require("./routes/materials")
);

app.use(
"/api/notifications",
require("./routes/notifications")
);

app.use(
"/api/courses",
require("./routes/courses")
);

app.use(
"/api/groups",
require("./routes/groups")
);

app.use(
"/api/tests",
require("./routes/tests")
);

app.use(
"/api/results",
require("./routes/results")
);

app.use(
"/api/bootstrap",
require("./routes/bootstrap")
);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(
        `Server started on ${PORT}`
    );
});

connectDB()
.catch((err) => {
    console.error("MongoDB connection failed:", err.message);
});
