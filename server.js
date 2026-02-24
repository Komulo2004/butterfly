const express = require("express");
const fs = require("fs");
const path = require("path");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { v4: uuidv4 } = require("uuid");
require("dotenv").config();

const app = express();
const PORT = Number(process.env.PORT) || 4000;
const JWT_SECRET = process.env.JWT_SECRET || "dev-secret-change-me";

const DATA_DIR = path.join(__dirname, "data");
const USERS_FILE = path.join(DATA_DIR, "users.json");
const PRODUCTS_FILE = path.join(DATA_DIR, "products.json");
const SHOPS_FILE = path.join(DATA_DIR, "shops.json");

function readJson(filePath, fallback = []) {
  try {
    if (!fs.existsSync(filePath)) {
      fs.writeFileSync(filePath, JSON.stringify(fallback, null, 2));
      return fallback;
    }

    const raw = fs.readFileSync(filePath, "utf-8");
    if (!raw.trim()) {
      fs.writeFileSync(filePath, JSON.stringify(fallback, null, 2));
      return fallback;
    }

    return JSON.parse(raw);
  } catch (error) {
    return fallback;
  }
}

function writeJson(filePath, data) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}

function userView(user) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    createdAt: user.createdAt
  };
}

function createToken(user) {
  return jwt.sign(
    {
      sub: user.id,
      email: user.email,
      name: user.name
    },
    JWT_SECRET,
    { expiresIn: "7d" }
  );
}

function authRequired(req, res, next) {
  const authHeader = req.headers.authorization || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;

  if (!token) {
    return res.status(401).json({ error: "Missing token" });
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    const users = readJson(USERS_FILE, []);
    const user = users.find((candidate) => candidate.id === payload.sub);

    if (!user) {
      return res.status(401).json({ error: "User no longer exists" });
    }

    req.user = user;
    return next();
  } catch (error) {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}

app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, "public")));

app.get("/api/health", (req, res) => {
  res.json({ ok: true, app: "butterfly", now: new Date().toISOString() });
});

app.post("/api/auth/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: "name, email and password are required" });
    }

    if (String(password).length < 6) {
      return res.status(400).json({ error: "Password must be at least 6 characters" });
    }

    const users = readJson(USERS_FILE, []);
    const normalizedEmail = String(email).trim().toLowerCase();

    const alreadyExists = users.some((user) => user.email === normalizedEmail);
    if (alreadyExists) {
      return res.status(409).json({ error: "Email already registered" });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const newUser = {
      id: uuidv4(),
      name: String(name).trim(),
      email: normalizedEmail,
      passwordHash,
      createdAt: new Date().toISOString()
    };

    users.push(newUser);
    writeJson(USERS_FILE, users);

    const token = createToken(newUser);
    return res.status(201).json({ token, user: userView(newUser) });
  } catch (error) {
    return res.status(500).json({ error: "Registration failed" });
  }
});

app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "email and password are required" });
    }

    const users = readJson(USERS_FILE, []);
    const normalizedEmail = String(email).trim().toLowerCase();
    const user = users.find((candidate) => candidate.email === normalizedEmail);

    if (!user) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const validPassword = await bcrypt.compare(password, user.passwordHash);
    if (!validPassword) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const token = createToken(user);
    return res.json({ token, user: userView(user) });
  } catch (error) {
    return res.status(500).json({ error: "Login failed" });
  }
});

app.get("/api/auth/me", authRequired, (req, res) => {
  res.json({ user: userView(req.user) });
});

app.get("/api/products", (req, res) => {
  const products = readJson(PRODUCTS_FILE, []);
  const { q, color, maxPrice } = req.query;

  let filtered = products;

  if (q) {
    const query = String(q).toLowerCase();
    filtered = filtered.filter((item) => {
      return (
        item.name.toLowerCase().includes(query) ||
        item.line.toLowerCase().includes(query) ||
        item.description.toLowerCase().includes(query)
      );
    });
  }

  if (color) {
    const normalizedColor = String(color).toLowerCase();
    filtered = filtered.filter((item) => item.color.toLowerCase().includes(normalizedColor));
  }

  if (maxPrice) {
    const numericPrice = Number(maxPrice);
    if (!Number.isNaN(numericPrice)) {
      filtered = filtered.filter((item) => item.price <= numericPrice);
    }
  }

  res.json({ count: filtered.length, products: filtered });
});

app.get("/api/shops", (req, res) => {
  const shops = readJson(SHOPS_FILE, []);
  res.json({ count: shops.length, shops });
});

app.get("/api/private/dashboard", authRequired, (req, res) => {
  const products = readJson(PRODUCTS_FILE, []);
  const shops = readJson(SHOPS_FILE, []);

  res.json({
    message: `Welcome back, ${req.user.name}`,
    user: userView(req.user),
    featured: products.slice(0, 6),
    shops
  });
});

app.use("/api", (req, res) => {
  res.status(404).json({ error: "API route not found" });
});

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`Butterfly running on http://localhost:${PORT}`);
});
