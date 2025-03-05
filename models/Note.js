const mongoose = require("mongoose");

const noteSchema = new mongoose.Schema({
    title: String,
    content: String,
    filePath: String, // Stores uploaded file path
    pageNumber: Number, // Stores the page number the note is linked to
    createdAt: { type: Date, default: Date.now }
});

const Note = mongoose.model("Note", noteSchema);
module.exports = Note;
