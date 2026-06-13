MONGO_URI=mongodb+srv://suhovenkob0704_db_user:wT5fSrvR3kI1DMCR@kifk1.j1qsxrp.mongodb.net/myDatabase?retryWrites=true&w=majority

Add that to .env
then check if eveerything here is right for the platform to work config/db.js and in server.js 
the project should be able to run with command: node server.js 
make sure  that frontend is connected to backend
add this to server js

import cors from "cors";

app.use(cors({
  origin: "http://localhost:8080" // Vue default port
}));


test backend endpoint
app.get("/api/test", (req, res) => {
  res.json({ message: "Backend is working!" });
});

app.get("/api/test", (req, res) => {
  res.json({ message: "Backend is working!" });
});


