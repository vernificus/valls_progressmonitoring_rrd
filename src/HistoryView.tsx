import React, { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, ArrowLeft, Download, Search } from "lucide-react";
import html2pdf from "html2pdf.js";
import { PdfTemplate } from "./PdfTemplate";

interface HistoryRecord {
  date: string;
  studentName: string;
  grade: string;
  assessment: string;
  score: number | string;
  total: number | string;
  incorrectWords: string;
}

interface HistoryViewProps {
  onBack: () => void;
}

const WEB_APP_URL = "https://script.google.com/macros/s/AKfycbwE8D6PPraiflBWaOIjw701HqQAryZzVpIvke2WwdhqbpIZYifM5xeSqRqHteP1s8YHzA/exec";

export function HistoryView({ onBack }: HistoryViewProps) {
  const [records, setRecords] = useState<HistoryRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  const [exportingRowIndex, setExportingRowIndex] = useState<number | null>(null);
  const pdfRef = useRef<HTMLDivElement>(null);
  const [selectedRecord, setSelectedRecord] = useState<HistoryRecord | null>(null);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      // Google Apps script redirect handling
      const response = await fetch(WEB_APP_URL + "?action=get", {
        method: "GET",
        redirect: "follow",
        headers: {
          "Accept": "application/json"
        }
      });
      if (!response.ok) throw new Error("Failed to fetch history");

      const data = await response.json();

      // Filter out header row if present
      const filteredData = data.filter((row: any) => row.studentName !== "studentName" && row.date !== "date");
      // Sort by date descending
      filteredData.sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());

      setRecords(filteredData);
    } catch (err: any) {
      console.error(err);
      setError("Failed to load history data.");
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async (record: HistoryRecord, index: number) => {
    setSelectedRecord(record);
    setExportingRowIndex(index);

    // Need a tiny timeout to allow the hidden PDF template to render with the new selectedRecord
    setTimeout(async () => {
      if (!pdfRef.current) {
        setExportingRowIndex(null);
        return;
      }

      const opt = {
        margin: 10,
        filename: `${record.studentName}_${record.assessment}_${record.date.substring(0,10)}.pdf`,
        image: { type: 'jpeg' as const, quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' as const }
      };

      try {
        await html2pdf().set(opt).from(pdfRef.current).save();
      } catch (error) {
        console.error("Failed to generate PDF", error);
      } finally {
        setExportingRowIndex(null);
      }
    }, 100);
  };

  const filteredRecords = records.filter(record =>
    record.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    record.assessment.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900">Assessment History</h2>
      </div>

      <Card className="shadow-sm border-slate-200">
        <CardHeader>
          <CardTitle>Past Assessments</CardTitle>
          <CardDescription>View and export past assessment results.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4 relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search by student name or assessment..."
              className="pl-9"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {loading ? (
            <div className="flex justify-center p-8">
              <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
            </div>
          ) : error ? (
            <div className="text-red-500 p-4 text-center">{error}</div>
          ) : filteredRecords.length === 0 ? (
            <div className="text-center p-8 text-slate-500">No records found.</div>
          ) : (
            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Student</TableHead>
                    <TableHead>Grade</TableHead>
                    <TableHead>Assessment</TableHead>
                    <TableHead>Score</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRecords.map((record, index) => {
                    const dateStr = typeof record.date === 'string' ? record.date.substring(0, 10) : new Date(record.date).toISOString().substring(0,10);
                    return (
                      <TableRow key={index}>
                        <TableCell>{dateStr}</TableCell>
                        <TableCell className="font-medium">{record.studentName}</TableCell>
                        <TableCell>{record.grade}</TableCell>
                        <TableCell>{record.assessment}</TableCell>
                        <TableCell>{record.score} / {record.total}</TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleExport(record, index)}
                            disabled={exportingRowIndex !== null}
                          >
                            {exportingRowIndex === index ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Download className="h-4 w-4 mr-1" />
                            )}
                            PDF
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Hidden PDF Template for Export */}
      {selectedRecord && (
        <div style={{ display: 'none' }}>
          <PdfTemplate
            ref={pdfRef}
            studentName={selectedRecord.studentName}
            date={typeof selectedRecord.date === 'string' ? selectedRecord.date.substring(0, 10) : new Date(selectedRecord.date).toISOString().substring(0,10)}
            grade={selectedRecord.grade}
            assessmentName={selectedRecord.assessment}
            score={selectedRecord.score}
            total={selectedRecord.total}
            incorrectWordsList={selectedRecord.incorrectWords ? selectedRecord.incorrectWords.split(',').map(w => w.trim()).filter(Boolean) : []}
          />
        </div>
      )}
    </div>
  );
}
