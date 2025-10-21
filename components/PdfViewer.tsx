import React, { useState, useImperativeHandle, forwardRef } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';

pdfjs.GlobalWorkerOptions.workerSrc = 'https://aistudiocdn.com/pdfjs-dist@5.4.296/build/pdf.worker.min.js';

interface PdfViewerProps {
  file: File | null;
}

export interface PdfViewerRef {
  goToPage: (page: number) => void;
}

const PdfViewer = forwardRef<PdfViewerRef, PdfViewerProps>(({ file }, ref) => {
  const [numPages, setNumPages] = useState<number | null>(null);
  const [pageNumber, setPageNumber] = useState(1);

  useImperativeHandle(ref, () => ({
    goToPage: (page: number) => {
      if (page > 0 && page <= (numPages || 0)) {
        setPageNumber(page);
      }
    },
  }));

  function onDocumentLoadSuccess({ numPages }: { numPages: number }): void {
    setNumPages(numPages);
    setPageNumber(1);
  }

  const goToPrevPage = () => setPageNumber(prev => Math.max(prev - 1, 1));
  const goToNextPage = () => setPageNumber(prev => Math.min(prev + 1, numPages || 1));

  if (!file) {
    return null;
  }

  return (
    <div className="flex flex-col h-full bg-gray-800">
      <div className="flex-grow overflow-auto flex justify-center items-start p-4">
        <Document file={file} onLoadSuccess={onDocumentLoadSuccess}>
          <Page pageNumber={pageNumber} />
        </Document>
      </div>
      <div className="flex-shrink-0 bg-gray-900/50 backdrop-blur-sm p-2 flex items-center justify-center space-x-4 text-white">
        <button onClick={goToPrevPage} disabled={pageNumber <= 1} className="px-3 py-1 bg-green-600 rounded disabled:bg-gray-500 disabled:cursor-not-allowed hover:bg-green-500 transition-colors">
          Anterior
        </button>
        <span>
          Página {pageNumber} de {numPages}
        </span>
        <button onClick={goToNextPage} disabled={pageNumber >= (numPages || 0)} className="px-3 py-1 bg-green-600 rounded disabled:bg-gray-500 disabled:cursor-not-allowed hover:bg-green-500 transition-colors">
          Próxima
        </button>
      </div>
    </div>
  );
});

export default React.memo(PdfViewer);