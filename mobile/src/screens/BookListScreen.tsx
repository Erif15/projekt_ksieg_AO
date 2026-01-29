import React, { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { createBook, getBooks, Book } from "./api/apiClient";

export default function BookListScreen({ navigation }: any) {
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");

  const canAdd = useMemo(() => {
    return title.trim().length > 0 && author.trim().length > 0;
  }, [title, author]);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getBooks();
      setBooks(Array.isArray(data) ? data : []);
    } catch (e: any) {
      Alert.alert("Błąd", e?.message ?? "Nie udało się pobrać książek.");
    } finally {
      setLoading(false);
    }
  }, []);

  // odświeżaj listę zawsze gdy wracasz na ekran listy
  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh])
  );

  const sortedBooks = useMemo(() => {
    return [...books].sort((a, b) =>
      (a.title ?? "").localeCompare(b.title ?? "", "pl", { sensitivity: "base" })
    );
  }, [books]);

  async function onAdd() {
    if (!canAdd) return;

    setSaving(true);
    try {
      await createBook({ title: title.trim(), author: author.trim() });
      setTitle("");
      setAuthor("");
      await refresh();
    } catch (e: any) {
      Alert.alert("Błąd", e?.message ?? "Nie udało się dodać książki.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Lista książek</Text>

      <View style={styles.form}>
        <TextInput
          placeholder="Tytuł"
          placeholderTextColor="#9fb0c2"
          value={title}
          onChangeText={setTitle}
          style={styles.input}
        />
        <TextInput
          placeholder="Autor"
          placeholderTextColor="#9fb0c2"
          value={author}
          onChangeText={setAuthor}
          style={styles.input}
        />

        <Pressable
          onPress={onAdd}
          disabled={!canAdd || saving}
          style={[
            styles.addButton,
            (!canAdd || saving) && { opacity: 0.6 },
          ]}
        >
          <Text style={styles.addButtonText}>
            {saving ? "Dodawanie..." : "+ Dodaj"}
          </Text>
        </Pressable>
      </View>

      {loading ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator />
          <Text style={styles.note}>Pobieranie danych...</Text>
        </View>
      ) : (
        <FlatList
          data={sortedBooks}
          keyExtractor={(item) => String(item.id)}
          renderItem={({ item }) => (
            <Pressable
              onPress={() => navigation.navigate("BookDetails", { id: item.id })}
              style={styles.item}
            >
              <View style={{ flex: 1 }}>
                <Text style={styles.title}>{item.title}</Text>
                <Text style={styles.author}>{item.author}</Text>
              </View>
              <Text style={styles.chevron}>›</Text>
            </Pressable>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: "#06111f" },
  header: { color: "white", fontSize: 34, fontWeight: "900", marginBottom: 14 },
  form: {
    backgroundColor: "rgba(255,255,255,0.06)",
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    marginBottom: 12,
  },
  input: {
    backgroundColor: "rgba(255,255,255,0.08)",
    borderRadius: 10,
    padding: 12,
    color: "white",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    marginBottom: 10,
  },
  addButton: {
    backgroundColor: "#1d4ed8",
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
  },
  addButtonText: { color: "white", fontWeight: "800" },
  loadingBox: { padding: 16, alignItems: "center" },
  note: { color: "#cbd5e1", marginTop: 8 },

  item: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    marginBottom: 10,
  },
  title: { color: "white", fontWeight: "800", fontSize: 18 },
  author: { color: "#cbd5e1", marginTop: 2 },
  chevron: { color: "#94a3b8", fontSize: 26, fontWeight: "800" },
});
