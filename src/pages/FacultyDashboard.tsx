import { useState } from 'react'
import { FiCheck, FiX, FiEdit } from 'react-icons/fi'

// Types
type QuestionStatus = 'pending' | 'approved' | 'rejected'

interface StudentQuestion {
  id: string
  studentId: string
  studentName: string
  question: string
  aiAnswer: string
  facultyAnswer?: string
  status: QuestionStatus
  date: Date
  subject: string
}

// Mock data
const initialQuestions: StudentQuestion[] = [
  {
    id: '1',
    studentId: 'STU001',
    studentName: 'Alex Johnson',
    question: 'Can you explain the process of photosynthesis in detail?',
    aiAnswer: 'Photosynthesis is the process by which green plants and some other organisms use sunlight to synthesize foods with the help of chlorophyll pigments. It involves converting light energy into chemical energy and storing it in the chemical bonds of sugar.',
    status: 'pending',
    date: new Date(2023, 7, 20),
    subject: 'Biology',
  },
  {
    id: '2',
    studentId: 'STU002',
    studentName: 'Sam Wilson',
    question: 'How do I calculate the derivative of a function?',
    aiAnswer: 'To calculate the derivative of a function, you use the limit definition: f\'(x) = lim(h→0) [f(x+h) - f(x)]/h. There are also various rules like the power rule, product rule, quotient rule, and chain rule that make differentiation easier.',
    facultyAnswer: 'The derivative represents the rate of change of a function. For a function f(x), the derivative f\'(x) can be found using various rules depending on the function type. For polynomials, use the power rule: d/dx(x^n) = n*x^(n-1).',
    status: 'approved',
    date: new Date(2023, 7, 18),
    subject: 'Mathematics',
  },
  {
    id: '3',
    studentId: 'STU003',
    studentName: 'Emily Davis',
    question: 'What is the difference between RAM and ROM?',
    aiAnswer: 'RAM (Random Access Memory) is volatile and temporary, storing data that is actively being used. ROM (Read-Only Memory) is non-volatile and permanent, containing instructions for the computer that do not change.',
    status: 'pending',
    date: new Date(2023, 7, 22),
    subject: 'Computer Science',
  },
  {
    id: '4',
    studentId: 'STU004',
    studentName: 'Rachel Green',
    question: 'Can you explain Newton\'s laws of motion?',
    aiAnswer: 'Newton\'s First Law: An object at rest stays at rest, and an object in motion stays in motion unless acted upon by an external force. Newton\'s Second Law: Force equals mass times acceleration (F = ma). Newton\'s Third Law: For every action, there is an equal and opposite reaction.',
    facultyAnswer: 'Newton\'s laws form the foundation of classical mechanics. The first law describes inertia, the second quantifies the relationship between force, mass, and acceleration, and the third law describes the reciprocal nature of forces.',
    status: 'rejected',
    date: new Date(2023, 7, 15),
    subject: 'Physics',
  },
]

