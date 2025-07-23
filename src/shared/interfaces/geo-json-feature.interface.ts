export type Geometry = {
    type: 'Point' | 'LineString' | 'Polygon' | 'MultiPoint' | 'MultiLineString' | 'MultiPolygon';
    coordinates: number[] | number[][] | number[][][] | number[][][][];
};

export interface GeoJSONFeature {
    type: string;
    geometry: Geometry;
    properties?: Record<string, unknown>;
}
