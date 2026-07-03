import { useEffect, useState } from "react";
import { FlatList, Pressable, Text, View } from "react-native";
import { api, type ProofRow } from "../api";
import { colors, s } from "../theme";

/** Planner (F5 MVP): generate a plan and view its nutrient proof. Missing data renders "—"
 *  (never 0) and the confidence is shown, mirroring the web invariants. */
export function PlannerScreen() {
  const [planId, setPlanId] = useState<string | null>(null);
  const [proof, setProof] = useState<ProofRow[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function loadLatest() {
    try {
      const { plans } = await api.listPlans();
      if (plans[0]) {
        setPlanId(plans[0].id);
        setProof((await api.proof(plans[0].id)).proof);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load");
    }
  }

  useEffect(() => {
    loadLatest();
  }, []);

  async function generate() {
    setBusy(true);
    setError(null);
    try {
      const out = await api.generate();
      if (out.planId) {
        setPlanId(out.planId);
        setProof((await api.proof(out.planId)).proof);
      } else {
        setError("Plan was not feasible with the current settings.");
      }
    } catch (e) {
      setError(e instanceof Error ? `${e.message} (is the solver running?)` : "Generate failed");
    } finally {
      setBusy(false);
    }
  }

  const active = proof.filter((r) => r.mode !== "DISABLED");

  return (
    <View style={s.screen}>
      <Text style={s.h1}>Planner</Text>
      <Pressable style={s.button} onPress={generate} disabled={busy}>
        <Text style={s.buttonText}>{busy ? "Generating…" : "Generate a plan"}</Text>
      </Pressable>
      {error && <Text style={[s.error, { marginTop: 12 }]}>{error}</Text>}
      {planId && (
        <Text style={[s.p, { marginTop: 16 }]}>Nutrient proof · missing shown as “—”, never 0</Text>
      )}
      <FlatList
        data={active}
        keyExtractor={(r) => r.nutrientKey}
        renderItem={({ item }) => (
          <View style={s.row}>
            <Text style={{ fontWeight: "600" }}>{item.nutrientKey}</Text>
            <View style={{ alignItems: "flex-end" }}>
              <Text>
                {item.consumed == null ? "—" : `${Math.round(item.consumed)} ${item.unit}`}
              </Text>
              <Text style={{ color: item.status === "MET" ? colors.brand : colors.muted, fontSize: 12 }}>
                {item.status}
                {item.confidence !== "COMPLETE" ? ` · ${item.confidence.toLowerCase()}` : ""}
              </Text>
            </View>
          </View>
        )}
      />
    </View>
  );
}
