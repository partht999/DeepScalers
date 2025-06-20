import { FiUser, FiMessageSquare } from 'react-icons/fi'

interface ChatMessage {
  id: string
  type: 'user' | 'assistant'
  content: string
  timestamp: Date
  subject?: string
}

interface ChatHistoryProps {
  messages: ChatMessage[]
}

const ChatHistory = ({ messages }: ChatHistoryProps) => {
  // Group messages by date
  const groupedMessages = messages.reduce((groups, message) => {
    const date = message.timestamp.toLocaleDateString()
    if (!groups[date]) {
      groups[date] = []
    }
    groups[date].push(message)
    return groups
  }, {} as Record<string, ChatMessage[]>)

  return (
    <div className="space-y-8">
      {Object.entries(groupedMessages).map(([date, messages]) => (
        <div key={date} className="relative">
          <div className="sticky top-0 bg-white dark:bg-gray-900 py-2 z-10">
            <h2 className="text-lg font-semibold text-gray-700 dark:text-gray-300">{date}</h2>
          </div>
          <div className="ml-4 border-l-2 border-gray-200 dark:border-gray-700 pl-4 space-y-4">
            {messages.map((message) => (
              <div key={message.id} className="relative">
                <div className={`absolute -left-6 mt-2 w-4 h-4 rounded-full border-2 border-white dark:border-gray-900 ${
                  message.type === 'user' ? 'bg-blue-500' : 'bg-green-500'
                }`}></div>
                <div className={`rounded-lg shadow-sm p-4 ${
                  message.type === 'user' 
                    ? 'bg-blue-50 dark:bg-blue-900/20' 
                    : 'bg-white dark:bg-gray-800'
                }`}>
                  <div className="flex items-start space-x-3">
                    <div className={`p-2 rounded-full ${
                      message.type === 'user' 
                        ? 'bg-blue-100 dark:bg-blue-800' 
                        : 'bg-green-100 dark:bg-green-800'
                    }`}>
                      {message.type === 'user' ? (
                        <FiUser className="text-blue-600 dark:text-blue-300" size={16} />
                      ) : (
                        <FiMessageSquare className="text-green-600 dark:text-green-300" size={16} />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium text-gray-900 dark:text-white">
                          {message.type === 'user' ? 'You' : 'Assistant'}
                        </span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {message.timestamp.toLocaleTimeString()}
                        </span>
                      </div>
                      {message.subject && (
                        <span className="inline-block px-2 py-1 text-xs font-medium text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-full mb-2">
                          {message.subject}
                        </span>
                      )}
                      <div className="prose dark:prose-invert max-w-none">
                        {message.content.split('\n').map((line, i) => (
                          <p key={i} className="text-gray-700 dark:text-gray-300">
                            {line}
                          </p>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

export default ChatHistory
 