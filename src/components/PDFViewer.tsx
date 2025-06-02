import React, { useState } from 'react';
import axios from 'axios';
import { API_CONFIG } from '../config';

interface PDFViewerProps {
  onTextExtracted?: (text: string) => void;
}

const PDFViewer: React.FC<PDFViewerProps> = ({ onTextExtracted }) => {
  const [file, setFile] = useState<File | null>(null);
  const [extractedText, setExtractedText] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile && selectedFile.type === 'application/pdf') {
      setFile(selectedFile);
      setError(null);
    } else {
      setError('Please select a valid PDF file');
      setFile(null);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setError('Please select a PDF file first');
      return;
    }

    setLoading(true);
    setError(null);

    const formData = new FormData();
    formData.append('pdf_file', file);

    try {
      const response = await axios.post(
        `${API_CONFIG.BASE_URL}/student-assistance/pdf/extract-text/`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      setExtractedText(response.data.text);
      if (onTextExtracted) {
        onTextExtracted(response.data.text);
      }
    } catch (err) {
      setError('Error extracting text from PDF. Please try again.');
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 bg-white rounded-lg shadow">
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Upload PDF
        </label>
        <input
          type="file"
          accept=".pdf"
          onChange={handleFileChange}
          className="block w-full text-sm text-gray-500
            file:mr-4 file:py-2 file:px-4
            file:rounded-full file:border-0
            file:text-sm file:font-semibold
            file:bg-blue-50 file:text-blue-700
            hover:file:bg-blue-100"
        />
      </div>

      {error && (
        <div className="mb-4 p-2 bg-red-50 text-red-700 rounded">
          {error}
        </div>
      )}

      <button
        onClick={handleUpload}
        disabled={!file || loading}
        className={`px-4 py-2 rounded-md text-white font-medium
          ${!file || loading
            ? 'bg-gray-400 cursor-not-allowed'
            : 'bg-blue-600 hover:bg-blue-700'
          }`}
      >
        {loading ? 'Extracting...' : 'Extract Text'}
      </button>

      {extractedText && (
        <div className="mt-4">
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Extracted Text
          </h3>
          <div className="p-4 bg-gray-50 rounded-lg max-h-96 overflow-y-auto">
            <pre className="whitespace-pre-wrap text-sm text-gray-700">
              {extractedText}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
};

export default PDFViewer; 