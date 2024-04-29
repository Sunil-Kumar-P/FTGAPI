const express = require("express");
const path = require("path");
const cookieParser = require("cookie-parser");
const { connectToMongoDB } = require("./connect");
const { restrictToLoggedinUserOnly, checkAuth } = require("./middlewares/auth");
const URL = require("./models/url");

const urlRoute = require("./routes/url");
const staticRoute = require("./routes/staticRouter");
const userRoute = require("./routes/user");

const app = express();
const port = 3000;

connectToMongoDB(process.env.MONGODB ?? "mongodb+srv://admin:Gaming123@gamingdata.d53tbwt.mongodb.net/jungle").then(() =>
  console.log("Mongodb connected")
);

app.set("view engine", "ejs");
app.set("views", path.resolve("./views"));
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

app.use("/url", restrictToLoggedinUserOnly, urlRoute);
app.use("/user", userRoute);
app.use("/", checkAuth, staticRoute);

app.get("/url/:shortId", async (req, res) => {
  const shortId = req.params.shortId;
  const entry = await URL.findOneAndUpdate(
    {
      shortId,
    },
    {
      $push: {
        visitHistory: {
          timestamp: Date.now(),
        },
      },
    }
  );
  res.redirect(entry.redirectURL);
});





// const express = require('express');
// const cors = require('cors');
// const app = express();
// const path = require('path');
// const bodyParser = require('body-parser');
// const mongoose = require('mongoose');
// const bcrypt = require('bcrypt');


// var storedData = [];

// // Middleware
// app.use(cors());
// app.use(express.static(path.join(__dirname, 'public')));
// app.use(bodyParser.json());
// app.use(express.json());
// app.use(express.urlencoded({ extended: false }));

// // MongoDB connection
// mongoose.connect("mongodb+srv://admin:Gaming123@gamingdata.d53tbwt.mongodb.net/Login-tut")
//     .then(() => console.log("Database Connected Successfully"))
//     .catch(() => console.log("Database cannot be Connected"));

// // Set view engine and views directory
// app.set('view engine', 'ejs'); // Assuming you're using EJS as the view engine
// app.set('views', path.join(__dirname, 'views')); // Assuming your views are located in a directory named 'views'

// // Schema
// const Loginschema = new mongoose.Schema({
//     name: {
//         type: String,
//         required: true
//     },
//     password: {
//         type: String,
//         required: true
//     }
// });

// // Model
// const collection = mongoose.model("users", Loginschema);

// Routes
app.post('/api/process', (req, res) => {
    const { gridPosition } = req.body;
    storedData = [];
    storedData.push({ gridPosition });
    res.json({ message: 'Points received and processed successfully' });
});

app.get('/api/playerposition', (req, res) => {
    res.json(storedData);
});


// app.get("", (req, res) => {
//     res.render("login.ejs");
// });
  
// app.get("/signup", (req, res) => {
//     res.render("signup.ejs");
// });

// app.get("/home", (req, res) => {
//   res.render("home.ejs");
// });

// app.post("/signup", async (req, res) => {
//     const { username, password } = req.body;
//     const existingUser = await collection.findOne({ name: username });

//     if (existingUser) {
//         res.send('User already exists. Please choose a different username.');
//     } else {
//         const saltRounds = 10;
//         const hashedPassword = await bcrypt.hash(password, saltRounds);

//         const newUser = new collection({ name: username, password: hashedPassword });
//         await newUser.save();
//         res.render("login"); // Assuming you have a login.ejs file in your views directory
//     }
// });

// app.post("/login", async (req, res) => {
//     try {
//         const { username, password } = req.body;
//         const user = await collection.findOne({ name: username });

//         if (!user) {
//             res.send("User not found");
//         } else {
//             const isPasswordMatch = await bcrypt.compare(password, user.password);

//             if (!isPasswordMatch) {
//                 res.send("Incorrect password");
//             } else {
//                 res.render("home"); // Assuming you have a home.ejs file in your views directory
//             }
//         }
//     } catch (error) {
//         console.log(error);
//         res.send("An error occurred");
//     }
// });






// Start server
app.listen(port, () => {
    console.log(`Server listening on port http://localhost:${port}`)
});
