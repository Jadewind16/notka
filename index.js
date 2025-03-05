const app = require("./app"); // Import app.js
const PORT = 3000;

// Start the Server
app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
