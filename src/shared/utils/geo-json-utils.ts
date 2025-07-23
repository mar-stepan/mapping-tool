/**
 * Utility functions for handling GeoJSON data
 */
import type { GeoJSONFeature, GeoJSONFeatureCollection, Geometry } from "../interfaces";

export interface GeometryCollection {
  type: 'GeometryCollection';
  geometries: Geometry[];
}

export type CoordinateItem = {
  [key: string]: unknown;
  lat?: string | number;
  lon?: string | number;
  latitude?: string | number;
  longitude?: string | number;
  LAT?: string | number;
  LON?: string | number;
  Latitude?: string | number;
  Longitude?: string | number;
};

export type GeoJSONObject =
    | GeoJSONFeatureCollection
    | GeoJSONFeature
    | Geometry
    | GeometryCollection;



/**
 * Creates an empty GeoJSON FeatureCollection
 * @returns An empty GeoJSON FeatureCollection
 */
const createEmptyFeatureCollection = (): GeoJSONFeatureCollection => {
  return {
    type: 'FeatureCollection',
    features: []
  };
};

/**
 * Validates if an object is a valid GeoJSON object
 * @param data - Object to validate
 * @returns True if valid GeoJSON
 */
export const isValidGeoJson = (data: unknown): boolean => {
  if (!data || typeof data !== 'object') return false;

  // Type guard for object with type property
  const typedData = data as { type?: string; features?: unknown[]; geometries?: unknown[]; coordinates?: unknown[] };

  // Must have a type property
  if (!typedData.type) return false;

  // Special handling for CSV format and non-standard GeoJSON
  // Some datasets (like the airports example) might be in a different format
  if (Array.isArray(data) && data.length > 0) {
    // Check if it looks like points data with coordinates
    const item = data[0] as CoordinateItem;
    // If it has latitude/longitude or similar properties, we can convert it
    if (item &&
        ((typeof item.lat !== 'undefined' && typeof item.lon !== 'undefined') ||
            (typeof item.latitude !== 'undefined' && typeof item.longitude !== 'undefined') ||
            (typeof item.LAT !== 'undefined' && typeof item.LON !== 'undefined') ||
            (typeof item.Latitude !== 'undefined' && typeof item.Longitude !== 'undefined'))) {
      return true;
    }
  }

  // Handle GeoJSON types
  if (typedData.type === 'FeatureCollection') {
    // Check if it has features array
    if (!Array.isArray(typedData.features)) return false;

    // Empty feature collection is valid
    if (typedData.features.length === 0) return true;

    // Check at least the first feature (not all for performance reasons)
    const feature = typedData.features[0] as { type?: string };
    if (!feature) return true; // Empty features array

    // Be more lenient with feature validation
    if (feature.type && feature.type !== 'Feature') return false;

    // We'll accept features without geometry as they might be metadata
    return true;
  }

  // Handle Feature type
  else if (typedData.type === 'Feature') {
    // Lenient check for geometry
    return true;
  }

  // Handle direct geometry types
  else if (['Point', 'LineString', 'Polygon', 'MultiPoint', 'MultiLineString', 'MultiPolygon', 'GeometryCollection'].includes(typedData.type)) {
    // Must have coordinates (except GeometryCollection)
    if (typedData.type === 'GeometryCollection') {
      return Array.isArray(typedData.geometries);
    } else {
      return Array.isArray(typedData.coordinates);
    }
  }

  // Not a recognized GeoJSON type
  return false;
};

/**
 * Converts any valid GeoJSON to a FeatureCollection
 * @param data - Valid GeoJSON object or coordinate array
 * @returns GeoJSON FeatureCollection
 */
