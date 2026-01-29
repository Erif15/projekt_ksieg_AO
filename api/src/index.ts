import express from "express";
import cors from "cors";

const app = express();
app.use(cors());
app.use(express.json());

type Book = {
  id: number;
  title: string;
  author: string;
};

let books: Book[] = [
  { id: 1, title: "Wiedźmin", author: "Andrzej Sapkowski" },
  { id: 2, title: "Hobbit", author: "J.R.R. Tolkien" },
  { id: 3, title: "Solaris", author: "Stanisław Lem" },
];

function nextId() {
  return books.length ? Math.max(...books.map((b) => b.id)) + 1 : 1;
}

app.get("/health", (req, res) => {
  res.json({ ok: true, service: "booknest-api" });
});

// GET lista
app.get("/books", (req, res) => {
  res.json(books);
});

// GET szczegóły
app.get("/books/:id", (req, res) => {
  const id = Number(req.params.id);
  const book = books.find((b) => b.id === id);
  if (!book) return res.status(404).json({ message: "Book not found" });
  res.json(book);
});

// POST dodaj
app.post("/books", (req, res) => {
  const title = String(req.body?.title ?? "").trim();
  const author = String(req.body?.author ?? "").trim();

  if (!title || !author) {
    return res.status(400).json({ message: "title and author are required" });
  }

  const book: Book = { id: nextId(), title, author };
  books.push(book);
  res.status(201).json(book);
});

// PUT aktualizuj
app.put("/books/:id", (req, res) => {
  const id = Number(req.params.id);
  const idx = books.findIndex((b) => b.id === id);
  if (idx === -1) return res.status(404).json({ message: "Book not found" });

  const title = String(req.body?.title ?? "").trim();
  const author = String(req.body?.author ?? "").trim();

  if (!title || !author) {
    return res.status(400).json({ message: "title and author are required" });
  }

  books[idx] = { ...books[idx], title, author };
  res.json(books[idx]);
});

// DELETE usuń
app.delete("/books/:id", (req, res) => {
  const id = Number(req.params.id);
  const before = books.length;
  books = books.filter((b) => b.id !== id);

  if (books.length === before) {
    return res.status(404).json({ message: "Book not found" });
  }

  res.status(204).send();
});

const PORT = 4000;
app.listen(PORT, () => {
  console.log(`✅ API działa: http://localhost:${PORT}`);
});
