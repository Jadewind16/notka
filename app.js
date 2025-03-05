const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const dotenv = require("dotenv");
const path = require("path");
const multer = require("multer");
const fs = require("fs");

dotenv.config(); // Load environment variables

const app = express();
const PORT = process.env.PORT || 3000;

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => console.log("✅ Connected to MongoDB"))
  .catch(err => console.error("❌ MongoDB Connection Error:", err));

// Define Note Schema & Model
const noteSchema = new mongoose.Schema({
    title: String,
    content: String,
    filePath: String, // Stores file path if a file is uploaded
    pageNumber: Number, // Stores page/slide number
    createdAt: { type: Date, default: Date.now }
});
const Note = mongoose.model("Note", noteSchema);

// Ensure "uploads" folder exists
if (!fs.existsSync("uploads")) {
    fs.mkdirSync("uploads");
}

// Multer Setup for File Uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, "uploads/"); // Save files in "uploads/" folder
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + path.extname(file.originalname)); // Rename with timestamp
    }
});
const upload = multer({ storage: storage });

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.set("view engine", "ejs"); // Use EJS for rendering views
app.use(express.static(path.join(__dirname, "public"))); // Serve static files
app.use("/uploads", express.static("uploads")); // Serve uploaded files

// Home Route - Show All Notes
app.get("/", async (req, res) => {
    try {
        const notes = await Note.find(); // Fetch notes from MongoDB
        res.render("index", { notes });  // Render index.ejs
    } catch (error) {
        res.status(500).send("Error retrieving notes");
    }
});

// Route to Add a Note (with File Upload)
app.post("/add", upload.single("file"), async (req, res) => {
    const { title, content, pageNumber } = req.body;
    const filePath = req.file ? req.file.path : null;
    const page = pageNumber ? parseInt(pageNumber) : null; // Convert to integer

    if (!title || !content) {
        return res.send("Title and content are required!");
    }

    try {
        await Note.create({ title, content, filePath, pageNumber: page });
        res.redirect("/");
    } catch (error) {
        res.status(500).send("Error adding note");
    }
});

// Route to View File in Embedded Page
app.get("/view-file/:id", async (req, res) => {
    try {
        const note = await Note.findById(req.params.id);
        if (!note || !note.filePath) {
            return res.status(404).send("File not found.");
        }
        
        // Get the page number from the query parameter
        const pageNumber = req.query.page ? parseInt(req.query.page) : (note.pageNumber || 1);
        
        res.render("file-view", { note, pageNumber });
    } catch (error) {
        res.status(500).send("Error loading file.");
    }
});


// Route to Delete a Note
app.post("/delete/:id", async (req, res) => {
    try {
        const note = await Note.findById(req.params.id);
        if (note.filePath) {
            fs.unlinkSync(note.filePath); // Delete the uploaded file
        }
        await Note.findByIdAndDelete(req.params.id);
        res.redirect("/");
    } catch (error) {
        res.status(500).send("Error deleting note");
    }
});

// Start Server
app.listen(PORT, () => console.log(`🚀 Server running at http://localhost:${PORT}`));
