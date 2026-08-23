require("dotenv").config();

const express = require("express");
const cors = require("cors");
const session = require("express-session");
const path = require("path");
const authRoutes = require("./routes/authRoutes");
const recordRoutes = require("./routes/recordRoutes");
const app = express();

const PORT = process.env.PORT || 10000;
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";

// CORS
app.use(
    cors({
        origin: FRONTEND_URL,
        credentials: true,
    })
);

// JSON body parser
app.use(express.json());

// Session
app.use(
    session({
        secret: process.env.SESSION_SECRET || "change-this-secret",
        resave: false,
        saveUninitialized: false,
        // cookie: {
        //     httpOnly: true,
        //     secure: false,
        //     sameSite: "lax",
        //     maxAge: 1000 * 60 * 60 * 8,
        // },
        cookie: {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            maxAge: 1000 * 60 * 60 * 8,
        },

    })
);

// Health check
app.get("/api/health", (req, res) => {

        res.json({
            status: "ok",
            message: "Salesforce backend is running",
        });
    }
);

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/records", recordRoutes);

// Serve React frontend
const frontendPath = path.join(__dirname, "../../frontend/dist");
app.use(express.static(frontendPath));
app.get("/{*splat}", (req, res) => {
    res.sendFile(path.join(frontendPath, "index.html"));
});


// Error handler
app.use((err, req, res, next) => {

        console.error("Unhandled error:", err);
        res.status(500).json({
            error: "Internal server error",
        });
    }
);

// Start server
// app.listen(PORT, () => {
//         console.log("Salesforce CRUD Backend");
//         console.log(`Server running on port ${PORT}`);
//         console.log(`http://localhost:${PORT}`);
//     }
// );

app.listen(PORT, "0.0.0.0", () => {
    console.log("Salesforce CRUD Backend");
    console.log(`Server running on port ${PORT}`);
});
