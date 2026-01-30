import express from "express";
import cors from "cors";
import fs from "fs";
import path from "path";
import crypto from "crypto";

type Book = {
  id: string; // używamy string, bo łatwiej i bez konfliktów
  title: string;
  author: string;
  description?: string;
  rating?: number; // 1-5
  favorite?: boolean;
  coverUri?: string; // może być "blob:..." (tylko poglądowo w web)
  createdAt?: string;
  updatedAt?: string;
};

type DbSchema = {
  books: Book[];
};

const app = express();
app.use(cors());
app.use(express.json());

// db.json trzymamy w: api/data/db.json
const DB_FILE = path.join(__dirname, "..", "data", "db.json");

function ensureDbFile() {
  const dir = path.dirname(DB_FILE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  if (!fs.existsSync(DB_FILE)) {
    const empty: DbSchema = { books: [] };
    fs.writeFileSync(DB_FILE, JSON.stringify(empty, null, 2), "utf-8");
  }
}

function readDb(): DbSchema {
  ensureDbFile();
  try {
    const raw = fs.readFileSync(DB_FILE, "utf-8");
    const parsed = JSON.parse(raw) as Partial<DbSchema>;
    const books = Array.isArray(parsed.books) ? parsed.books : [];
    return { books };
  } catch {
    // jak plik się zepsuje, to nie wywalamy serwera — tylko wracamy do pustej bazy
    return { books: [] };
  }
}

function writeDb(db: DbSchema) {
  ensureDbFile();
  fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), "utf-8");
}

function nowIso() {
  return new Date().toISOString();
}

function newId() {
  // Node 16+ ma randomUUID
  // fallback gdyby coś było nie tak
  // @ts-ignore
  if (crypto.randomUUID) return crypto.randomUUID();
  return `${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

// --- ROUTES ---

app.get("/", (_req, res) => {
  res.send("BookNest API działa ✅");
});

// LISTA (GET)
app.get("/books", (_req, res) => {
  const db = readDb();
  const sorted = [...db.books].sort((a, b) =>
    (a.title ?? "").localeCompare(b.title ?? "", "pl", { sensitivity: "base" })
  );
  res.json(sorted);
});

// SZCZEGÓŁ (GET)
app.get("/books/:id", (req, res) => {
  const { id } = req.params;
  const db = readDb();
  const book = db.books.find((b) => b.id === id);

  if (!book) return res.status(404).send("Nie znaleziono książki.");
  res.json(book);
});

// CREATE (POST)
app.post("/books", (req, res) => {
  const { title, author, description, rating, favorite, coverUri } = req.body ?? {};

  if (!title || !author) {
    return res.status(400).send("Brak wymaganych pól: title, author.");
  }

  const db = readDb();
  const t = nowIso();

  const book: Book = {
    id: newId(),
    title: String(title),
    author: String(author),
    description: description ? String(description) : "",
    rating: typeof rating === "number" ? rating : undefined,
    favorite: typeof favorite === "boolean" ? favorite : false,
    coverUri: coverUri ? String(coverUri) : undefined,
    createdAt: t,
    updatedAt: t,
  };

  db.books.push(book);
  writeDb(db);

  res.status(201).json(book);
});

// UPDATE (PUT) — pełna aktualizacja (ale dopuszczamy brak części pól)
app.put("/books/:id", (req, res) => {
  const { id } = req.params;
  const { title, author, description, rating, favorite, coverUri } = req.body ?? {};

  const db = readDb();
  const idx = db.books.findIndex((b) => b.id === id);
  if (idx === -1) return res.status(404).send("Nie znaleziono książki.");

  const existing = db.books[idx];

  if (!title || !author) {
    return res.status(400).send("Brak wymaganych pól: title, author.");
  }

  db.books[idx] = {
    ...existing,
    title: String(title),
    author: String(author),
    description: description !== undefined ? String(description) : existing.description ?? "",
    rating: typeof rating === "number" ? rating : existing.rating,
    favorite: typeof favorite === "boolean" ? favorite : existing.favorite ?? false,
    coverUri: coverUri !== undefined ? String(coverUri) : existing.coverUri,
    updatedAt: nowIso(),
  };

  writeDb(db);
  res.json(db.books[idx]);
});

// PATCH — częściowa aktualizacja
app.patch("/books/:id", (req, res) => {
  const { id } = req.params;

  const db = readDb();
  const idx = db.books.findIndex((b) => b.id === id);
  if (idx === -1) return res.status(404).send("Nie znaleziono książki.");

  const existing = db.books[idx];
  const body = req.body ?? {};

  db.books[idx] = {
    ...existing,
    ...(body.title !== undefined ? { title: String(body.title) } : {}),
    ...(body.author !== undefined ? { author: String(body.author) } : {}),
    ...(body.description !== undefined ? { description: String(body.description) } : {}),
    ...(body.rating !== undefined ? { rating: Number(body.rating) } : {}),
    ...(body.favorite !== undefined ? { favorite: Boolean(body.favorite) } : {}),
    ...(body.coverUri !== undefined ? { coverUri: String(body.coverUri) } : {}),
    updatedAt: nowIso(),
  };

  writeDb(db);
  res.json(db.books[idx]);
});

// DELETE
app.delete("/books/:id", (req, res) => {
  const { id } = req.params;

  const db = readDb();
  const before = db.books.length;
  db.books = db.books.filter((b) => b.id !== id);

  if (db.books.length === before) {
    return res.status(404).send("Nie znaleziono książki.");
  }

  writeDb(db);
  res.status(204).send();
});

const PORT = 4000;
app.listen(PORT, () => {
  ensureDbFile();
  console.log(`✅ API działa: http://localhost:${PORT}`);
  console.log(`📁 DB: ${DB_FILE}`);
});
