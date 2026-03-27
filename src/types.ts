export interface AssessmentWord {
  word: string;
  sentence: string;
}

export interface Assessment {
  id: string;
  name: string;
  grade: string;
  words: AssessmentWord[];
}
