import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { deleteBook, getBook, updateBook } from "./api/apiClient";

export default function BookDetailsScreen({ route, navigation }: any) {
  const id = Number(route?.params?.id);

  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const [editing, setEditing] = useState(false);

  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");

  // oryginał do cofania zmian
  const [origTitle, setOrigTitle] = useState("");
  const [origAuthor, setOrigAuthor] = useState("");

  const [confirmSaveOpen, setConfirmSaveOpen] = useState(false);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);

  const canSave = useMemo(() => {
    return title.trim().length > 0 && author.trim().length > 0;
  }, [title, author]);

  async function load() {
    setLoading(true);
    try {
      const data = await getBook(id);

      const t = data?.title ?? "";
      const a = data?.author ?? "";

      setTitle(t);
      setAuthor(a);

      setOrigTitle(t);
      setOrigAuthor(a);
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

  function startEdit() {
    // start edycji od aktualnego oryginału
    setTitle(origTitle);
    setAuthor(origAuthor);
    setEditing(true);
  }

  function cancelEditToDetails() {
    // cofamy stan pól i wracamy do szczegółów
    setTitle(origTitle);
    setAuthor(origAuthor);
    setConfirmSaveOpen(false);
    setConfirmDeleteOpen(false);
    setEditing(false);
  }

  async function doSave() {
    if (!canSave) return;

    setBusy(true);
    try {
      const t = title.trim();
      const a = author.trim();

      await updateBook(id, { title: t, author: a });

      // zapisujemy jako nowy oryginał
      setOrigTitle(t);
      setOrigAuthor(a);

      setConfirmSaveOpen(false);
      setEditing(false);
    } catch (e: any) {
      Alert.alert("Błąd", e?.message ?? "Nie udało się zapisać zmian.");
    } finally {
      setBusy(false);
    }
  }

  async function doDelete() {
    setBusy(true);
    try {
      await deleteBook(id);
      setConfirmDeleteOpen(false);
      setEditing(false);
      navigation.goBack();
    } catch (e: any) {
      Alert.alert("Błąd", e?.message ?? "Nie udało się usunąć książki.");
    } finally {
      setBusy(false);
    }
  }

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.card}>
          <ActivityIndicator />
          <Text style={styles.note}>Pobieranie danych…</Text>
        </View>
      </View>
    );
  }

  // w szczegółach renderujemy Text (nie TextInput) => nie da się kliknąć/edytować
  const Field = ({
    label,
    value,
    onChangeText,
  }: {
    label: string;
    value: string;
    onChangeText: (v: string) => void;
  }) => {
    return (
      <>
        <Text style={styles.label}>{label}</Text>

        {editing ? (
          <TextInput
            value={value}
            onChangeText={onChangeText}
            placeholder={label}
            placeholderTextColor="#9fb0c2"
            style={styles.input}
          />
        ) : (
          <View style={styles.readonlyBox} pointerEvents="none">
            <Text style={styles.readonlyText}>{value}</Text>
          </View>
        )}
      </>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Szczegóły książki</Text>

      <View style={styles.card}>
        <Field label="Tytuł" value={title} onChangeText={setTitle} />
        <Field label="Autor" value={author} onChangeText={setAuthor} />

        {!editing ? (
          <View style={styles.centerRow}>
            <Pressable style={[styles.btn, styles.btnBlue]} onPress={startEdit}>
              <Text style={styles.btnText}>Zmień dane książki</Text>
            </Pressable>
          </View>
        ) : (
          <>
            <View style={styles.row}>
              <Pressable
                style={[
                  styles.btnSmall,
                  styles.btnGreen,
                  (!canSave || busy) && styles.btnDisabled,
                ]}
                disabled={!canSave || busy}
                onPress={() => setConfirmSaveOpen(true)}
              >
                <Text style={styles.btnText}>Zapisz</Text>
              </Pressable>

              <Pressable
                style={[
                  styles.btnSmall,
                  styles.btnGray,
                  busy && styles.btnDisabled,
                ]}
                disabled={busy}
                onPress={cancelEditToDetails}
              >
                <Text style={styles.btnText}>Anuluj</Text>
              </Pressable>
            </View>

            <View style={styles.centerRow}>
              <Pressable
                style={[styles.btn, styles.btnRed, busy && styles.btnDisabled]}
                disabled={busy}
                onPress={() => setConfirmDeleteOpen(true)}
              >
                <Text style={styles.btnText}>Usuń książkę</Text>
              </Pressable>
            </View>
          </>
        )}
      </View>

      {/* POTWIERDZENIE ZAPISU */}
      <Modal transparent visible={confirmSaveOpen} animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>
              Czy jesteś pewien, że chcesz dokonać zmiany?
            </Text>

            <View style={styles.modalRow}>
              <Pressable
                style={[
                  styles.modalBtn,
                  styles.btnGreen,
                  busy && styles.btnDisabled,
                ]}
                disabled={busy}
                onPress={doSave}
              >
                <Text style={styles.btnText}>TAK</Text>
              </Pressable>

              <Pressable
                style={[
                  styles.modalBtn,
                  styles.btnRed,
                  busy && styles.btnDisabled,
                ]}
                disabled={busy}
                onPress={() => {
                  // ✅ N I E  = NIE zapisuj + wyjdź z edycji do szczegółów + przywróć oryginał
                  cancelEditToDetails();
                }}
              >
                <Text style={styles.btnText}>NIE</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* POTWIERDZENIE USUNIĘCIA */}
      <Modal transparent visible={confirmDeleteOpen} animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Czy na pewno chcesz usunąć?</Text>

            <View style={styles.modalRow}>
              <Pressable
                style={[
                  styles.modalBtn,
                  styles.btnGreen,
                  busy && styles.btnDisabled,
                ]}
                disabled={busy}
                onPress={doDelete}
              >
                <Text style={styles.btnText}>TAK</Text>
              </Pressable>

              <Pressable
                style={[
                  styles.modalBtn,
                  styles.btnRed,
                  busy && styles.btnDisabled,
                ]}
                disabled={busy}
                onPress={() => {
                  // NIE przy usuwaniu = wracamy do szczegółów (bez usuwania)
                  setConfirmDeleteOpen(false);
                  cancelEditToDetails();
                }}
              >
                <Text style={styles.btnText}>NIE</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 18,
    backgroundColor: "#071224",
  },
  header: {
    color: "white",
    fontSize: 34,
    fontWeight: "900",
    marginBottom: 14,
  },
  card: {
    backgroundColor: "rgba(255,255,255,0.06)",
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
  },
  label: {
    color: "#cbd5e1",
    marginBottom: 6,
    marginTop: 10,
    fontWeight: "700",
  },
  input: {
    backgroundColor: "rgba(255,255,255,0.08)",
    borderRadius: 10,
    padding: 12,
    color: "white",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
  },

  readonlyBox: {
    backgroundColor: "rgba(255,255,255,0.06)",
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
  },
  readonlyText: {
    color: "white",
  },

  row: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 14,
    marginTop: 16,
  },
  centerRow: {
    alignItems: "center",
    marginTop: 14,
  },

  btn: {
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 12,
    alignItems: "center",
    minWidth: 260,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
  },
  btnSmall: {
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 12,
    alignItems: "center",
    minWidth: 200,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
  },
  btnText: {
    color: "white",
    fontWeight: "800",
  },
  btnBlue: { backgroundColor: "#1d4ed8" },
  btnGreen: { backgroundColor: "#22c55e" },
  btnRed: { backgroundColor: "#ef4444" },
  btnGray: { backgroundColor: "#475569" },
  btnDisabled: { opacity: 0.55 },

  note: {
    color: "#cbd5e1",
    marginTop: 10,
    textAlign: "center",
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.55)",
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
  modalTitle: {
    color: "white",
    fontWeight: "900",
    fontSize: 16,
    textAlign: "center",
    marginBottom: 14,
  },
  modalRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 12,
  },
  modalBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
  },
});
