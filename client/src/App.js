import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import CreateExam from './pages/CreateExam';
import TakeExam from './pages/TakeExam';
import CorrectExam from './pages/CorrectExam';
import ViewResults from './pages/ViewResults';

function App() {
  return (
    <AuthProvider>
      <Router>
        <ProtectedRoute>
          <div className="min-h-screen bg-gray-50">
            <Navbar />
            <main className="container mx-auto px-4 py-8">
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/create-exam" element={<CreateExam />} />
                <Route path="/take-exam/:id" element={<TakeExam />} />
                <Route path="/correct-exam" element={<CorrectExam />} />
                <Route path="/results" element={<ViewResults />} />
              </Routes>
            </main>
          </div>
        </ProtectedRoute>
      </Router>
    </AuthProvider>
  );
}

export default App;
