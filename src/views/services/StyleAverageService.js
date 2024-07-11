// StyleAverageService.js

import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000/style_average';

export const calculateStyleAverage = async (sessionId) => {
    const response = await axios.get(`${API_BASE_URL}/${sessionId}`);
    return response.data;
};