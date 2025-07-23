import axios from 'axios';

const NOMINATIM_BASE_URL = 'https://nominatim.openstreetmap.org';

// Configure axios with headers
export const nominatimApi = axios.create({
    baseURL: NOMINATIM_BASE_URL,
    headers: {
        'Accept-Language': 'en'
        // Browser will automatically send its own User-Agent
    }
});
