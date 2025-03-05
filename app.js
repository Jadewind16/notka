const express = require("express");
const path = require("path");

const app = express();
const PORT = 3000;

// Middleware - Parse JSON and URL-encoded data
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve Static Files (HTML, CSS, JS from 'public' folder)
app.use(express.static(path.join(__dirname, "public")));

// Import Routes
const homeRoutes = require("./routes/home");
app.use("/", homeRoutes);

// 404 Error Handling (If route not found)
app.use((req, res) => {
    res.status(404).send("404 - Page Not Found");
});

// Start the Server
app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
