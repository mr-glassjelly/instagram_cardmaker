export interface SubSection {
  id: string;
  title: string;
  body: string;
}

export interface BookInput {
  title: string;
  author: string;
  sections: SubSection[];
}
