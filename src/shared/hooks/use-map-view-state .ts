import { useState, useCallback, useEffect } from 'react';
import { FlyToInterpolator } from '@deck.gl/core';
import type { LocationData } from '../interfaces';
import type { ViewStateType } from "../types";



const MAP_CONFIG = {
    TRANSITION_DURATION: 1000,
    TRANSITION_EASING: (t: number) => t * (2 - t),
    DEFAULT_ZOOM: 14,
    WORLD_ZOOM: 2,
    TOLERANCE: 0.0001,
} as const;

const INITIAL_VIEW_STATE: ViewStateType = {
    longitude: 0,
    latitude: 0,
    zoom: MAP_CONFIG.WORLD_ZOOM,
    pitch: 0,
    bearing: 0
};

export const useMapViewState = (selectedLocation: LocationData | null) => {
    const [viewState, setViewState] = useState<ViewStateType>(INITIAL_VIEW_STATE);

    const parseCoord = useCallback((value: string | number): number => {
        const parsed = typeof value === 'string' ? parseFloat(value) : value;
        if (!isFinite(parsed)) {
            console.warn('Invalid coordinate value:', value);
            return 0;
        }
        return parsed;
    }, []);

    const calculateZoomFromBounds = useCallback((bounds: number[]): number => {
        const [minLng, minLat, maxLng, maxLat] = bounds;
        const latDiff = Math.abs(maxLat - minLat);
        const lngDiff = Math.abs(maxLng - minLng);
        const maxDiff = Math.max(latDiff, lngDiff);

        if (maxDiff > 10) return 4;
        if (maxDiff > 5) return 5;
        if (maxDiff > 3) return 6;
        if (maxDiff > 1) return 8;
        if (maxDiff > 0.5) return 9;
        if (maxDiff > 0.1) return 11;
        if (maxDiff > 0.05) return 12;
        if (maxDiff > 0.01) return 13;
        return MAP_CONFIG.DEFAULT_ZOOM;
    }, []);

    useEffect(() => {
        if (selectedLocation) {
            setViewState(currentState => {
                if (selectedLocation.boundingbox && selectedLocation.boundingbox.length === 4) {
                    const [south, north, west, east] = selectedLocation.boundingbox.map(parseCoord);

                    const longitude = (west + east) / 2;
                    const latitude = (south + north) / 2;

                    const bounds = [west, south, east, north];
                    const zoom = calculateZoomFromBounds(bounds);

                    return {
                        ...currentState,
                        longitude,
                        latitude,
                        zoom,
                        transitionDuration: MAP_CONFIG.TRANSITION_DURATION,
                        transitionInterpolator: new FlyToInterpolator(),
                        transitionEasing: MAP_CONFIG.TRANSITION_EASING
                    };
                } else {
                    return {
                        ...currentState,
                        longitude: parseCoord(selectedLocation.lon),
                        latitude: parseCoord(selectedLocation.lat),
                        zoom: MAP_CONFIG.DEFAULT_ZOOM,
                        transitionDuration: MAP_CONFIG.TRANSITION_DURATION,
                        transitionInterpolator: new FlyToInterpolator(),
                        transitionEasing: MAP_CONFIG.TRANSITION_EASING
                    };
                }
            });
        }
    }, [selectedLocation, calculateZoomFromBounds, parseCoord]);

    const handleViewStateChange = useCallback((params: { viewState: ViewStateType }) => {
        setViewState(params.viewState);
    }, []);

    return {
        viewState,
        setViewState,
        parseCoord,
        handleViewStateChange
    };
};
