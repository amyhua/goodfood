import { useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";
import { api, type PublicUser } from "../api";
import { s } from "../theme";

/** Auth screen (F5 MVP): sign in / sign up against the shared cookie-session API. */
export function AuthScreen({ onAuthed }: { onAuthed: (u: PublicUser) => void }) {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit() {
    setBusy(true);
    setError(null);
    try {
      const r = mode === "signup" ? await api.signup(email, password) : await api.login(email, password);
      onAuthed(r.user);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <View style={s.screen}>
      <Text style={s.h1}>{mode === "signup" ? "Create account" : "Sign in"}</Text>
      <Text style={s.p}>Access your saved meal plans and shopping lists.</Text>
      <TextInput
        style={s.input}
        placeholder="Email"
        autoCapitalize="none"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
      />
      <TextInput
        style={s.input}
        placeholder="Password"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />
      {error && <Text style={s.error}>{error}</Text>}
      <Pressable style={s.button} onPress={submit} disabled={busy}>
        <Text style={s.buttonText}>{busy ? "Please wait…" : mode === "signup" ? "Create account" : "Sign in"}</Text>
      </Pressable>
      <Pressable style={s.outlineButton} onPress={() => setMode(mode === "signup" ? "login" : "signup")}>
        <Text>{mode === "signup" ? "Have an account? Sign in" : "New here? Create an account"}</Text>
      </Pressable>
    </View>
  );
}
