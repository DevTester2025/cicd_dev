const express = require('express');
const app = express();
const port = 3000;

app.get('/', (req, res) => {
  const currentDateTime = new Date().toLocaleString();
  res.send(`Manual trigger CICD pipeline test on ${currentDateTime}`);
});

app.listen(port, () => {
  console.log(`Server is listening on port ${port}`);
});
