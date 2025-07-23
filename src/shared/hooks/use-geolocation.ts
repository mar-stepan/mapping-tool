import { useState } from 'react';
import { reverseGeocode } from '../services';

interface LocationDetails {
    id: number | string;
    display_name: string;
    lat: number;
    lon: number;
    type: string;
    importance: number;
    boundingbox: number[] | [number, number, number, number];
}

export const useGeolocation = () => {
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [locationDetails, setLocationDetails] = useState<LocationDetails | null>(null);

    const requestLocation = () => {
        if (!navigator.geolocation) {
            setError('Geolocation is not supported by your browser');
            return Promise.reject('Geolocation not supported');
        }

        setLoading(true);
        setError(null);

        return new Promise<LocationDetails>((resolve, reject) => {
            const successHandler = async (position: GeolocationPosition) => {
                const { latitude, longitude } = position.coords;

                try {
                    const details = await reverseGeocode(latitude, longitude);

                    const formattedLocation: LocationDetails = {
                        id: details.place_id || Date.now(),
                        display_name: details.display_name || 'Current Location',
                        lat: latitude,
                        lon: longitude,
                        type: 'current_location',
                        importance: 1,
                        boundingbox: details.boundingbox || [latitude - 0.01, latitude + 0.01, longitude - 0.01, longitude + 0.01]
                    };

                    setLocationDetails(formattedLocation);
                    setLoading(false);
                    resolve(formattedLocation);
                } catch (err) {
                    console.error('Error getting location details:', err);
                    const basicLocation: LocationDetails = {
                        id: Date.now(),
                        display_name: 'Current Location',
                        lat: latitude,
                        lon: longitude,
                        type: 'current_location',
                        importance: 1,
                        boundingbox: [latitude - 0.01, latitude + 0.01, longitude - 0.01, longitude + 0.01]
                    };

                    setLocationDetails(basicLocation);
                    setLoading(false);
                    resolve(basicLocation);
                }
            };

            const errorHandler = (err: GeolocationPositionError) => {
                const errorMessage = err.message || 'Unable to get your location';
                setError(errorMessage);
                setLoading(false);
                reject(errorMessage);
            };

            navigator.geolocation.getCurrentPosition(
                successHandler,
                errorHandler,
                {
                    enableHighAccuracy: true,
                    timeout: 10000,
                    maximumAge: 0,
                }
            );
        });
    };

    return { locationDetails, loading, error, requestLocation };
};


export default useGeolocation;
