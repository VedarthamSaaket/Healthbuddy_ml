import axios from 'axios'

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

export const api = axios.create({
  baseURL: API_BASE,
  withCredentials: true,   // Sends the httpOnly cookie on every request
  headers: { 'Content-Type': 'application/json' },
})

/*
  FIX: Global response interceptor.
  Without this, any 401 from the backend (expired/missing cookie) causes an
  unhandled promise rejection that crashes the dashboard and chat pages.
  Now we catch it, clear any stale client-side state, and redirect to sign-in.
*/
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Only redirect if we're in the browser and not already on an auth page
      if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/auth')) {
        window.location.href = '/auth/signin'
      }
    }
    return Promise.reject(error)
  }
)

export const authAPI = {
  signup: (
    email: string,
    password: string,
    fullName: string,
    role: string,
    ageConfirmed: boolean
  ) =>
    api.post('/api/auth/signup', {
      email,
      password,
      full_name: fullName,
      role,
      age_confirmed: ageConfirmed,
    }),

  signin: (email: string, password: string) =>
    api.post('/api/auth/signin', { email, password }),

  signout: () => api.post('/api/auth/signout'),

  me: () => api.get('/api/auth/me'),
}

export const chatAPI = {
  sendMessage: (
    content: string,
    history: { role: string; content: string }[],
    language = 'en'
  ) => api.post('/api/chat/message', { content, history, language }),

  getHistory: () => api.get('/api/chat/history'),

  getSessions: () => api.get('/api/chat/sessions'),
}

export const appointmentsAPI = {
  listDoctors: () => api.get('/api/appointments/doctors'),

  book: (doctorId: string, note?: string) =>
    api.post('/api/appointments/book', { doctor_id: doctorId, note }),

  myAppointments: () => api.get('/api/appointments/my'),

  updateStatus: (apptId: string, status: string) =>
    api.patch(`/api/appointments/${apptId}/status?status=${status}`),

  createDoctorProfile: (name: string, specialty: string, bio?: string) =>
    api.post('/api/appointments/doctor-profile', { name, specialty, bio }),
}

export const adviceAPI = {
  generate: (symptomsText: string, language = 'en') =>
    api.post('/api/advice/generate', { symptoms_text: symptomsText, language }),

  history: () => api.get('/api/advice/history'),
}