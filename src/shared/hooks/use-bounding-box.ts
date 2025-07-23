import { useCallback } from 'react';
import type { GeoJSONFeature } from '../interfaces';

export const useBoundingBox = () => {
    const calculateBoundingBox = useCallback((features: GeoJSONFeature[]): number[] | null => {
        if (!features || features.length === 0) return null;

        let minLng = Infinity;
        let minLat = Infinity;
        let maxLng = -Infinity;
        let maxLat = -Infinity;

        const updateBounds = (lng: number, lat: number) => {
            minLng = Math.min(minLng, lng);
            minLat = Math.min(minLat, lat);
            maxLng = Math.max(maxLng, lng);
            maxLat = Math.max(maxLat, lat);
        };

        const processCoordinates = (coords: any, type: string) => {
            if (type === 'Point') {
                updateBounds(coords[0], coords[1]);
            } else if (type === 'LineString' || type === 'MultiPoint') {
                coords.forEach((point: number[]) => updateBounds(point[0], point[1]));
            } else if (type === 'Polygon' || type === 'MultiLineString') {
                coords.forEach((line: number[][]) => line.forEach((point: number[]) => updateBounds(point[0], point[1])));
            } else if (type === 'MultiPolygon') {
                coords.forEach((poly: number[][][]) =>
                    poly.forEach((line: number[][]) =>
                        line.forEach((point: number[]) => updateBounds(point[0], point[1]))
                    )
                );
            }
        };

        features.forEach((feature: GeoJSONFeature) => {
            if (feature.geometry && feature.geometry.coordinates) {
                processCoordinates(feature.geometry.coordinates, feature.geometry.type);
            }
        });

        if (minLng !== Infinity && minLat !== Infinity && maxLng !== -Infinity && maxLat !== -Infinity) {
            return [minLng, minLat, maxLng, maxLat];
        }
        return null;
    }, []);

    return { calculateBoundingBox };
};
