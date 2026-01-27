import express from "express";
import cors from "cors";
import * as sqlite3 from "sqlite3";

// serwer
const app = express();
app.use(cors());
app.use(express.json());

// baza danych (plik lokalny)
const db = new sqlite3.Database("./booknest.db");

// tabela books (CRUD)
db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS books (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      author TEXT NOT NULL
    )
  `);
});

// healthcheck
app.get("/health", (_req, res) => {
  res.json({ ok: true, service: "booknest-api" });
});

// GET lista
app.get("/books", (_req, res) => {
  db.all("SELECT * FROM books ORDER BY id DESC", (err, rows) => {
    if (err) return res.status(500).json({ error: "db_error" });
    res.json(rows);
  });
});

// GET szczegóły
app.get("/books/:id", (req, res) => {
  db.get("SELECT * FROM books WHERE id = ?", [req.params.id], (err, row) => {
    if (err) return res.status(500).json({ error: "db_error" });
    if (!row) return res.status(404).json({ error: "not_found" });
    res.json(row);
  });
});

// POST tworzenie
app.post("/books", (req, res) => {
  const title = String(req.body?.title ?? "").trim();
  const author = String(req.body?.author ?? "").trim();

  if (!title || !author) return res.status(400).json({ error: "missing_fields" });

  db.run("INSERT INTO books (title, author) VALUES (?, ?)", [title, author], function (err) {
    if (err) return res.status(500).json({ error: "db_error" });
    res.status(201).json({ id: this.lastID, title, author });
  });
});

// PATCH aktualizacja
app.patch("/books/:id", (req, res) => {
  const title = req.body?.title !== undefined ? String(req.body.title).trim() : undefined;
  const author = req.body?.author !== undefined ? String(req.body.author).trim() : undefined;

  db.get("SELECT * FROM books WHERE id = ?", [req.params.id], (err, existing: any) => {
    if (err) return res.status(500).json({ error: "db_error" });
    if (!existing) return res.status(404).json({ error: "not_found" });

    const nextTitle = title ?? existing.title;
    const nextAuthor = author ?? existing.author;

    db.run(
      "UPDATE books SET title = ?, author = ? WHERE id = ?",
      [nextTitle, nextAuthor, req.params.id],
      function (err2) {
        if (err2) return res.status(500).json({ error: "db_error" });
        res.json({ id: Number(req.params.id), title: nextTitle, author: nextAuthor });
      }
    );
  });
});

// DELETE usuwanie
app.delete("/books/:id", (req, res) => {
  db.run("DELETE FROM books WHERE id = ?", [req.params.id], function (err) {
    if (err) return res.status(500).json({ error: "db_error" });
    if (this.changes === 0) return res.status(404).json({ error: "not_found" });
    res.json({ ok: true });
  });
});

// start
const PORT = 4000;
app.listen(PORT, () => {
  console.log(`✅ API działa: http://localhost:${PORT}`);
});
