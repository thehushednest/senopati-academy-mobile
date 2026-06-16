import { Redirect } from "expo-router";
import { useAuth } from "@/lib/auth-context";

export default function Index() {
  const { user, isBootstrapping } = useAuth();
  if (isBootstrapping) return null;
  return <Redirect href={user ? "/(tabs)" : "/(auth)/welcome"} />;
}
