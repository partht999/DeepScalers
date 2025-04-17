import { useState } from 'react'
import { FiStar, FiCheckCircle, FiClock } from 'react-icons/fi'

// Types
type QuestionStatus = 'answered' | 'pending' | 'approved'

interface Question {
  id: string
  question: string
  answer?: string
  status: QuestionStatus
  date: Date
  subject: string
  isImportant: boolean
}

// Dummy data for questions
const initialQuestions: Question[] = [
  {
    id: '1',
    question: 'How do I solve quadratic equations using the quadratic formula?',
    answer: 'The quadratic formula is x = (-b ± √(b² - 4ac)) / 2a where ax² + bx + c = 0.',
    status: 'approved',
    date: new Date(2023, 7, 15),
    subject: 'Mathematics',
    isImportant: true,
  },
  {
    id: '2',
    question: 'What are Newton\'s three laws of motion?',
    answer: 'Newton\'s First Law: An object at rest stays at rest, and an object in motion stays in motion unless acted upon by an external force. Newton\'s Second Law: Force equals mass times acceleration (F = ma). Newton\'s Third Law: For every action, there is an equal and opposite reaction.',
    status: 'answered',
    date: new Date(2023, 7, 18),
    subject: 'Physics',
    isImportant: false,
  },
  {
    id: '3',
    question: 'Explain the process of cellular respiration.',
    status: 'pending',
    date: new Date(2023, 7, 20),
    subject: 'Biology',
    isImportant: false,
  },
  {
    id: '4',
    question: 'What is the difference between HTTP and HTTPS?',
    answer: 'HTTP is unsecured while HTTPS is secured using SSL/TLS. HTTPS encrypts the data transmitted between the client and server.',
    status: 'answered',
    date: new Date(2023, 7, 22),
    subject: 'Computer Science',
    isImportant: true,
  },
]

const MyQuestions = () => {
  const [questions, setQuestions] = useState<Question[]>(initialQuestions)
  const [filter, setFilter] = useState<QuestionStatus | 'all'>('all')
  
  // Toggle important status
  const toggleImportant = (id: string) => {
    setQuestions(questions.map(q => 
      q.id === id ? { ...q, isImportant: !q.isImportant } : q
    ))
  }
  
  // Filter questions based on status
  const filteredQuestions = filter === 'all' 
    ? questions 
    : questions.filter(q => q.status === filter)
  
  // Status badge component
  const StatusBadge = ({ status }: { status: QuestionStatus }) => {
    switch(status) {
      case 'approved':
        return (
          <span className="flex items-center text-green-600 bg-green-100 px-2 py-1 rounded-full text-xs font-medium">
            <FiCheckCircle className="mr-1" /> 
            Approved by Faculty
          </span>
        )
      case 'answered':
        return (
          <span className="flex items-center text-blue-600 bg-blue-100 px-2 py-1 rounded-full text-xs font-medium">
            <FiCheckCircle className="mr-1" /> 
            Answered
          </span>
        )
      case 'pending':
        return (
          <span className="flex items-center text-yellow-600 bg-yellow-100 px-2 py-1 rounded-full text-xs font-medium">
            <FiClock className="mr-1" /> 
            Pending
          </span>
        )
      default:
        return null
    }
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">My Questions</h1>
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
            Pending
          </button>
          <button 
            onClick={() => setFilter('answered')}
            className={`px-3 py-1 rounded ${filter === 'answered' ? 'bg-primary-100 text-primary-600 dark:bg-primary-900 dark:text-primary-300' : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300'}`}
          >
            Answered
          </button>
          <button 
            onClick={() => setFilter('approved')}
            className={`px-3 py-1 rounded ${filter === 'approved' ? 'bg-primary-100 text-primary-600 dark:bg-primary-900 dark:text-primary-300' : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300'}`}
          >
            Approved
          </button>
        </div>
      </div>
      
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-900">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Question
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Subject
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Date
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Status
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Important
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {filteredQuestions.map((question) => (
              <tr key={question.id} className="hover:bg-gray-50 dark:hover:bg-gray-750">
                <td className="px-6 py-4">
                  <div className="text-sm font-medium text-gray-900 dark:text-white">
                    {question.question}
                  </div>
                  {question.answer && (
                    <div className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                      <strong>Answer:</strong> {question.answer}
                    </div>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                  {question.subject}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                  {question.date.toLocaleDateString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <StatusBadge status={question.status} />
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <button 
                    onClick={() => toggleImportant(question.id)}
                    className={`p-1 rounded-full ${
                      question.isImportant 
                        ? 'text-yellow-500 hover:text-yellow-600' 
                        : 'text-gray-400 hover:text-gray-500'
                    }`}
                  >
                    <FiStar className={question.isImportant ? 'fill-current' : ''} size={20} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default MyQuestions 