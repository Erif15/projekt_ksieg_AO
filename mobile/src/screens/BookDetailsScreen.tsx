import { StyleSheet, Text, View } from "react-native";

// ekran szczegółów książki
export default function BookDetailsScreen({ route }: any) {
  const { book } = route.params;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{book.title}</Text>
      <Text style={styles.author}>{book.author}</Text>
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

  // tytuł książki
  title: {
    fontSize: 26,
    fontWeight: "800",
    color: "white",
    marginBottom: 8,
  },

  // autor książki
  author: {
    fontSize: 18,
    color: "#cbd5e1",
  },
});
