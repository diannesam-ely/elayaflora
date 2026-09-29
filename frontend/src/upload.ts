import { Platform } from "react-native";
import { BACKEND_URL, tokenStore } from "./api";

export type UploadResult = { path: string; url: string; content_type: string };

/** Upload a local file (image/document) picked from the device to our backend,
 * which stores it in Emergent Object Storage. Handles the web vs native
 * FormData body difference. Returns the backend file reference ("/api/files/..."). */
export async function uploadFile(uri: string, name = "upload.jpg", type = "image/jpeg"): Promise<UploadResult> {
  const token = await tokenStore.get();
  const form = new FormData();
  if (Platform.OS === "web") {
    const blob = await (await fetch(uri)).blob();
    form.append("file", blob, name);
  } else {
    form.append("file", { uri, name, type } as any);
  }
  const res = await fetch(`${BACKEND_URL}/api/upload`, {
    method: "POST",
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    body: form,
  });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(t || `Upload failed (${res.status})`);
  }
  return res.json();
}
