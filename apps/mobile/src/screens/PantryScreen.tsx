import { useEffect, useState } from "react";
import { FlatList, Pressable, Text, TextInput, View } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { colors, s } from "../theme";

interface PantryItem {
  name: string;
  grams: number;
}
const KEY = "goodfood.pantry.v1";

/** Pantry (F5 MVP): device-local via AsyncStorage, mirroring the web pantry. */
export function PantryScreen() {
  const [items, setItems] = useState<PantryItem[]>([]);
  const [name, setName] = useState("");
  const [grams, setGrams] = useState("");

  useEffect(() => {
    AsyncStorage.getItem(KEY).then((raw) => raw && setItems(JSON.parse(raw) as PantryItem[]));
  }, []);

  async function persist(next: PantryItem[]) {
    setItems(next);
    await AsyncStorage.setItem(KEY, JSON.stringify(next));
  }

  function add() {
    const g = Number(grams);
    if (!name.trim() || !Number.isFinite(g) || g <= 0) return;
    persist([...items.filter((i) => i.name !== name.trim()), { name: name.trim(), grams: g }]);
    setName("");
    setGrams("");
  }

  return (
    <View style={s.screen}>
      <Text style={s.h1}>Pantry</Text>
      <TextInput style={s.input} placeholder="Food" value={name} onChangeText={setName} />
      <TextInput
        style={s.input}
        placeholder="grams"
        keyboardType="numeric"
        value={grams}
        onChangeText={setGrams}
      />
      <Pressable style={s.button} onPress={add}>
        <Text style={s.buttonText}>Add</Text>
      </Pressable>
      <FlatList
        style={{ marginTop: 16 }}
        data={items}
        keyExtractor={(i) => i.name}
        renderItem={({ item }) => (
          <View style={s.row}>
            <Text style={{ fontWeight: "600" }}>{item.name}</Text>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
              <Text>{Math.round(item.grams)} g</Text>
              <Pressable onPress={() => persist(items.filter((i) => i.name !== item.name))}>
                <Text style={{ color: colors.danger }}>Remove</Text>
              </Pressable>
            </View>
          </View>
        )}
      />
    </View>
  );
}
