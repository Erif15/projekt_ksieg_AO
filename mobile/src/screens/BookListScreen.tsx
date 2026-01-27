import { useMemo, useState } from "react";
import { FlatList, Pressable, StyleSheet, Text, TextInput, View } from "react-native";

// typ danych książki
type Book = {
  id: string;
  title: string;
  author: string;
};

// dane startowe
const INITIAL_BOOKS: Book[] = [
  { id: "1", title: "Wiedźmin", author: "Andrzej Sapkowski" },
  { id: "2", title: "Hobbit", author: "J.R.R. Tolkien" },
  { id: "3", title: "Solaris", author: "Stanisław Lem" },
];

export default function BookListScreen({ navigation }: any) {
  // lista książek (stan aplikacji)
  const [books, setBooks] = useState<Book[]>(INITIAL_BOOKS);

  // pola formularza dodawania
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");

  // prosta walidacja formularza
  const canAdd = useMemo(() => title.trim().length > 0 && author.trim().length > 0, [title, author]);

  // dodanie nowej książki do listy
  const addBook = () => {
    if (!canAdd) return;

    const newBook: Book = {
      id: String(Date.now()),
      title: title.trim(),
      author: author.trim(),
    };

    setBooks((prev) => [newBook, ...prev]);
    setTitle("");
    setAuthor("");
  };

  // usunięcie książki z listy
  const deleteBook = (id: string) => {
    setBooks((prev) => prev.filter((b) => b.id !== id));
  };

  // aktualizacja książki po edycji na ekranie szczegółów
  const updateBook = (updated: Book) => {
    setBooks((prev) => prev.map((b) => (b.id === updated.id ? updated : b)));
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Lista książek</Text>

      {/* formularz dodawania */}
      <View style={styles.form}>
        <TextInput
          style={styles.input}
          placeholder="Tytuł"
          placeholderTextColor="#94a3b8"
          value={title}
          onChangeText={setTitle}
        />
        <TextInput
          style={styles.input}
          placeholder="Autor"
          placeholderTextColor="#94a3b8"
          value={author}
          onChangeText={setAuthor}
        />

        <Pressable
          style={({ pressed }) => [
            styles.addBtn,
            !canAdd && styles.addBtnDisabled,
            pressed && canAdd && styles.pressed,
          ]}
          onPress={addBook}
          disabled={!canAdd}
        >
          <Text style={styles.addBtnText}>+ Dodaj</Text>
        </Pressable>
      </View>

      {/* lista książek */}
      <FlatList
        data={books}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ gap: 12 }}
        renderItem={({ item }) => (
          // pojedynczy element listy
          <Pressable
            style={({ pressed }) => [styles.item, pressed && styles.pressed]}
            onPress={() =>
              navigation.navigate("BookDetails", {
                book: item,
                onDelete: deleteBook,
                onUpdate: updateBook,
              })
            }
          >
            <View style={{ flex: 1 }}>
              <Text style={styles.title}>{item.title}</Text>
              <Text style={styles.author}>{item.author}</Text>
            </View>

            {/* przycisk usuwania (bez wchodzenia w szczegóły) */}
            <Pressable onPress={() => deleteBook(item.id)} style={styles.deletePill}>
              <Text style={styles.deletePillText}>Usuń</Text>
            </Pressable>
          </Pressable>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  // główny kontener ekranu
  container: {
    flex: 1,
    backgroundColor: "#0b1220",
    padding: 16,
  },

  // nagłówek ekranu
  header: {
    fontSize: 24,
    fontWeight: "800",
    color: "white",
    marginBottom: 16,
  },

  // formularz
  form: {
    backgroundColor: "#0f1b33",
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    gap: 10,
  },

  // input
  input: {
    backgroundColor: "#1f2937",
    color: "white",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#334155",
  },

  // przycisk dodawania
  addBtn: {
    backgroundColor: "#2563eb",
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: "center",
  },

  addBtnDisabled: {
    opacity: 0.5,
  },

  addBtnText: {
    color: "white",
    fontWeight: "800",
  },

  // pojedynczy element listy
  item: {
    backgroundColor: "#1f2937",
    padding: 12,
    borderRadius: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },

  pressed: {
    opacity: 0.85,
  },

  // tytuł książki
  title: {
    fontSize: 16,
    fontWeight: "700",
    color: "white",
  },

  // autor książki
  author: {
    fontSize: 14,
    color: "#cbd5e1",
  },

  // mini przycisk usuń
  deletePill: {
    backgroundColor: "#ef4444",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
  },

  deletePillText: {
    color: "white",
    fontWeight: "800",
    fontSize: 12,
  },
});
