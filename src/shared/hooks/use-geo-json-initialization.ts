import { useState, useEffect } from 'react';
import type { GeoJSONFeature, GeoJSONFeatureCollection, SnackbarState } from '../interfaces';
import type { MapViewState } from "@deck.gl/core";

export const useGeoJsonInitialization = (
    geoJsonData: GeoJSONFeatureCollection | null,
    calculateBoundingBox: (features: GeoJSONFeature[]) => number[] | null,
    currentViewState: MapViewState,
    setViewState: (viewState: MapViewState) => void,
    setSnackbar: (snackbar: SnackbarState) => void
) => {
    const [processedDataId, setProcessedDataId] = useState<string | null>(null);

    useEffect(() => {
        if (!geoJsonData || !geoJsonData.features || geoJsonData.features.length === 0) {
            return;
        }

        const dataId = `${geoJsonData.features.length}-${JSON.stringify(geoJsonData.features[0]?.geometry?.type || '')}`;

        if (dataId === processedDataId) {
            return;
        }

        setProcessedDataId(dataId);

        setSnackbar({
            open: true,
            message: `Showing ${geoJsonData.features.length} GeoJSON features`,
            severity: 'info'
        });

        const bounds = calculateBoundingBox(geoJsonData.features);
        const timeoutId = setTimeout(() => {
            let newViewState: MapViewState;

            if (bounds) {
                const [minLng, minLat, maxLng, maxLat] = bounds;
                const centerLng = (minLng + maxLng) / 2;
                const centerLat = (minLat + maxLat) / 2;
                const latDiff = Math.abs(maxLat - minLat);
                const lngDiff = Math.abs(maxLng - minLng);
                const maxDiff = Math.max(latDiff, lngDiff);

                let zoom = 14;
                if (maxDiff > 10) zoom = 4;
                else if (maxDiff > 5) zoom = 5;
                else if (maxDiff > 3) zoom = 6;
                else if (maxDiff > 1) zoom = 8;
                else if (maxDiff > 0.5) zoom = 9;
                else if (maxDiff > 0.1) zoom = 11;
                else if (maxDiff > 0.05) zoom = 12;
                else if (maxDiff > 0.01) zoom = 13;

                newViewState = {
                    longitude: centerLng,
                    latitude: centerLat,
                    zoom,
                    pitch: currentViewState.pitch || 0,
                    bearing: currentViewState.bearing || 0,
                    transitionDuration: 1000
                };
            } else {
                const feature = geoJsonData.features[0];
                if (feature.geometry && feature.geometry.coordinates) {
                    let longitude, latitude;
                    if (feature.geometry.type === 'Point') {
                        [longitude, latitude] = feature.geometry.coordinates as number[];
                    } else if (feature.geometry.type === 'LineString') {
                        [longitude, latitude] = (feature.geometry.coordinates as number[][])[0];
                    } else if (feature.geometry.type === 'Polygon') {
                        [longitude, latitude] = (feature.geometry.coordinates as number[][][])[0][0];
                    } else if (feature.geometry.type === 'MultiPolygon') {
                        [longitude, latitude] = (feature.geometry.coordinates as number[][][][])[0][0][0];
                    }

                    if (typeof longitude === 'number' && typeof latitude === 'number') {
                        newViewState = {
                            ...currentViewState,
                            longitude,
                            latitude,
                            zoom: 10,
                            transitionDuration: 1000
                        };
                    } else {
                        newViewState = currentViewState;
                    }
                } else {
                    newViewState = currentViewState;
                }
            }

            setViewState(newViewState);
        }, 100);

        return () => clearTimeout(timeoutId);
    }, [geoJsonData, calculateBoundingBox, processedDataId, setSnackbar, setViewState, currentViewState]);

    return { processedDataId };
};
