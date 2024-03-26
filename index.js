const express = require('express');
const cors = require('cors');
const app = express();
const path = require('path');
const bodyParser = require('body-parser');
const { log } = require('console');
const port = 3000;
var storedData = [];
app.use(cors());
app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.json());

app.post('/api/process', (req, res) => {
  const { gridPosition } = req.body; // Destructure points and gridPosition from req.body
  storedData = []; // Clear the existing storedData
  storedData.push({ gridPosition }); // Store the new gridPosition
  res.json({ message: 'Points received and processed successfully' });
  // console.log("Express api data = ");
  // console.log({ gridPosition }); // Log both points and gridPosition
});

app.get('/api/playerposition', (req, res) => {
  res.json(storedData);
  // console.log("data sent successfull");

});

app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});
