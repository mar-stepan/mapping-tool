import React, { useState, useEffect } from 'react';
import {
    Box,
    AppBar,
    Toolbar,
    Typography,
    Container,
    Paper,
    Tabs,
    Tab,
    Snackbar,
    Alert,
} from '@mui/material';
import { TableView, SearchBar, LocationButton, MapView, UrlInputForm } from './components';
import { useGeolocation } from './shared/hooks';
import type { GeoJSONFeatureCollection, LocationData, SnackbarState } from "./shared/interfaces";

function App() {
    const [viewMode, setViewMode] = useState<number>(0);
    const [geoJsonData, setGeoJsonData] = useState<GeoJSONFeatureCollection | null>(null);
    const [drawnFeatures, setDrawnFeatures] = useState<GeoJSONFeatureCollection>({
        type: 'FeatureCollection',
        features: []
    });
    const [selectedLocation, setSelectedLocation] = useState<LocationData | null>(null);
    const [snackbar, setSnackbar] = useState<SnackbarState>({ open: false, message: '', severity: 'info' });
    const [selectedFeatureIndices, setSelectedFeatureIndices] = useState<number[]>([]);

    const { locationDetails, loading: geoLoading, error: geoError, requestLocation } = useGeolocation();

    useEffect(() => {
        if (locationDetails) {
            setSelectedLocation(locationDetails);
            setSnackbar({
                open: true,
                message: 'Using your current location',
                severity: 'success'
            });
        }
    }, [locationDetails]);

    useEffect(() => {
        if (geoError) {
            setSnackbar({
                open: true,
                message: `Couldn't access your location: ${geoError}`,
                severity: 'warning'
            });
        }
    }, [geoError]);

    const handleLocationRequest = async () => {
        try {
            await requestLocation();
        } catch (error) {
            console.error('Failed to get location:', error);
        }
    };

    const combinedGeoJsonData = React.useMemo<GeoJSONFeatureCollection>(() => {
        if (!geoJsonData) return drawnFeatures;

        return {
            type: 'FeatureCollection',
            features: [...drawnFeatures.features, ...geoJsonData.features]
        };
    }, [geoJsonData, drawnFeatures]);

    const handleViewChange = (_event: React.SyntheticEvent, newValue: number) => {
        setViewMode(newValue);
    };

    const handleLoadGeoJson = (data: GeoJSONFeatureCollection | null) => {
        setGeoJsonData(null);

        setTimeout(() => {
            if (data && data.type === 'FeatureCollection') {
                setGeoJsonData(data);

                setSnackbar({
                    open: true,
                    message: `Loaded GeoJSON with ${data.features.length} features`,
                    severity: 'success'
                });
                setViewMode(0);
            }
        }, 100);
    };

    const handleDrawnFeaturesChange = (features: GeoJSONFeatureCollection) => {
        setDrawnFeatures(features);
    };

    const handleSearchResult = (result: LocationData) => {
        setSelectedLocation(result);
        setViewMode(0);
    };

    const handleFeatureSelectionChange = (selectedIndices: number[]) => {
        if (JSON.stringify(selectedIndices) !== JSON.stringify(selectedFeatureIndices)) {
            setSelectedFeatureIndices(selectedIndices);
        }
    };

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
            <AppBar position="static">
                <Toolbar>
                    <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
                        Mapping Tool
                    </Typography>
                    <SearchBar onSearchResult={handleSearchResult} onLocationReset={() => setSelectedLocation(null)}/>
                    <LocationButton
                        onLocationRequested={handleLocationRequest}
                        loading={geoLoading}
                    />
                </Toolbar>
            </AppBar>

            <Container maxWidth="xl" sx={{ mt: 2, mb: 2, flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                <Paper sx={{ p: 2, mb: 2 }}>
                    <UrlInputForm onLoadGeoJson={handleLoadGeoJson}/>
                </Paper>

                <Paper sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                    <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                        <Tabs value={viewMode} onChange={handleViewChange}>
                            <Tab label="Map View"/>
                            <Tab label="Table View"/>
                        </Tabs>
                    </Box>

                    <Box sx={{ flexGrow: 1, display: 'flex', position: 'relative' }}>
                        {viewMode === 0 ? (
                            <MapView
                                geoJsonData={combinedGeoJsonData}
                                selectedLocation={selectedLocation}
                                onDrawnFeaturesChange={handleDrawnFeaturesChange}
                                selectedFeatureIndices={selectedFeatureIndices}
                                onFeatureSelectionChange={handleFeatureSelectionChange}
                                initialEditableFeatures={drawnFeatures}
                            />
                        ) : (
                            <TableView
                                geoJsonData={combinedGeoJsonData}
                                selectedFeatureIndices={selectedFeatureIndices}
                                onFeatureSelectionChange={handleFeatureSelectionChange}
                            />
                        )}
                    </Box>
                </Paper>
            </Container>

            <Snackbar
                open={snackbar.open}
                autoHideDuration={5000}
                onClose={() => setSnackbar({ ...snackbar, open: false })}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            >
                <Alert
                    onClose={() => setSnackbar({ ...snackbar, open: false })}
                    severity={snackbar.severity}
                    sx={{ width: '100%' }}
                >
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </Box>
    );
}

export default App;
