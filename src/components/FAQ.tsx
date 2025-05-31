import React, { useState } from 'react';
import axios from 'axios';

const FAQ: React.FC = () => {
    const [question, setQuestion] = useState('');
    const [answer, setAnswer] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setAnswer('');

        try {
            console.log('Sending question:', question);
            const response = await axios.post('http://localhost:8000/api/faq/ask/', {
                question: question
            }, {
                headers: {
                    'Content-Type': 'application/json',
                }
            });

            console.log('Response received:', response.data);

            if (response.data.answer) {
                setAnswer(response.data.answer);
            } else if (response.data.message) {
                setAnswer(response.data.message);
            } else {
                setError('Unexpected response format from server');
            }
        } catch (err: any) {
            console.error('Error details:', err);
            if (err.response) {
                // The request was made and the server responded with a status code
                // that falls out of the range of 2xx
                console.error('Error response data:', err.response.data);
                console.error('Error response status:', err.response.status);
                setError(`Server error: ${err.response.data.error || err.response.statusText}`);
            } else if (err.request) {
                // The request was made but no response was received
                console.error('No response received:', err.request);
                setError('No response received from server. Please check if the server is running.');
            } else {
                // Something happened in setting up the request that triggered an Error
                console.error('Error setting up request:', err.message);
                setError(`Error: ${err.message}`);
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto p-6">
            <h2 className="text-2xl font-bold mb-6 text-gray-800">Ask a Question</h2>
            
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label htmlFor="question" className="block text-sm font-medium text-gray-700 mb-2">
                        Your Question
                    </label>
                    <textarea
                        id="question"
                        value={question}
                        onChange={(e) => setQuestion(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                        rows={4}
                        placeholder="Type your question here..."
                        required
                    />
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white 
                        ${loading 
                            ? 'bg-indigo-400 cursor-not-allowed' 
                            : 'bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500'
                        }`}
                >
                    {loading ? 'Getting Answer...' : 'Ask Question'}
                </button>
            </form>

            {error && (
                <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-md">
                    <p className="text-sm text-red-600">{error}</p>
                </div>
            )}

            {answer && (
                <div className="mt-6 p-4 bg-gray-50 border border-gray-200 rounded-md">
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Answer:</h3>
                    <p className="text-gray-700">{answer}</p>
                </div>
            )}
        </div>
    );
};

export default FAQ; 