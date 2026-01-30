// apiClient.ts
import { Platform } from "react-native";

export type Book = {
  id: string | number;
  title: string;
  author: string;
  description?: string;
  rating?: number; // 1-5
  favorite?: boolean;
  coverUri?: string; // tylko "udawane" okładki (np. blob:) po stronie UI
  createdAt?: string;
  updatedAt?: string;
};

function getBaseUrl() {
  // Jeśli ustawisz w mobile/.env np. EXPO_PUBLIC_API_URL=http://192.168.0.10:4000
  // to to ma pierwszeństwo.
  const envUrl = (process.env as any)?.EXPO_PUBLIC_API_URL;
  if (envUrl && typeof envUrl === "string" && envUrl.trim().length > 0) {
    return envUrl.replace(/\/+$/, "");
  }

  // Web w przeglądarce:
  if (Platform.OS === "web") return "http://localhost:4000";

  // Android emulator (Expo):
  if (Platform.OS === "android") return "http://10.0.2.2:4000";

  // iOS симulator / większość przypadków lokalnych:
  return "http://localhost:4000";
}

const BASE_URL = getBaseUrl();

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const url = `${BASE_URL}${path}`;

  const res = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options?.headers ?? {}),
    },
  });

  // JSON-server/express czasem zwraca pusty body przy DELETE
  const text = await res.text();
  const data = text ? safeJsonParse(text) : null;

  if (!res.ok) {
    const msg =
      (data && (data.message || data.error)) ||
      `HTTP ${res.status} ${res.statusText} dla ${url}`;
    throw new Error(msg);
  }

  return data as T;
}

function safeJsonParse(text: string) {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

export async function getBooks(): Promise<Book[]> {
  return request<Book[]>("/books");
}

export async function getBook(id: string | number): Promise<Book> {
  const safeId = encodeURIComponent(String(id));
  return request<Book>(`/books/${safeId}`);
}

export async function createBook(payload: Omit<Book, "id">): Promise<Book> {
  return request<Book>("/books", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function updateBook(
  id: string | number,
  payload: Partial<Book>
): Promise<Book> {
  const safeId = encodeURIComponent(String(id));
  return request<Book>(`/books/${safeId}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export async function deleteBook(id: string | number): Promise<void> {
  const safeId = encodeURIComponent(String(id));
  // UWAGA: DELETE może zwrócić pusty body → request() to obsługuje
  await request<void>(`/books/${safeId}`, {
    method: "DELETE",
  });
}
