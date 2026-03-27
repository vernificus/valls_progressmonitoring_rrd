import { kindergartenAssessments } from './data-k';
import { grade1Assessments } from './data-1';
import { grade2Assessments } from './data-2';
import { grade3Assessments } from './data-3';
import { decodingKAssessments } from './data-decoding-k';
import { decoding1Assessments } from './data-decoding-1';
import { decoding2Assessments } from './data-decoding-2';
import { decoding3Assessments } from './data-decoding-3';
import { fluency1Assessments } from './data-fluency-1';
import { fluency2Assessments } from './data-fluency-2';
import { fluency3Assessments } from './data-fluency-3';
import { letterSoundsAssessments } from './data-letter-sounds';
import { phonemeSegmentingAssessments } from './data-phoneme-segmenting';

export interface AssessmentWord {
  word: string;
  sentence?: string;
  category?: string;
}

export interface Assessment {
  id: string;
  name: string;
  grade: string;
  type?: "encoding" | "decoding" | "fluency" | "letter-sounds" | "phoneme-segmenting";
  words: AssessmentWord[];
  text?: string;
}

export const assessments: Assessment[] = [
  ...kindergartenAssessments,
  ...grade1Assessments,
  ...grade2Assessments,
  ...grade3Assessments,
  ...decodingKAssessments,
  ...decoding1Assessments,
  ...decoding2Assessments,
  ...decoding3Assessments,
  ...fluency1Assessments,
  ...fluency2Assessments,
  ...fluency3Assessments,
  ...letterSoundsAssessments,
  ...phonemeSegmentingAssessments,
];
