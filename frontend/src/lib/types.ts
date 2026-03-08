export interface SubSection {
  id: string;
  title: string;
  body: string;
}

export type AspectRatio = "1:1" | "3:4" | "4:5";

export interface BookInput {
  title: string;
  author: string;
  sections: SubSection[];
  aspectRatio: AspectRatio;
}
