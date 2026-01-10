import express from "express";
import path from "path";
import dotenv from "dotenv";
import connectDB from "./config/db.js";
import { fileURLToPath } from "url";
import cookieParser from "cookie-parser";
import cors from "cors";
import session from "express-session";

// Models import
import Product from "./models/Product.js";
import Agent from "./models/Agent.js";

// Routes
import authRoutes from "./routes/authRoutes.js";
import productRoutes from "./routes/productRoutes.js";
import saleRoutes from "./routes/saleRoutes.js";
import agentRoutes from "./routes/agentRoutes.js";

// Middlewares
import { isLoggedIn } from "./middleware/isLoggedIn.js";
import { allowRoles } from "./middleware/allowRoles.js";

// Load .env & Connect DB
dotenv.config();
connectDB();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// =======================================================
// 🛡️ MIDDLEWARES (Simplified for Vercel)
// =======================================================
app.disable("x-powered-by");

// CORS ko open rakha hai taake loading block na ho
app.use(cors({
  origin: true,
  credentials: true
}));

app.set("trust proxy", 1);
app.use(express.json({ limit: "5mb" }));
app.use(express.urlencoded({ extended: true, limit: "5mb" }));
app.use(cookieParser());

// Static Files & Views
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.static(path.join(__dirname, "public")));

// Session Configuration
app.use(session({
  secret: process.env.SESSION_SECRET || "defaultsecret",
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 30 * 60 * 1000, // 30 minutes (Behtar experience ke liye)
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax"
  }
}));

// =======================================================
// 🚀 ROUTES
// =======================================================
app.use("/auth", authRoutes);
app.use("/products", productRoutes);
app.use("/sales", saleRoutes);
app.use("/agents", agentRoutes);

app.get("/", (req, res) => res.redirect("/auth/login"));

// Updated & Safe Home Route
app.get("/home", isLoggedIn, allowRoles("admin", "worker"), async (req, res) => {
  try {
    const role = req.user.role;
    
    // Parallel data fetching with .lean() for speed
    const [products, agents] = await Promise.all([
        Product.find({}).lean().catch(() => []),
        Agent.find({}).lean().catch(() => [])
    ]);

    // Sab calculation mein "|| 0" aur "Number()" use kiya hai taake crash na ho
    const stats = {
      totalStock: products.reduce((acc, p) => acc + (Number(p.totalProduct) || 0), 0),
      totalValue: products.reduce((acc, p) => acc + (Number(p.totalProduct || 0) * Number(p.rate || 0)), 0),
      totalRemaining: products.reduce((acc, p) => acc + (Number(p.remaining) || 0), 0),
      remainingValue: products.reduce((acc, p) => acc + (Number(p.remaining || 0) * Number(p.rate || 0)), 0),
      totalRefundedValue: products.reduce((acc, p) => acc + (Number(p.refundQuantity || 0) * Number(p.rate || 0)), 0),
      activeAgents: agents.length || 0,
      totalCommission: agents.reduce((acc, a) => acc + (Number(a.commission) || 0), 0)
    };

    res.render("home", { role, stats });
    
  } catch (err) {
    console.error("Dashboard Error:", err.message);
    // Agar stats mein error aaye bhi, toh page crash na ho
    res.render("home", { role: req.user.role, stats: null, error: "Stats load nahi ho sakay" });
  }
});

app.get("/navi-bar", isLoggedIn, allowRoles("admin", "worker"), (req, res) => {
  res.render("partials/navbar", { role: req.user.role });
});

// 404 & Error Handlers
app.use((req, res) => res.status(404).send("❌ Page not found."));

app.use((err, req, res, next) => {
  console.error("❌ SERVER ERROR:", err.message);
  res.status(500).send("Internal Server Error.");
});

// Server Start (Local only)
if (process.env.NODE_ENV !== "production") {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => console.log(`🚀 Server: http://localhost:${PORT}`));
}

export default app;