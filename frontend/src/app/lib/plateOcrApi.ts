import { apiGet, apiPostForm } from "./api";

export type PlateOcrResponse = {
  plate: string | null;
  rawText: string;
  available: boolean;
};

export async function warmUpPlateOcr(token: string, timeoutMs = 90_000): Promise<boolean> {
  try {
    const res = await apiGet<{ ready: boolean; available: boolean }>(
      "/api/ocr/ready",
      token,
      { timeoutMs },
    );
    return res.ready && res.available;
  } catch {
    return false;
  }
}

export async function recognizePlateImage(blob: Blob, token: string): Promise<PlateOcrResponse> {
  const form = new FormData();
  form.append("image", blob, "plate.jpg");
  return apiPostForm<PlateOcrResponse>("/api/ocr/plate", form, token);
}
