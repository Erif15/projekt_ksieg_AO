export type Book = {
  id: number;
  title: string;
  author: string;
};

const BASE_URL = "http://localhost:4000";

async function http<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(text || `HTTP ${res.status}`);
  }

  // dla DELETE może nie być body
  const ct = res.headers.get("content-type") || "";
  if (!ct.includes("application/json")) {
    return undefined as unknown as T;
  }
  return (await res.json()) as T;
}

export function getBooks() {
  return http<Book[]>("/books");
}

export function getBook(id: number) {
  return http<Book>(`/books/${id}`);
}

export function createBook(data: { title: string; author: string }) {
  return http<Book>("/books", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function updateBook(id: number, data: { title: string; author: string }) {
  return http<Book>(`/books/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export function deleteBook(id: number) {
  return http<void>(`/books/${id}`, { method: "DELETE" });
}
