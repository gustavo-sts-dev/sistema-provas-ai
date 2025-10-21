// Configuração centralizada da API
const API_BASE_URL = 'http://localhost:5000';

export const api = {
  // Exams
  getExams: () => `${API_BASE_URL}/api/exams`,
  getExam: (id) => `${API_BASE_URL}/api/exams/${id}`,
  createManualExam: () => `${API_BASE_URL}/api/exams/create-manual`,
  generateAIExam: () => `${API_BASE_URL}/api/exams/generate-ai`,
  deleteExam: (id) => `${API_BASE_URL}/api/exams/${id}`,
  
  // Students
  submitExam: () => `${API_BASE_URL}/api/students/submit`,
  getPendingExams: () => `${API_BASE_URL}/api/students/pending`,
  deletePendingExam: (id) => `${API_BASE_URL}/api/students/pending/${id}`,
  
  // Corrections
  getCorrectedExams: () => `${API_BASE_URL}/api/corrections/corrected`,
  getCorrectionById: (id) => `${API_BASE_URL}/api/corrections/${id}`,
  submitAutomaticCorrection: () => `${API_BASE_URL}/api/corrections/automatic`,
  submitManualCorrection: () => `${API_BASE_URL}/api/corrections/manual`,
  deleteCorrection: (id) => `${API_BASE_URL}/api/corrections/${id}`,
  
  // PDF
  extractPDF: () => `${API_BASE_URL}/api/pdf/extract-pdf`,
  
  // Auth
  login: () => `${API_BASE_URL}/api/auth/login`,
  checkPassword: () => `${API_BASE_URL}/api/auth/check-password`,
  setupPassword: () => `${API_BASE_URL}/api/auth/setup-password`
};

export default API_BASE_URL;

