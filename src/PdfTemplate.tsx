import React from 'react';

interface PdfTemplateProps {
  studentName: string;
  date: string;
  grade: string;
  assessmentName: string;
  score: number | string;
  total: number | string;
  incorrectWordsList: string[];
}

export const PdfTemplate = React.forwardRef<HTMLDivElement, PdfTemplateProps>(({
  studentName,
  date,
  grade,
  assessmentName,
  score,
  total,
  incorrectWordsList
}, ref) => {
  const percentage = Math.round((Number(score) / Number(total)) * 100) || 0;

  return (
    <div
      ref={ref}
      style={{
        padding: '40px',
        fontFamily: 'serif',
        color: '#000',
        backgroundColor: '#fff',
        width: '100%',
        maxWidth: '800px',
        margin: '0 auto',
        boxSizing: 'border-box'
      }}
    >
      <div style={{ borderBottom: '2px solid #000', paddingBottom: '20px', marginBottom: '30px' }}>
        <h1 style={{ textAlign: 'center', fontSize: '24px', margin: '0 0 20px 0' }}>VALLS Assessment Record</h1>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '16px' }}>
          <div>
            <p style={{ margin: '5px 0' }}><strong>Student:</strong> {studentName}</p>
            <p style={{ margin: '5px 0' }}><strong>Grade:</strong> {grade}</p>
          </div>
          <div>
            <p style={{ margin: '5px 0' }}><strong>Date:</strong> {date}</p>
            <p style={{ margin: '5px 0' }}><strong>Assessment:</strong> {assessmentName}</p>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '40px' }}>
        <div style={{ textAlign: 'center', border: '1px solid #ccc', padding: '20px', borderRadius: '8px', minWidth: '200px' }}>
          <div style={{ fontSize: '48px', fontWeight: 'bold' }}>
            {score} <span style={{ fontSize: '24px', color: '#666' }}>/ {total}</span>
          </div>
          <div style={{ fontSize: '14px', textTransform: 'uppercase', color: '#666', marginTop: '5px' }}>Score</div>
          <div style={{ fontSize: '20px', marginTop: '10px' }}>{percentage}% Accuracy</div>
        </div>
      </div>

      <div>
        <h2 style={{ fontSize: '18px', borderBottom: '1px solid #ccc', paddingBottom: '10px', marginBottom: '20px' }}>
          Review Items (Incorrect)
        </h2>
        {incorrectWordsList.length > 0 ? (
          <ul style={{ listStyleType: 'none', padding: 0 }}>
            {incorrectWordsList.map((word, i) => (
              <li key={i} style={{
                padding: '10px',
                borderBottom: '1px solid #eee',
                display: 'flex',
                alignItems: 'center'
              }}>
                <span style={{ width: '30px', color: '#666' }}>{i + 1}.</span>
                <span style={{ fontWeight: 'bold', color: '#d32f2f' }}>{word}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p style={{ fontStyle: 'italic', color: '#666' }}>No incorrect items. Perfect score!</p>
        )}
      </div>

      <div style={{ marginTop: '50px', paddingTop: '20px', borderTop: '1px solid #eee', fontSize: '12px', color: '#999', textAlign: 'center' }}>
        <p>This document is a record of student assessment and should be filed in the student's cumulative folder.</p>
      </div>
    </div>
  );
});

PdfTemplate.displayName = 'PdfTemplate';
