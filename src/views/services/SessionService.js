// src/services/SessionService.js
import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000'; // Ensure this matches your backend URL

export class SessionService {
  async getAllSessions() {
    try {
      const response = await axios.get(`${API_BASE_URL}/session/find_all`);
      return response;
    } catch (error) {
      console.error('Error fetching sessions:', error);
      throw error;
    }
  }

  async createSession(session) {
    try {
      const response = await axios.post(`${API_BASE_URL}/session/new_session`, session);
      return response;
    } catch (error) {
      console.error('Error creating session:', error);
      throw error;
    }
  }

  async updateSession(sessionId, session) {
    try {
      const response = await axios.patch(`${API_BASE_URL}/session/edit/${sessionId}`, session);
      return response;
    } catch (error) {
      console.error('Error updating session:', error);
      throw error;
    }
  }

  async deleteSession(sessionId) {
    try {
      const response = await axios.delete(`${API_BASE_URL}/session/delete/${sessionId}`);
      return response;
    } catch (error) {
      console.error('Error deleting session:', error);
      throw error;
    }
  }

  async activateSession(sessionId) {
    try {
      const response = await axios.patch(`${API_BASE_URL}/session/activate/${sessionId}`);
      return response;
    } catch (error) {
      console.error('Error activating session:', error);
      throw error;
    }
  }

  async deactivateSession(sessionId) {
    try {
      const response = await axios.patch(`${API_BASE_URL}/session/deactivate/${sessionId}`);
      return response;
    } catch (error) {
      console.error('Error deactivating session:', error);
      throw error;
    }
  }
}
