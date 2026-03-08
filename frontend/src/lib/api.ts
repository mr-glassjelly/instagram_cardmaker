const API_BASE = "/api";

export interface GenerateCardRequest {
  title: string;
  summary: string;
  model?: string;
}

export interface GenerateCardResponse {
  card_id: string;
  image_url: string;
  cards: CardPage[];
}

export interface CardPage {
  page: number;
  image_url: string;
  text: string;
}

export interface PostToInstagramRequest {
  card_id: string;
  caption?: string;
}

export async function generateCard(data: GenerateCardRequest): Promise<GenerateCardResponse> {
  const res = await fetch(`${API_BASE}/cards/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function postToInstagram(data: PostToInstagramRequest): Promise<{ success: boolean; post_url?: string }> {
  const res = await fetch(`${API_BASE}/instagram/post`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}
