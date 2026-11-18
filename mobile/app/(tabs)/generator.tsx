import { Redirect } from "expo-router";
import { useAuth } from "../../src/context/AuthContext";
import { GeneratorModeScreen } from "../../src/screens/GeneratorScreen";
import { View, ActivityIndicator } from "react-native";

export default function Generator() {
  const { session, loading, userProfile } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#6366f1" />
      </View>
    );
  }

  // Jika ingin buat undangan tapi belum login, suruh login dulu
  if (!session) {
    return <Redirect href="/login" />;
  }

  return (
    <GeneratorModeScreen
      mode={userProfile?.subscription_status === "premium" ? "premium" : "free"}
    />
  );
}
