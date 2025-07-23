import React, { useCallback, useState } from 'react';
import {
    Box,
    TextField,
    Button,
    Chip,
    Typography,
    CircularProgress,
    Alert,
    ButtonGroup,
    Snackbar,
    type AlertColor
} from '@mui/material';
import axios, { type AxiosError } from 'axios';
import { isValidGeoJson, toFeatureCollection } from '../shared/utils';
import ClearIcon from '@mui/icons-material/Clear';
import FileUploadIcon from '@mui/icons-material/FileUpload';
import type { GeoJSONFeatureCollection, SnackbarState } from "../shared/interfaces";

interface UrlInputFormProps {
    onLoadGeoJson: (data: GeoJSONFeatureCollection | null) => void;
}

const EXAMPLE_URLS = [
    'https://d2ad6b4ur7yvpq.cloudfront.net/naturalearth-3.3.0/ne_10m_airports.geojson',
    'https://d2ad6b4ur7yvpq.cloudfront.net/naturalearth-3.3.0/ne_10m_ports.geojson'
];

export const UrlInputForm: React.FC<UrlInputFormProps> = ({ onLoadGeoJson }) => {
    const [url, setUrl] = useState<string>('');
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [snackbar, setSnackbar] = useState<SnackbarState>({
        open: false,
        message: '',
        severity: 'info'
    });

    const handleUrlChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setUrl(event.target.value);
        setError(null);
    };

    const showSnackbar = (message: string, severity: AlertColor) => {
        setSnackbar({
            open: true,
            message,
            severity
        });
    };

    const loadGeoJson = useCallback(async (urlToLoad: string) => {
        if (!urlToLoad) {
            setError('Please enter a URL');
            return;
        }

        setLoading(true);
        setError(null);

        const actualUrl = urlToLoad;
        const isGithubUrl = urlToLoad.includes('github') || urlToLoad.includes('githubusercontent');

        if (isGithubUrl) {
            showSnackbar('Using CORS proxy for GitHub URL', 'info');
        }

        try {
            const response = await axios.get(actualUrl, {
                timeout: 15000, // Increased timeout
                headers: {
                    'Accept': 'application/json, text/plain, */*',
                }
            });

            if (!response.data) {
                throw new Error('Empty response received');
            }

            if (!isValidGeoJson(response.data)) {
                console.warn('Received data:', response.data);
                throw new Error('Invalid GeoJSON format. Data structure is not recognized as GeoJSON.');
            }

            const featureCollection = toFeatureCollection(response.data);

            showSnackbar(
                `Successfully loaded GeoJSON with ${featureCollection.features.length} features`,
                'success'
            );

            onLoadGeoJson(featureCollection);
        } catch (error) {
            console.error('Error loading GeoJSON:', error);
            handleLoadError(error as Error | AxiosError);
        } finally {
            setLoading(false);
        }
    }, [onLoadGeoJson]);

    const handleLoadError = (error: Error | AxiosError) => {
        let errorMessage: string;

        if (axios.isAxiosError(error)) {
            const axiosError = error as AxiosError;

            if (axiosError.code === 'ECONNABORTED') {
                errorMessage = 'Request timed out. The server might be slow or unavailable.';
            } else if (axiosError.response) {
                const status = axiosError.response.status;
                switch (status) {
                    case 404:
                        errorMessage = 'Error 404: The requested GeoJSON file was not found.';
                        break;
                    case 403:
                        errorMessage = 'Error 403: Access to this GeoJSON file is forbidden.';
                        break;
                    case 500:
                        errorMessage = 'Error 500: Server error occurred while fetching the GeoJSON file.';
                        break;
                    case 401:
                        errorMessage = 'Error 401: Authentication required to access this GeoJSON file.';
                        break;
                    default:
                        errorMessage = `Error ${status}: ${axiosError.response.statusText || 'Unknown error'}`;
                }
            } else if (axiosError.request) {
                errorMessage = 'No response received from the server. Check the URL and try again.';
            } else if (axiosError.message && axiosError.message.includes('Network Error')) {
                errorMessage = 'Network error. This might be due to CORS restrictions on the server.';
            } else {
                errorMessage = axiosError.message || 'Failed to load GeoJSON';
            }
        } else {
            errorMessage = error.message || 'Failed to load GeoJSON';
        }

        setError(errorMessage);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        loadGeoJson(url);
    };

    const handleClear = useCallback(() => {
        onLoadGeoJson(null);
        setUrl('');
        setError(null);
        showSnackbar('GeoJSON data cleared', 'info');
    }, [onLoadGeoJson]);

    const handleExampleClick = (exampleUrl: string) => {
        setUrl(exampleUrl);
        loadGeoJson(exampleUrl);
    };

    const handleSnackbarClose = () => {
        setSnackbar(prev => ({ ...prev, open: false }));
    };

    const renderExampleChips = () => (
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            <Chip
                label="World Airports"
                onClick={() => handleExampleClick(EXAMPLE_URLS[0])}
                color="primary"
                variant="outlined"
                clickable
            />
            <Chip
                label="World Ports"
                onClick={() => handleExampleClick(EXAMPLE_URLS[1])}
                color="primary"
                variant="outlined"
                clickable
            />
            <Chip
                label="Error Example"
                onClick={() => handleExampleClick('https://eric.clst.org/assets/wiki/uploads/Stuff/gz_2010_us_050_00_500k.json')}
                color="secondary"
                variant="outlined"
                clickable
            />
        </Box>
    );

    return (
        <Box component="form" onSubmit={handleSubmit} sx={{ width: '100%' }}>
            <Typography variant="subtitle1" gutterBottom>
                Load GeoJSON from URL
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                Enter a URL to a publicly accessible GeoJSON file. The URL must support CORS for browser access.
            </Typography>

            <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 2 }}>
                <TextField
                    label="GeoJSON URL"
                    variant="outlined"
                    value={url}
                    onChange={handleUrlChange}
                    fullWidth
                    error={!!error}
                    helperText={error}
                    disabled={loading}
                    sx={{ mr: 1 }}
                />
                <ButtonGroup variant="contained" sx={{ height: 56 }}>
                    <Button
                        type="submit"
                        color="primary"
                        disabled={loading || !url}
                        startIcon={loading ? <CircularProgress size={20}/> : <FileUploadIcon/>}
                    >
                        {loading ? 'Loading...' : 'Load'}
                    </Button>
                    <Button
                        onClick={handleClear}
                        color="secondary"
                        disabled={loading}
                        startIcon={<ClearIcon/>}
                    >
                        Clear
                    </Button>
                </ButtonGroup>
            </Box>

            <Box sx={{ mt: 2 }}>
                <Typography variant="subtitle2" gutterBottom>
                    Example URLs:
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                    Click any example below to load verified working GeoJSON files.
                </Typography>
                {renderExampleChips()}
            </Box>

            <Snackbar
                open={snackbar.open}
                autoHideDuration={4000}
                onClose={handleSnackbarClose}
                anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
            >
                <Alert
                    onClose={handleSnackbarClose}
                    severity={snackbar.severity}
                    sx={{ width: '100%' }}
                >
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </Box>
    );
};

export default UrlInputForm;
