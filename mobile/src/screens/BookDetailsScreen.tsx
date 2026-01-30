import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { Book, deleteBook, getBook, setFavorite, updateBook } from "./api/apiClient";

export default function BookDetailsScreen({ route, navigation }: any) {
  const id = String(route?.params?.id ?? "");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [book, setBook] = useState<Book | null>(null);

  // pola edycji
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [description, setDescription] = useState("");
  const [ratingText, setRatingText] = useState("");
  const [coverUri, setCoverUri] = useState<string | undefined>(undefined);

  // snapshot do anulowania
  const [snapshot, setSnapshot] = useState<Book | null>(null);

  // modale
  const [confirmSaveOpen, setConfirmSaveOpen] = useState(false);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [confirmCoverOpen, setConfirmCoverOpen] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const data = await getBook(id);
      setBook(data);

      setTitle(data.title ?? "");
      setAuthor(data.author ?? "");
      setDescription(data.description ?? "");
      setRatingText(data.rating != null ? String(data.rating) : "");
      setCoverUri(data.coverUri);

      navigation.setOptions({ title: data.title || "Książka" });
    } catch (e: any) {
      Alert.alert("Błąd", e?.message ?? "Nie udało się pobrać szczegółów.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const canSave = useMemo(() => {
    if (!editing) return false;
    if (title.trim().length === 0 || author.trim().length === 0) return false;

    if (ratingText.trim().length === 0) return true;
    const n = Number(ratingText);
    return Number.isFinite(n) && n >= 1 && n <= 5;
  }, [editing, title, author, ratingText]);

  function enterEdit() {
    if (!book) return;
    setSnapshot(book); // do anulowania i “NIE” przy usuwaniu
    setEditing(true);
  }

  function exitEditRestoreSnapshot() {
    if (!snapshot) {
      setEditing(false);
      return;
    }
    setBook(snapshot);

    setTitle(snapshot.title ?? "");
    setAuthor(snapshot.author ?? "");
    setDescription(snapshot.description ?? "");
    setRatingText(snapshot.rating != null ? String(snapshot.rating) : "");
    setCoverUri(snapshot.coverUri);

    setEditing(false);
  }

  async function doSave() {
    if (!book) return;
    if (!canSave) return;

    setSaving(true);
    try {
      const rating =
        ratingText.trim().length === 0 ? undefined : Math.max(1, Math.min(5, Number(ratingText)));

      const updated = await updateBook(book.id, {
        title: title.trim(),
        author: author.trim(),
        description: description ?? "",
        rating: rating,
        coverUri,
      });

      setBook(updated);
      setSnapshot(updated);
      setEditing(false);
      setConfirmSaveOpen(false);
      navigation.setOptions({ title: updated.title || "Książka" });
    } catch (e: any) {
      Alert.alert("Błąd", e?.message ?? "Nie udało się zapisać zmian.");
    } finally {
      setSaving(false);
    }
  }

  async function toggleFav() {
    if (!book) return;
    try {
      const updated = await setFavorite(book.id, !Boolean(book.favorite));
      setBook(updated);
      if (editing) setSnapshot(updated);
    } catch (e: any) {
      Alert.alert("Błąd", e?.message ?? "Nie udało się zmienić ulubionych.");
    }
  }

  async function takeCoverPhoto() {
    // UWAGA: tu jest prawdziwa funkcja natywna (aparat).
    // Jeśli trzymasz backend bez plików, zapisujemy tylko URI,
    // żeby pokazać “jak by to działało” w realnej aplikacji.
    // (Twoje wymaganie: pokazać funkcję natywną — aparat.)
    setConfirmCoverOpen(false);

    try {
      const perm = await ImagePicker.requestCameraPermissionsAsync();
      if (!perm.granted) {
        Alert.alert("Brak uprawnień", "Aplikacja nie ma dostępu do aparatu.");
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        quality: 0.7,
      });

      if (result.canceled) return;

      const uri = result.assets?.[0]?.uri;
      if (uri) setCoverUri(uri);
    } catch (e: any) {
      Alert.alert("Błąd", e?.message ?? "Nie udało się dodać okładki.");
    }
  }

  async function doDelete() {
    if (!book) return;

    setSaving(true);
    try {
      await deleteBook(book.id);
      setConfirmDeleteOpen(false);
      setEditing(false);
      navigation.goBack();
    } catch (e: any) {
      Alert.alert("Błąd", e?.message ?? "Nie udało się usunąć książki.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingBox}>
          <ActivityIndicator />
          <Text style={styles.note}>Ładowanie...</Text>
        </View>
      </View>
    );
  }

  if (!book) {
    return (
      <View style={styles.container}>
        <Text style={styles.note}>Nie znaleziono książki.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Nagłówek na ekranie (duży tytuł + mniejszy autor) */}
      <View style={styles.header}>
        <Text style={styles.bigTitle}>{book.title}</Text>
        <Text style={styles.smallAuthor}>{book.author}</Text>

        <Pressable onPress={toggleFav} style={styles.favBtn}>
          <Text style={styles.favTxt}>{book.favorite ? "★ Ulubiona" : "☆ Dodaj do ulubionych"}</Text>
        </Pressable>
      </View>

      <View style={styles.card}>
        {/* OKŁADKA */}
        <View style={styles.coverRow}>
          {coverUri ? (
            <Image source={{ uri: coverUri }} style={styles.coverImg} />
          ) : (
            <View style={styles.coverPlaceholder}>
              <Text style={styles.coverPlus}>＋</Text>
              <Text style={styles.coverNote}>Brak okładki</Text>
            </View>
          )}

          {editing ? (
            <Pressable onPress={() => setConfirmCoverOpen(true)} style={styles.coverBtn}>
              <Text style={styles.coverBtnTxt}>Dodaj okładkę</Text>
            </Pressable>
          ) : (
            <Text style={styles.coverHelp}>Okładkę dodasz w edycji</Text>
          )}
        </View>

        {/* Pola: w szczegółach NIEKLIKALNE, w edycji edytowalne */}
        <Text style={styles.label}>Tytuł</Text>
        {editing ? (
          <TextInput value={title} onChangeText={setTitle} style={styles.input} />
        ) : (
          <View style={styles.inputDisabled}>
            <Text style={styles.inputDisabledText}>{book.title}</Text>
          </View>
        )}

        <Text style={styles.label}>Autor</Text>
        {editing ? (
          <TextInput value={author} onChangeText={setAuthor} style={styles.input} />
        ) : (
          <View style={styles.inputDisabled}>
            <Text style={styles.inputDisabledText}>{book.author}</Text>
          </View>
        )}

        <Text style={styles.label}>Opis</Text>
        {editing ? (
          <TextInput
            value={description}
            onChangeText={setDescription}
            style={[styles.input, { minHeight: 90, textAlignVertical: "top" }]}
            multiline
          />
        ) : (
          <View style={[styles.inputDisabled, { minHeight: 90 }]}>
            <Text style={styles.inputDisabledText}>{book.description ? book.description : "—"}</Text>
          </View>
        )}

        <Text style={styles.label}>Ocena (1–5)</Text>
        {editing ? (
          <TextInput
            value={ratingText}
            onChangeText={setRatingText}
            style={styles.input}
            keyboardType="numeric"
            placeholder="np. 5"
            placeholderTextColor="#9ca3af"
          />
        ) : (
          <View style={styles.inputDisabled}>
            <Text style={styles.inputDisabledText}>{book.rating != null ? String(book.rating) : "—"}</Text>
          </View>
        )}

        {/* Przyciski */}
        {!editing ? (
          <Pressable style={styles.primaryBtn} onPress={enterEdit}>
            <Text style={styles.primaryTxt}>Zmień dane książki</Text>
          </Pressable>
        ) : (
          <View style={styles.row}>
            <Pressable
              style={[styles.saveBtn, (!canSave || saving) && { opacity: 0.6 }]}
              disabled={!canSave || saving}
              onPress={() => setConfirmSaveOpen(true)}
            >
              <Text style={styles.btnTxt}>{saving ? "Zapisywanie..." : "Zapisz"}</Text>
            </Pressable>

            <Pressable style={styles.cancelBtn} onPress={exitEditRestoreSnapshot} disabled={saving}>
              <Text style={styles.btnTxt}>Anuluj</Text>
            </Pressable>
          </View>
        )}

        {/* USUWANIE tylko w edycji */}
        {editing ? (
          <Pressable style={styles.deleteBtn} onPress={() => setConfirmDeleteOpen(true)} disabled={saving}>
            <Text style={styles.btnTxt}>Usuń książkę</Text>
          </Pressable>
        ) : null}
      </View>

      {/* MODAL: potwierdź zapis */}
      <Modal transparent visible={confirmSaveOpen} animationType="fade" onRequestClose={() => setConfirmSaveOpen(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Czy jesteś pewien, że chcesz dokonać zmiany?</Text>
            <View style={styles.modalRow}>
              <Pressable style={[styles.modalBtn, styles.modalYes]} onPress={doSave} disabled={saving}>
                <Text style={styles.modalBtnTxt}>TAK</Text>
              </Pressable>
              <Pressable
                style={[styles.modalBtn, styles.modalNo]}
                onPress={() => setConfirmSaveOpen(false)}
                disabled={saving}
              >
                <Text style={styles.modalBtnTxt}>NIE</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* MODAL: potwierdź usuwanie */}
      <Modal transparent visible={confirmDeleteOpen} animationType="fade" onRequestClose={() => setConfirmDeleteOpen(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Czy na pewno chcesz usunąć?</Text>
            <View style={styles.modalRow}>
              <Pressable style={[styles.modalBtn, styles.modalYes]} onPress={doDelete} disabled={saving}>
                <Text style={styles.modalBtnTxt}>TAK</Text>
              </Pressable>
              <Pressable
                style={[styles.modalBtn, styles.modalNo]}
                onPress={() => {
                  // “NIE” ma wrócić do szczegółów (wyjść z edycji)
                  setConfirmDeleteOpen(false);
                  exitEditRestoreSnapshot();
                }}
                disabled={saving}
              >
                <Text style={styles.modalBtnTxt}>NIE</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* MODAL: dodaj okładkę */}
      <Modal transparent visible={confirmCoverOpen} animationType="fade" onRequestClose={() => setConfirmCoverOpen(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Dodaj okładkę aparatem?</Text>
            <View style={styles.modalRow}>
              <Pressable style={[styles.modalBtn, styles.modalYes]} onPress={takeCoverPhoto}>
                <Text style={styles.modalBtnTxt}>TAK</Text>
              </Pressable>
              <Pressable style={[styles.modalBtn, styles.modalNo]} onPress={() => setConfirmCoverOpen(false)}>
                <Text style={styles.modalBtnTxt}>ANULUJ</Text>
              </Pressable>
            </View>

            <Text style={styles.modalHint}>
              {/* komentarz do projektu */}
              Chciałam tylko zobrazować taką możliwość (okładka z aparatu). W realnej aplikacji zdjęcie
              trafiłoby do storage/bazy — tutaj zapisujemy tylko URI.
            </Text>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: "#07121f" },

  header: { marginBottom: 12 },
  bigTitle: { color: "white", fontSize: 30, fontWeight: "900" },
  smallAuthor: { color: "#cbd5e1", fontSize: 16, marginTop: 4 },

  favBtn: { alignSelf: "flex-start", marginTop: 10, paddingVertical: 8, paddingHorizontal: 12, borderRadius: 10, backgroundColor: "rgba(255,255,255,0.06)", borderWidth: 1, borderColor: "rgba(255,255,255,0.12)" },
  favTxt: { color: "#e5e7eb", fontWeight: "700" },

  card: {
    backgroundColor: "rgba(255,255,255,0.06)",
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
  },

  coverRow: { flexDirection: "row", gap: 12, alignItems: "center", marginBottom: 14 },
  coverImg: { width: 86, height: 120, borderRadius: 12, borderWidth: 1, borderColor: "rgba(255,255,255,0.12)" },
  coverPlaceholder: {
    width: 86,
    height: 120,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    backgroundColor: "rgba(255,255,255,0.04)",
    alignItems: "center",
    justifyContent: "center",
    padding: 8,
  },
  coverPlus: { color: "#94a3b8", fontSize: 26, fontWeight: "900" },
  coverNote: { color: "#94a3b8", fontSize: 12, marginTop: 4, textAlign: "center" },

  coverBtn: { backgroundColor: "#334155", paddingVertical: 10, paddingHorizontal: 12, borderRadius: 12 },
  coverBtnTxt: { color: "white", fontWeight: "800" },
  coverHelp: { color: "#9ca3af", flex: 1 },

  label: { color: "white", fontWeight: "800", marginBottom: 6, marginTop: 10 },

  input: {
    backgroundColor: "rgba(255,255,255,0.08)",
    borderRadius: 10,
    padding: 12,
    color: "white",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
  },

  inputDisabled: {
    backgroundColor: "rgba(0,0,0,0.20)",
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
  },
  inputDisabledText: { color: "#e5e7eb", fontWeight: "600" },

  primaryBtn: {
    marginTop: 14,
    alignSelf: "center",
    width: 280,
    backgroundColor: "#1d4ed8",
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
  },
  primaryTxt: { color: "white", fontWeight: "900" },

  row: { flexDirection: "row", gap: 12, justifyContent: "center", marginTop: 14 },
  saveBtn: { width: 200, backgroundColor: "#16a34a", paddingVertical: 12, borderRadius: 12, alignItems: "center" },
  cancelBtn: { width: 200, backgroundColor: "#475569", paddingVertical: 12, borderRadius: 12, alignItems: "center" },
  deleteBtn: { marginTop: 12, alignSelf: "center", width: 260, backgroundColor: "#7f1d1d", paddingVertical: 12, borderRadius: 12, alignItems: "center" },
  btnTxt: { color: "white", fontWeight: "900" },

  loadingBox: { padding: 16, alignItems: "center" },
  note: { color: "#cbd5e1", marginTop: 8 },

  modalOverlay: {
    backgroundColor: "rgba(0,0,0,0.55)",
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 18,
  },
  modalBox: {
    width: "100%",
    maxWidth: 520,
    backgroundColor: "#0b1a33",
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
  },
  modalTitle: { color: "white", fontWeight: "900", fontSize: 16, textAlign: "center", marginBottom: 14 },
  modalRow: { flexDirection: "row", justifyContent: "space-between", gap: 12 },
  modalBtn: { flex: 1, paddingVertical: 12, borderRadius: 12, alignItems: "center", borderWidth: 1 },
  modalYes: { backgroundColor: "#22c55e", borderColor: "rgba(255,255,255,0.20)" },
  modalNo: { backgroundColor: "#ef4444", borderColor: "rgba(255,255,255,0.20)" },
  modalBtnTxt: { color: "white", fontWeight: "900" },
  modalHint: { color: "#cbd5e1", marginTop: 12, fontSize: 12, textAlign: "center" },
});
