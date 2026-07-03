import { Pressable, Text, View } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../../App";
import { api, type PublicUser } from "../api";
import { s } from "../theme";

type Props = NativeStackScreenProps<RootStackParamList, "Home"> & {
  user: PublicUser;
  onSignOut: () => void;
};

/** Home hub (F5 MVP): entry to the MVP screens + sign out. */
export function HomeScreen({ navigation, user, onSignOut }: Props) {
  async function signOut() {
    await api.logout().catch(() => undefined);
    onSignOut();
  }
  return (
    <View style={s.screen}>
      <Text style={s.h1}>Hi {user.name ?? user.email}</Text>
      <Text style={s.p}>Source-traceable meal plans with a nutrient proof.</Text>
      <Pressable style={s.button} onPress={() => navigation.navigate("Planner")}>
        <Text style={s.buttonText}>Planner</Text>
      </Pressable>
      <Pressable style={s.outlineButton} onPress={() => navigation.navigate("Pantry")}>
        <Text>Pantry</Text>
      </Pressable>
      <Pressable style={s.outlineButton} onPress={() => navigation.navigate("Shopping")}>
        <Text>Shopping</Text>
      </Pressable>
      <Pressable style={s.outlineButton} onPress={signOut}>
        <Text>Sign out</Text>
      </Pressable>
    </View>
  );
}
