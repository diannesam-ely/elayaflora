import { Platform } from "react-native";
import { BACKEND_URL, tokenStore } from "./api";

export type UploadResult = { path: string; url: string; content_type: string };

/**
 * Upload a local file (image/document) picked from the device to our backend,
 * which stores it in Emergent Object Storage.
 *
 * Android/iOS: uses XMLHttpRequest, which goes through React Native's native
 * multipart networking and reliably supports the { uri, name, type } file part
 * for gallery/camera URIs (file:// and content://). This avoids the
 * "Unsupported FormDataPart implementation" error thrown by Expo SDK 54+'s
 * WinterCG fetch, which rejects the legacy object-based FormData part.
 *
 * Web: uses the standard fetch + Blob body.
 * Returns the backend file reference ("/api/files/...").
 */
export async function uploadFile(uri: string, name = "upload.jpg", type = "image/jpeg"): Promise<UploadResult> {
  const token = await tokenStore.get();

  // ----- Web -----
  if (Platform.OS === "web") {
    const form = new FormData();
    const blob = await (await fetch(uri)).blob();
    form.append("file", blob, name);
    const res = await fetch(`${BACKEND_URL}/api/upload`, {
      method: "POST",
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      body: form,
    });
    if (!res.ok) throw new Error((await res.text()) || `Upload failed (${res.status})`);
    return res.json();
  }

  // ----- Native (Android / iOS) -----
  const ext = (uri.split("?")[0].split("#")[0].split(".").pop() || "jpg").toLowerCase();
  const safeName = name && name.includes(".") ? name : `${(name || "upload").replace(/\W+/g, "_")}.${ext}`;
  const mime =
    type ||
    (ext === "png" ? "image/png" : ext === "webp" ? "image/webp" : ext === "heic" || ext === "heif" ? "image/heic" : "image/jpeg");

  const form = new FormData();
  // React Native's native networking understands this shape for local files.
  form.append("file", { uri, name: safeName, type: mime } as any);

  return new Promise<UploadResult>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", `${BACKEND_URL}/api/upload`);
    if (token) xhr.setRequestHeader("Authorization", `Bearer ${token}`);
    // NOTE: never set Content-Type manually — RN adds the multipart boundary.
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          resolve(JSON.parse(xhr.responseText));
        } catch {
          reject(new Error("Unexpected response from server."));
        }
      } else {
        let msg = `Upload failed (${xhr.status})`;
        try {
          const d = JSON.parse(xhr.responseText);
          if (d?.detail) msg = typeof d.detail === "string" ? d.detail : JSON.stringify(d.detail);
        } catch {}
        reject(new Error(msg));
      }
    };
    xhr.onerror = () => reject(new Error("Network error during upload. Check your connection and try again."));
    xhr.ontimeout = () => reject(new Error("Upload timed out. Please try again."));
    xhr.timeout = 60000;
    xhr.send(form);
  });
}
