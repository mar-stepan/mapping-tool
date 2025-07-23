import type { GeoJSONFeature } from "./geo-json-feature.interface.ts";

export interface GeoJSONFeatureCollection {
    type: 'FeatureCollection';
    features: GeoJSONFeature[];
}
