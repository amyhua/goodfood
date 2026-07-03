import { useEffect, useState } from "react";
import { FlatList, Text, View } from "react-native";
import { API_URL } from "../config";
import { s } from "../theme";

interface SavedList {
  id: string;
  name: string;
  items: { foodName: string; grams: number | null; category: string }[];
}

/** Shopping (F5 MVP): the caller's saved shopping lists from the API, grouped read-only. */
export function ShoppingScreen() {
  const [lists, setLists] = useState<SavedList[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`${API_URL}/api/shopping-lists`)
      .then((r) => r.json())
      .then((b) => setLists(b.lists ?? []))
      .catch((e) => setError(e instanceof Error ? e.message : "Failed"));
  }, []);

  return (
    <View style={s.screen}>
      <Text style={s.h1}>Shopping lists</Text>
      {error && <Text style={s.error}>{error}</Text>}
      {lists.length === 0 && !error && <Text style={s.p}>No saved lists yet.</Text>}
      <FlatList
        data={lists}
        keyExtractor={(l) => l.id}
        renderItem={({ item }) => (
          <View style={{ marginBottom: 16 }}>
            <Text style={{ fontWeight: "700", marginBottom: 6 }}>{item.name}</Text>
            {item.items.map((it, i) => (
              <View key={`${it.foodName}-${i}`} style={s.row}>
                <Text>{it.foodName}</Text>
                <Text>{it.grams == null ? "—" : `${Math.round(it.grams)} g`}</Text>
              </View>
            ))}
          </View>
        )}
      />
    </View>
  );
}
