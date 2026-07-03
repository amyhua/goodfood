import { useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { api, type PublicUser } from "./src/api";
import { AuthScreen } from "./src/screens/AuthScreen";
import { HomeScreen } from "./src/screens/HomeScreen";
import { PlannerScreen } from "./src/screens/PlannerScreen";
import { PantryScreen } from "./src/screens/PantryScreen";
import { ShoppingScreen } from "./src/screens/ShoppingScreen";

export type RootStackParamList = {
  Auth: undefined;
  Home: undefined;
  Planner: undefined;
  Pantry: undefined;
  Shopping: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  const [user, setUser] = useState<PublicUser | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    api
      .me()
      .then((r) => setUser(r.user))
      .catch(() => setUser(null))
      .finally(() => setReady(true));
  }, []);

  if (!ready) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <StatusBar style="auto" />
      <NavigationContainer>
        <Stack.Navigator>
          {user ? (
            <>
              <Stack.Screen name="Home" options={{ title: "goodfood" }}>
                {(props) => <HomeScreen {...props} user={user} onSignOut={() => setUser(null)} />}
              </Stack.Screen>
              <Stack.Screen name="Planner" component={PlannerScreen} />
              <Stack.Screen name="Pantry" component={PantryScreen} />
              <Stack.Screen name="Shopping" component={ShoppingScreen} />
            </>
          ) : (
            <Stack.Screen name="Auth" options={{ title: "Sign in" }}>
              {(props) => <AuthScreen {...props} onAuthed={setUser} />}
            </Stack.Screen>
          )}
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
