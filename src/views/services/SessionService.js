import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000'; // Ensure this matches your backend URL

// Set up an Axios instance with JWT support
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Interceptor to add JWT token to requests
apiClient.interceptors.request.use(config => {
  const token = localStorage.getItem('jwt');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export class SessionService {
  async getSessionsByUser() {
    try {
      const response = await apiClient.get('/session/find_by_user');
      return response;
    } catch (error) {
      console.error('Error fetching user sessions:', error);
      throw error;
    }
  }

  async createSession(session) {
    try {
      const response = await apiClient.post('/session/new_session', session);
      return response;
    } catch (error) {
      console.error('Error creating session:', error);
      throw error;
    }
  }

  async updateSession(sessionId, session) {
    try {
      const response = await apiClient.patch(`/session/edit/${sessionId}`, session);
      return response;
    } catch (error) {
      console.error('Error updating session:', error);
      throw error;
    }
  }

  async deleteSession(sessionId) {
    try {
      const response = await apiClient.delete(`/session/delete/${sessionId}`);
      return response;
    } catch (error) {
      console.error('Error deleting session:', error);
      throw error;
    }
  }

  async activateSession(sessionId) {
    try {
      const response = await apiClient.patch(`/session/activate/${sessionId}`);
      return response;
    } catch (error) {
      console.error('Error activating session:', error);
      throw error;
    }
  }

  async deactivateSession(sessionId) {
    try {
      const response = await apiClient.patch(`/session/deactivate/${sessionId}`);
      return response;
    } catch (error) {
      console.error('Error deactivating session:', error);
      throw error;
    }
  }
}
