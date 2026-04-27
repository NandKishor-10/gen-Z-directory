export interface Slang {
  id: string;
  term: string;
  meaning: string;
  millennialTranslation: string;
  example: string;
  usageCount?: number;
  category?: string;
}

export interface DictionaryData {
  slangs: Slang[];
}
