const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
require("dotenv").config()

const app = express();
const DATABASE = process.env.DATABASE;
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static('uploads'));

mongoose.connect(DATABASE).then(()=>{
  console.log("connected to mongoDB successfully")
}).catch((error)=>{
  console.log(error)
  console.log("error")
})

const cardSchema = new mongoose.Schema({
  title: String,
  description: String,
  image: String, // Update the schema to store the image file path
});

const Card = mongoose.model('Card', cardSchema);

// Multer configuration for handling file uploads
const storage = multer.diskStorage({
  destination: 'https://seequenze-card-shubham-bargal.netlify.app/uploads',
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});

const upload = multer({ storage });

// Create Operation with file upload
app.post('/api/cards', upload.single('image'), async (req, res) => {
  try {
    const { title, description } = req.body;
    const imagePath = req.file ? req.file.filename : null;
    
    const newCard = new Card({ title, description, image: imagePath });
    await newCard.save();
    
    res.json(newCard);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Read Operation
app.get('/api/cards', async (req, res) => {
  try {
    const cards = await Card.find();
    res.json(cards);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Update Operation
app.put('/api/cards/:id', upload.single('image'), async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description } = req.body;

    // Check if an image was provided
    const imagePath = req.file ? req.file.filename : null;

    const updatedCard = await Card.findByIdAndUpdate(
      id,
      {
        title,
        description,
        ...(imagePath && { image: imagePath }), // Only update image if provided
      },
      { new: true }
    );

    res.json(updatedCard);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Delete Operation
app.delete('/api/cards/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const card = await Card.findById(id);

    // Delete the associated image file when deleting a card
    if (card.image) {
      const imagePath = path.join(__dirname, 'uploads', card.image);
      fs.unlinkSync(imagePath);
    }

    await Card.findByIdAndDelete(id);
    res.json({ message: 'Card deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
