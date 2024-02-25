const express = require('express');
const cors = require('cors'); // Add this line
const app = express();
const path = require('path');
const bodyParser = require('body-parser');
const port = 3000;
let storedData = [];
app.use(cors()); // Add this line

app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.json());

app.post('/api/process', (req, res) => {
  const mediapipePoints = req.body.points;
  storedData.push(mediapipePoints);
  res.json({ message: 'Points received and processed successfully' });
  // console.log("Express api data = ");
  // console.log(mediapipePoints);
});

app.get('/api/persons', (req, res) => {
  res.json(storedData);
});

app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});
