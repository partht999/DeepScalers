import React, { useState } from 'react';
import axios from 'axios';
import { API_CONFIG } from '../config';

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
            const response = await axios.post(`${API_CONFIG.BASE_URL}/faq/ask/`, {
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
        } catch (error) {
            console.error('Error:', error);
            if (axios.isAxiosError(error)) {
                setError(error.response?.data?.error || 'An error occurred while fetching the answer');
            } else {
                setError('An unexpected error occurred');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto p-4">
            <h2 className="text-2xl font-bold mb-4">Ask a Question</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <input
                        type="text"
                        value={question}
                        onChange={(e) => setQuestion(e.target.value)}
                        placeholder="Type your question here..."
                        className="w-full p-2 border rounded"
                        disabled={loading}
                    />
                </div>
                <button
                    type="submit"
                    disabled={loading}
                    className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:bg-gray-400"
                >
                    {loading ? 'Loading...' : 'Ask'}
                </button>
            </form>
            
            {error && (
                <div className="mt-4 p-4 bg-red-100 text-red-700 rounded">
                    {error}
                </div>
            )}
            
            {answer && (
                <div className="mt-4 p-4 bg-gray-100 rounded">
                    <h3 className="font-bold mb-2">Answer:</h3>
                    <p>{answer}</p>
                </div>
            )}
        </div>
    );
};

export default FAQ; 