# AI Student Assistant Platform

A responsive front-end for an AI-powered student assistant platform built with React and TailwindCSS.

## Features

- 📝 Chat Interface: Ask questions and receive AI-powered responses
- 👨‍🏫 Faculty Verified Answers: Access information validated by faculty members
- 📅 Deadline Management: Keep track of assignments and exams
- 📱 Responsive Design: Works on desktop, tablet, and mobile devices
- 🌙 Dark Mode: Toggle between light and dark themes

## Pages

1. **Home**: Introduction to the platform with feature cards
2. **Chat**: Main interface for asking questions and receiving AI responses
3. **My Questions**: Dashboard showing all previously asked questions
4. **Faculty Answers**: Collection of faculty-verified responses
5. **Deadlines**: Manage upcoming assignments and exams
6. **Faculty Dashboard**: For faculty to review and verify AI responses
7. **Settings**: Profile and notification preferences

## Tech Stack

- React (with TypeScript)
- TailwindCSS for styling
- React Router for navigation
- React Icons for UI elements

## Getting Started

### Prerequisites

- Node.js and npm installed

### Installation

1. Clone the repository:
```
git clone <repository-url>
```

2. Install dependencies:
```
cd student-assistant
npm install
```

3. Start the development server:
```
npm run dev
```

4. Open your browser and navigate to `http://localhost:5173`

## Project Structure

- `/src`
  - `/components`: Reusable UI components
  - `/pages`: Main page components
  - `/context`: React context providers (if applicable)
  - `App.tsx`: Main application component
  - `main.tsx`: Entry point

## Notes

This is a front-end only implementation using dummy data. In a production environment, you would integrate with a backend API for:

- User authentication
- Persistent data storage
- AI model integration for generating responses
- Faculty user management

## Future Enhancements

- Integration with actual AI models (e.g., OpenAI, Anthropic)
- Real-time notifications
- File management system for assignments
- More interactive components like whiteboard and code editor 