export const toFeatureCollection = (data: unknown): GeoJSONFeatureCollection => {
  if (!data) return createEmptyFeatureCollection();

  // Handle array of objects (CSV-like data)
  if (Array.isArray(data) && data.length > 0) {
    // Try to convert to GeoJSON points
    const features = data
        .map(item => {
          const coordItem = item as CoordinateItem;
          // Determine lat/lon fields
          let lat: number | undefined;
          let lon: number | undefined;

          if (typeof coordItem.lat !== 'undefined' && typeof coordItem.lon !== 'undefined') {
            lat = parseFloat(coordItem.lat as string);
            lon = parseFloat(coordItem.lon as string);
          } else if (typeof coordItem.latitude !== 'undefined' && typeof coordItem.longitude !== 'undefined') {
            lat = parseFloat(coordItem.latitude as string);
            lon = parseFloat(coordItem.longitude as string);
          } else if (typeof coordItem.LAT !== 'undefined' && typeof coordItem.LON !== 'undefined') {
            lat = parseFloat(coordItem.LAT as string);
            lon = parseFloat(coordItem.LON as string);
          } else if (typeof coordItem.Latitude !== 'undefined' && typeof coordItem.Longitude !== 'undefined') {
            lat = parseFloat(coordItem.Latitude as string);
            lon = parseFloat(coordItem.Longitude as string);
          } else {
            // Look for any property that could be lat/lon
            for (const key in coordItem) {
              const lowerKey = key.toLowerCase();
              if ((lowerKey.includes('lat') || lowerKey === 'y') && typeof lat === 'undefined') {
                lat = parseFloat(coordItem[key] as string);
              } else if ((lowerKey.includes('lon') || lowerKey.includes('lng') || lowerKey === 'x') && typeof lon === 'undefined') {
                lon = parseFloat(coordItem[key] as string);
              }
            }
          }

          // Skip items without valid coordinates
          if (typeof lat !== 'number' || typeof lon !== 'number' ||
              isNaN(lat) || isNaN(lon) ||
              lat < -90 || lat > 90 || lon < -180 || lon > 180) {
            return null;
          }

          // Create a GeoJSON Feature
          return {
            type: 'Feature' as const,
            geometry: {
              type: 'Point' as const,
              coordinates: [lon, lat] // GeoJSON uses [longitude, latitude] order
            },
            properties: {...coordItem} // Keep all original properties
          };
        })
        .filter((feature) => feature !== null); // Remove invalid features with type guard

    return {
      type: 'FeatureCollection',
      features
    };
  }

  const typedData = data as Partial<GeoJSONObject>;

  // Already a FeatureCollection
  if (typedData.type === 'FeatureCollection') {
    const featureCollection = typedData as GeoJSONFeatureCollection;
    // Ensure all features have properties
    return {
      ...featureCollection,
      features: featureCollection.features.map(feature => ({
        ...feature,
        properties: feature.properties || {}
      }))
    };
  }

  // Convert Feature to FeatureCollection
  if (typedData.type === 'Feature') {
    const feature = typedData as GeoJSONFeature;
    return {
      type: 'FeatureCollection',
      features: [{
        ...feature,
        properties: feature.properties || {}
      }]
    };
  }

  // Convert Geometry to FeatureCollection
  if (typedData.type && ['Point', 'LineString', 'Polygon', 'MultiPoint', 'MultiLineString', 'MultiPolygon'].includes(typedData.type)) {
    const geometry = typedData as Geometry;
    return {
      type: 'FeatureCollection',
      features: [{
        type: 'Feature',
        geometry,
        properties: {}
      }]
    };
  }

  // Convert GeometryCollection to FeatureCollection
  if (typedData.type === 'GeometryCollection' && Array.isArray((typedData as GeometryCollection).geometries)) {
    const geometryCollection = typedData as GeometryCollection;
    return {
      type: 'FeatureCollection',
      features: geometryCollection.geometries.map(geometry => ({
        type: 'Feature',
        geometry,
        properties: {}
      }))
    };
  }

  // Return empty if not convertible
  return createEmptyFeatureCollection();
};

export default {
  isValidGeoJson,
  toFeatureCollection
};
