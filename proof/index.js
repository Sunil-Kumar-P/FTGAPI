const express = require("express");
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require("path");
const staticRoute = require("./routes/staticRouter");

const app = express();
const port = 3000;
var storedData = [];

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.set("view engine", "ejs");
app.set("views", path.resolve("./views"));
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use("/", staticRoute);

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

// Start server
app.listen(port, () => {
  console.log(`Server listening on port http://localhost:${port}`)
});