const FacultyDashboard = () => {
  const [questions, setQuestions] = useState<StudentQuestion[]>(initialQuestions)
  const [filter, setFilter] = useState<QuestionStatus | 'all'>('all')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editAnswer, setEditAnswer] = useState('')
  
  // Filter questions based on status
  const filteredQuestions = filter === 'all' 
    ? questions 
    : questions.filter(q => q.status === filter)
  
  // Start editing an answer
  const handleEdit = (question: StudentQuestion) => {
    setEditingId(question.id)
    setEditAnswer(question.facultyAnswer || question.aiAnswer)
  }
  
  // Save faculty answer
  const handleSave = (id: string) => {
    setQuestions(questions.map(q => 
      q.id === id ? { ...q, facultyAnswer: editAnswer, status: 'approved' } : q
    ))
    setEditingId(null)
  }
  
  // Approve AI answer
  const handleApprove = (id: string) => {
    setQuestions(questions.map(q => 
      q.id === id ? { ...q, status: 'approved' } : q
    ))
  }
  
  // Reject answer
  const handleReject = (id: string) => {
    setQuestions(questions.map(q => 
      q.id === id ? { ...q, status: 'rejected' } : q
    ))
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Faculty Dashboard</h1>
        <div className="flex space-x-2">
          <button 
            onClick={() => setFilter('all')}
            className={`px-3 py-1 rounded ${filter === 'all' ? 'bg-primary-100 text-primary-600 dark:bg-primary-900 dark:text-primary-300' : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300'}`}
          >
            All
          </button>
          <button 
            onClick={() => setFilter('pending')}
            className={`px-3 py-1 rounded ${filter === 'pending' ? 'bg-primary-100 text-primary-600 dark:bg-primary-900 dark:text-primary-300' : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300'}`}
          >
            Pending Review
          </button>
          <button 
            onClick={() => setFilter('approved')}
            className={`px-3 py-1 rounded ${filter === 'approved' ? 'bg-primary-100 text-primary-600 dark:bg-primary-900 dark:text-primary-300' : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300'}`}
          >
            Approved
          </button>
          <button 
            onClick={() => setFilter('rejected')}
            className={`px-3 py-1 rounded ${filter === 'rejected' ? 'bg-primary-100 text-primary-600 dark:bg-primary-900 dark:text-primary-300' : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300'}`}
          >
            Rejected
          </button>
        </div>
      </div>
      
      <div className="space-y-4">
        {filteredQuestions.map((question) => (
          <div key={question.id} className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex justify-between mb-2">
              <div>
                <span className="font-medium">{question.studentName}</span>
                <span className="text-sm text-gray-500 dark:text-gray-400 ml-2">({question.studentId})</span>
              </div>
              <div className="flex items-center">
                <span className="text-sm text-gray-500 dark:text-gray-400 mr-2">{question.date.toLocaleDateString()}</span>
                <span className="text-sm px-2 py-1 rounded bg-gray-100 dark:bg-gray-700">{question.subject}</span>
              </div>
            </div>
            
            <div className="mb-4">
              <h3 className="font-medium">Question:</h3>
              <p className="text-gray-700 dark:text-gray-300">{question.question}</p>
            </div>
            
            <div className="mb-4">
              <h3 className="font-medium">AI Answer:</h3>
              <p className="text-gray-700 dark:text-gray-300">{question.aiAnswer}</p>
            </div>
            
            {question.status === 'approved' && question.facultyAnswer && (
              <div className="mb-4">
                <h3 className="font-medium">Faculty Answer:</h3>
                <p className="text-gray-700 dark:text-gray-300">{question.facultyAnswer}</p>
              </div>
            )}
            
            {editingId === question.id ? (
              <div className="mb-4">
                <h3 className="font-medium mb-2">Your Answer:</h3>
                <textarea
                  value={editAnswer}
                  onChange={(e) => setEditAnswer(e.target.value)}
                  className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"
                  rows={3}
                />
                <div className="mt-2 flex justify-end space-x-2">
                  <button 
                    onClick={() => setEditingId(null)}
                    className="px-3 py-1 border rounded hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={() => handleSave(question.id)}
                    className="px-3 py-1 bg-primary-500 text-white rounded hover:bg-primary-600"
                  >
                    Save Answer
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex justify-end space-x-2">
                {question.status === 'pending' && (
                  <>
                    <button 
                      onClick={() => handleApprove(question.id)}
                      className="flex items-center px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600"
                    >
                      <FiCheck className="mr-1" /> Approve
                    </button>
                    <button 
                      onClick={() => handleReject(question.id)}
                      className="flex items-center px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600"
                    >
                      <FiX className="mr-1" /> Reject
                    </button>
                    <button 
                      onClick={() => handleEdit(question)}
                      className="flex items-center px-3 py-1 bg-primary-500 text-white rounded hover:bg-primary-600"
                    >
                      <FiEdit className="mr-1" /> Edit Answer
                    </button>
                  </>
                )}
                {(question.status === 'approved' || question.status === 'rejected') && (
                  <button 
                    onClick={() => handleEdit(question)}
                    className="flex items-center px-3 py-1 bg-primary-500 text-white rounded hover:bg-primary-600"
                  >
                    <FiEdit className="mr-1" /> Edit Answer
                  </button>
                )}
              </div>
            )}
            
            {/* Status indicator */}
            <div className="mt-4 pt-3 border-t dark:border-gray-700">
              <div className="flex justify-between items-center">
                <span className="text-sm">
                  Status: 
                  <span className={`ml-1 font-medium ${
                    question.status === 'approved' ? 'text-green-500' : 
                    question.status === 'rejected' ? 'text-red-500' : 
                    'text-yellow-500'
                  }`}>
                    {question.status.charAt(0).toUpperCase() + question.status.slice(1)}
                  </span>
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default FacultyDashboard 