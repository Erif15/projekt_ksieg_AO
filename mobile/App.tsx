import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import BookListScreen from "./src/screens/BookListScreen";
import BookDetailsScreen from "./src/screens/BookDetailsScreen";

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator>
        <Stack.Screen
          name="BookList"
          component={BookListScreen}
          options={{ title: "Lista książek" }}
        />
        <Stack.Screen
          name="BookDetails"
          component={BookDetailsScreen}
          options={{ title: "Szczegóły książki" }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
