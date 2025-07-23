import { nominatimApi } from "../api";
import type { AxiosResponse } from "axios";
import type { LocationData } from "../interfaces";

interface NominatimLocationResult {
  place_id: string | number;
  display_name: string;
  lat: string;
  lon: string;
  type: string;
  importance: number;
  boundingbox: number[];
}

export const searchLocations = async (query: string, limit: number = 5): Promise<LocationData[]> => {
  try {
    const response: AxiosResponse<NominatimLocationResult[]> = await nominatimApi.get('/search', {
      params: {
        q: query,
        format: 'json',
        limit
      }
    });

    return response.data.map((item: NominatimLocationResult) => ({
      id: item.place_id,
      display_name: item.display_name,
      lat: parseFloat(item.lat),
      lon: parseFloat(item.lon),
      type: item.type,
      importance: item.importance,
      boundingbox: item.boundingbox
    }));
  } catch (error) {
    console.error('Error searching locations:', error);
    throw error;
  }
};

export const reverseGeocode = async (lat: number, lon: number): Promise<NominatimLocationResult> => {
  try {
    const response: AxiosResponse<NominatimLocationResult> = await nominatimApi.get('/reverse', {
      params: {
        lat,
        lon,
        format: 'json'
      }
    });

    return response.data;
  } catch (error) {
    console.error('Error reverse geocoding:', error);
    throw error;
  }
};

export default {
  searchLocations,
  reverseGeocode
};
