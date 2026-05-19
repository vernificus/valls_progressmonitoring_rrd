import { useState, useRef } from "react";
import html2pdf from "html2pdf.js";
import { PdfTemplate } from "./PdfTemplate";
import { HistoryView } from "./HistoryView";
import { History } from "lucide-react";
import { assessments, Assessment } from "./data";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectSeparator, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CheckCircle2, XCircle, RefreshCcw, ArrowRight, Save, Loader2, Download } from "lucide-react";

type AppState = "setup" | "assessment" | "results" | "history";

export default function App() {
  const [appState, setAppState] = useState<AppState>("setup");
  const [studentName, setStudentName] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [selectedGrade, setSelectedGrade] = useState<string>("");
  const [selectedAssessmentId, setSelectedAssessmentId] = useState<string>("");

  const [incorrectWords, setIncorrectWords] = useState<Set<number>>(new Set());
  const [isSaving, setIsSaving] = useState(false);
  const pdfRef = useRef<HTMLDivElement>(null);
  const [isExporting, setIsExporting] = useState(false);

  const filteredAssessments = assessments.filter((a) => a.grade === selectedGrade);
  const currentAssessment = assessments.find((a) => a.id === selectedAssessmentId);

  const typeOrder = ["encoding", "decoding", "letter-sounds", "phoneme-segmenting", "fluency"];

  const assessmentsByType = filteredAssessments.reduce((acc, assessment) => {
    const type = assessment.type || "encoding";
    if (!acc[type]) {
      acc[type] = [];
    }
    acc[type].push(assessment);
    return acc;
  }, {} as Record<string, Assessment[]>);

  const sortedTypes = Object.keys(assessmentsByType).sort((a, b) => {
    return typeOrder.indexOf(a) - typeOrder.indexOf(b);
  });

  const typeLabels: Record<string, string> = {
    "encoding": "Encoding",
    "decoding": "Decoding",
    "letter-sounds": "Letter Sounds",
    "phoneme-segmenting": "Phoneme Segmenting",
    "fluency": "Fluency"
  };

  const handleStart = () => {
    if (!studentName || !date || !selectedAssessmentId) return;
    setIncorrectWords(new Set());
    setAppState("assessment");
  };

  const toggleWordStatus = (index: number) => {
    const newIncorrect = new Set(incorrectWords);
    if (newIncorrect.has(index)) {
      newIncorrect.delete(index);
    } else {
      newIncorrect.add(index);
    }
    setIncorrectWords(newIncorrect);
  };

  const handleFinish = async () => {
    if (!currentAssessment) return;

    setIsSaving(true);

    const score = currentAssessment.words.length - incorrectWords.size;
    const total = currentAssessment.words.length;

    const incorrectWordsList = Array.from(incorrectWords).map(
      (index) => currentAssessment.words[index as number].word || ''
    ).filter(Boolean);

    try {
      const WEB_APP_URL = "https://script.google.com/macros/s/AKfycbwE8D6PPraiflBWaOIjw701HqQAryZzVpIvke2WwdhqbpIZYifM5xeSqRqHteP1s8YHzA/exec";

      await fetch(WEB_APP_URL, {
        method: 'POST',
        mode: 'no-cors',
        headers: {
          'Content-Type': 'text/plain;charset=utf-8',
        },
        body: JSON.stringify({
          date: date,
          studentName: studentName,
          grade: selectedGrade,
          assessment: currentAssessment.name,
          score: score,
          total: total,
          incorrectWords: incorrectWordsList
        })
      });
    } catch (error) {
      console.error("Error saving data to Google Sheets:", error);
    } finally {
      setIsSaving(false);
      setAppState("results");
    }
  };


  const handleExportPDF = async () => {
    if (!pdfRef.current) return;
    setIsExporting(true);

    const opt = {
      margin: 10,
      filename: `${studentName}_${currentAssessment?.name}_${date}.pdf`,
      image: { type: 'jpeg' as const, quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' as const }
    };

    try {
      await html2pdf().set(opt).from(pdfRef.current).save();
    } catch (error) {
      console.error("Failed to generate PDF", error);
    } finally {
      setIsExporting(false);
    }
  };

  const handleReset = () => {
    setStudentName("");
    setSelectedGrade("");
    setSelectedAssessmentId("");
    setIncorrectWords(new Set());
    setAppState("setup");
  };

  const getInstructions = () => {
    switch (currentAssessment?.type) {
      case "fluency":
        return "Have the student read the passage aloud. Tap a word if the student reads it incorrectly.";
      case "letter-sounds":
        return "Have the student say the sound for each letter. Tap a letter if the student says the incorrect sound.";
      case "phoneme-segmenting":
        return "Say the word, and have the student segment it into sounds. Tap the word if they segment it incorrectly.";
      case "decoding":
        return "Have the student read the word. Tap a word if the student reads it incorrectly.";
      case "encoding":
      default:
        return "Read the word, then the sentence, then the word again. Tap a word if the student spells it incorrectly.";
    }
  };

  const renderAssessmentContent = () => {
    if (!currentAssessment) return null;

    if (currentAssessment.type === "fluency") {
      return (
        <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
          <div className="text-xl leading-loose space-x-1.5">
            {currentAssessment.words.map((item, index) => {
              const isIncorrect = incorrectWords.has(index);
              return (
                <span
                  key={index}
                  onClick={() => toggleWordStatus(index)}
                  className={`cursor-pointer inline-block px-1 rounded transition-colors ${
                    isIncorrect ? "bg-red-200 text-red-800 line-through" : "hover:bg-slate-100"
                  }`}
                >
                  {item.word}
                </span>
              );
            })}
          </div>
        </div>
      );
    }

    if (currentAssessment.type === "letter-sounds") {
      return (
        <div className="grid grid-cols-4 sm:grid-cols-6 gap-4">
          {currentAssessment.words.map((item, index) => {
            const isIncorrect = incorrectWords.has(index);
            return (
              <div
                key={index}
                onClick={() => toggleWordStatus(index)}
                className={`cursor-pointer flex items-center justify-center h-20 text-4xl font-bold rounded-lg border-2 transition-colors ${
                  isIncorrect
                    ? "border-red-300 bg-red-50 text-red-700"
                    : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
                }`}
              >
                {item.word}
              </div>
            );
          })}
        </div>
      );
    }

    // Default list view for encoding, decoding, phoneme-segmenting
    return (
      <div className="space-y-4">
        {currentAssessment.words.map((item, index) => {
          const isIncorrect = incorrectWords.has(index);
          return (
            <Card
              key={index}
              className={`transition-colors duration-200 cursor-pointer border-2 ${
                isIncorrect
                  ? "border-red-200 bg-red-50"
                  : "border-green-200 bg-green-50 hover:bg-green-100"
              }`}
              onClick={() => toggleWordStatus(index)}
            >
              <CardContent className="p-4 flex items-center gap-4">
                <div className="flex-shrink-0">
                  {isIncorrect ? (
                    <XCircle className="h-8 w-8 text-red-500" />
                  ) : (
                    <CheckCircle2 className="h-8 w-8 text-green-500" />
                  )}
                </div>
                <div className="flex-grow">
                  <div className="flex items-baseline gap-3 mb-1">
                    <span className="text-sm font-medium text-slate-400 w-6">{index + 1}.</span>
                    <h3 className={`text-2xl font-bold ${isIncorrect ? "text-red-700" : "text-green-800"}`}>
                      {item.word}
                    </h3>
                  </div>
                  {item.sentence && (
                    <p className={`text-base pl-9 ${isIncorrect ? "text-red-600/80" : "text-green-700/80"}`}>
                      {item.sentence}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8 font-sans text-slate-900">
      <div className="max-w-3xl mx-auto space-y-6">
        <header className="text-center mb-8">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">VALLS Progress Monitoring</h1>
          <p className="text-slate-500 mt-2">Assessment Tool</p>
        </header>

        {appState === "history" && (
          <HistoryView onBack={() => setAppState("setup")} />
        )}

        {appState === "setup" && (
          <Card className="shadow-sm border-slate-200">
            <CardHeader>
              <CardTitle>New Assessment</CardTitle>
              <CardDescription>Enter student details and select an assessment to begin.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="studentName">Student Name</Label>
                <Input
                  id="studentName"
                  placeholder="e.g., Jane Doe"
                  value={studentName}
                  onChange={(e) => setStudentName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="date">Date</Label>
                <Input
                  id="date"
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="grade">Grade Level</Label>
                <Select value={selectedGrade} onValueChange={(val) => {
                  setSelectedGrade(val);
                  setSelectedAssessmentId("");
                }}>
                  <SelectTrigger id="grade">
                    <SelectValue placeholder="Select a grade" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Kindergarten">Kindergarten</SelectItem>
                    <SelectItem value="Grade 1">Grade 1</SelectItem>
                    <SelectItem value="Grade 2">Grade 2</SelectItem>
                    <SelectItem value="Grade 3">Grade 3</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {selectedGrade && (
                <div className="space-y-2">
                  <Label htmlFor="assessment">Assessment</Label>
                  <Select value={selectedAssessmentId} onValueChange={setSelectedAssessmentId}>
                    <SelectTrigger id="assessment">
                      <SelectValue placeholder="Select an assessment" />
                    </SelectTrigger>
                    <SelectContent>
                      {sortedTypes.map((type, index) => (
                        <SelectGroup key={type}>
                          <SelectLabel>{typeLabels[type] || type}</SelectLabel>
                          {assessmentsByType[type].map((assessment) => (
                            <SelectItem key={assessment.id} value={assessment.id}>
                              {assessment.name}
                            </SelectItem>
                          ))}
                          {index < sortedTypes.length - 1 && <SelectSeparator />}
                        </SelectGroup>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </CardContent>
                        <CardFooter className="flex flex-col gap-3">
              <Button
                className="w-full"
                size="lg"
                onClick={handleStart}
                disabled={!studentName || !date || !selectedAssessmentId}
              >
                Start Assessment <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => setAppState("history")}
              >
                <History className="mr-2 h-4 w-4" /> View History
              </Button>
            </CardFooter>
          </Card>
        )}

        {appState === "assessment" && currentAssessment && (
          <div className="space-y-6">
            <Card className="shadow-sm border-slate-200 bg-white sticky top-4 z-10">
              <CardContent className="p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <h2 className="font-semibold text-lg">{studentName}</h2>
                  <p className="text-sm text-slate-500">{currentAssessment.name} • {date}</p>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-primary">
                    {currentAssessment.words.length - incorrectWords.size} / {currentAssessment.words.length}
                  </div>
                  <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Correct</p>
                </div>
              </CardContent>
            </Card>

            <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 text-sm text-blue-800 mb-6">
              <p><strong>Instructions:</strong> {getInstructions()}</p>
            </div>

            {renderAssessmentContent()}

            <div className="pt-6 pb-12 flex justify-end">
              <Button size="lg" onClick={handleFinish} className="px-8" disabled={isSaving}>
                {isSaving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" /> Finish Assessment
                  </>
                )}
              </Button>
            </div>
          </div>
        )}


        {appState === "results" && currentAssessment && (
          <>
            <div style={{ display: 'none' }}>
              <PdfTemplate
                ref={pdfRef}
                studentName={studentName}
                date={date}
                grade={selectedGrade}
                assessmentName={currentAssessment.name}
                score={currentAssessment.words.length - incorrectWords.size}
                total={currentAssessment.words.length}
                incorrectWordsList={Array.from(incorrectWords).map(index => currentAssessment.words[index as number].word).filter(Boolean)}
              />
            </div>
            <Card className="shadow-sm border-slate-200">

            <CardHeader className="text-center pb-2">
              <CardTitle className="text-2xl">Assessment Complete</CardTitle>
              <CardDescription>Results for {studentName}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-8 pt-6">
              <div className="flex justify-center">
                <div className="text-center p-6 bg-slate-50 rounded-2xl border border-slate-100 min-w-[200px]">
                  <div className="text-5xl font-black text-slate-900 mb-2">
                    {currentAssessment.words.length - incorrectWords.size} <span className="text-3xl text-slate-400 font-medium">/ {currentAssessment.words.length}</span>
                  </div>
                  <div className="text-sm font-semibold text-slate-500 uppercase tracking-wider">
                    Words Correct
                  </div>
                  <div className="mt-4 text-lg font-medium text-slate-700">
                    {Math.round(((currentAssessment.words.length - incorrectWords.size) / currentAssessment.words.length) * 100)}% Accuracy
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-semibold text-lg mb-4 border-b pb-2">Assessment Details</h3>
                <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2 text-sm">
                  <div className="flex justify-between sm:block">
                    <dt className="text-slate-500">Date</dt>
                    <dd className="font-medium">{date}</dd>
                  </div>
                  <div className="flex justify-between sm:block">
                    <dt className="text-slate-500">Grade</dt>
                    <dd className="font-medium">{selectedGrade}</dd>
                  </div>
                  <div className="flex justify-between sm:block sm:col-span-2">
                    <dt className="text-slate-500">Assessment</dt>
                    <dd className="font-medium">{currentAssessment.name}</dd>
                  </div>
                </dl>
              </div>

              {incorrectWords.size > 0 && (
                <div>
                  <h3 className="font-semibold text-lg mb-4 border-b pb-2 text-red-600 flex items-center gap-2">
                    <XCircle className="h-5 w-5" /> Words to Review
                  </h3>
                  <ul className="space-y-2">
                    {Array.from<number>(incorrectWords).sort((a, b) => a - b).map((index) => (
                      <li key={index} className="flex items-baseline gap-3 bg-red-50 p-3 rounded-md border border-red-100">
                        <span className="text-red-400 font-mono text-sm w-6">{index + 1}.</span>
                        <span className="font-bold text-red-700 text-lg">{currentAssessment.words[index].word}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </CardContent>

            <CardFooter className="flex justify-center gap-4 border-t pt-6 bg-slate-50 rounded-b-xl">
              <Button variant="outline" onClick={handleReset}>
                <RefreshCcw className="mr-2 h-4 w-4" /> Start New Assessment
              </Button>
              <Button onClick={handleExportPDF} disabled={isExporting}>
                {isExporting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
                Export to PDF
              </Button>
            </CardFooter>

          </Card>
          </>
        )}
      </div>
    </div>
  );
}
