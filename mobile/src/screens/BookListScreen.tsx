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

  const canAdd = useMemo(() => title.trim().length > 0 && author.trim().length > 0, [title, author]);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getBooks();
      // sort alfabetycznie
      const sorted = [...data].sort((a, b) => (a.title || "").localeCompare(b.title || "", "pl"));
      setBooks(sorted);
    } catch (e: any) {
      Alert.alert("Błąd", e?.message ?? "Nie udało się pobrać książek.");
    } finally {
      setLoading(false);
    }
  }, []);

  // odświeżaj listę po powrocie ze szczegółów
  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh])
  );

  async function onAdd() {
    if (!canAdd) return;

    setSaving(true);
    try {
      await createBook({ title: title.trim(), author: author.trim(), description: "", rating: undefined });
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
      <Text style={styles.h1}>Podręczna biblioteka</Text>

      <View style={styles.card}>
        <TextInput
          placeholder="Tytuł"
          placeholderTextColor="#9f0bc2"
          value={title}
          onChangeText={setTitle}
          style={styles.input}
        />
        <TextInput
          placeholder="Autor"
          placeholderTextColor="#9f0bc2"
          value={author}
          onChangeText={setAuthor}
          style={styles.input}
        />

        <Pressable
          onPress={onAdd}
          disabled={!canAdd || saving}
          style={[styles.addButton, (!canAdd || saving) && { opacity: 0.6 }]}
        >
          <Text style={styles.addButtonText}>{saving ? "Dodawanie..." : "+ Dodaj"}</Text>
        </Pressable>
      </View>

      {loading ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator />
          <Text style={styles.note}>Pobieranie danych...</Text>
        </View>
      ) : (
        <FlatList
          data={books}
          keyExtractor={(item) => String(item.id)}
          renderItem={({ item }) => (
            <Pressable
              onPress={() => navigation.navigate("BookDetails", { id: item.id })}
              style={styles.item}
            >
              <View style={{ flex: 1 }}>
                <Text style={styles.title}>
                  {item.favorite ? "★ " : ""}
                  {item.title}
                </Text>
                <Text style={styles.author}>{item.author}</Text>
              </View>
              <Text style={styles.chevron}>›</Text>
            </Pressable>
          )}
          ListEmptyComponent={<Text style={styles.note}>Brak książek. Dodaj pierwszą.</Text>}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: "#07121f" },
  h1: { color: "white", fontSize: 32, fontWeight: "800", marginBottom: 12 },

  card: {
    backgroundColor: "rgba(255,255,255,0.06)",
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    marginBottom: 14,
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
  title: { color: "white", fontWeight: "800", fontSize: 16 },
  author: { color: "#cbd5e1", marginTop: 2 },
  chevron: { color: "#94a3b8", fontSize: 26, fontWeight: "700" },
});
