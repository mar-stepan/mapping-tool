import type { ReactElement } from 'react';
import { Box, Paper, Typography, Chip } from '@mui/material';
import LayersIcon from '@mui/icons-material/Layers';
import MapIcon from '@mui/icons-material/Map';
import type { GeoJSONFeatureCollection } from "../shared/interfaces";
import type { GeoJSONFeature } from "../shared/interfaces/geo-json-feature.interface.ts";

interface FeatureTypeCount {
    [geometryType: string]: number;
}

interface InfoPanelProps {
    geoJsonData: GeoJSONFeatureCollection | null;
}

/**
 * Information panel to display GeoJSON dataset statistics
 */
const InfoPanel = ({ geoJsonData }: InfoPanelProps): ReactElement | null => {
    // If no data, don't render anything
    if (!geoJsonData || !geoJsonData.features || geoJsonData.features.length === 0) {
        return null;
    }

    // Count feature types
    const featureTypes: FeatureTypeCount = {};
    geoJsonData.features.forEach((feature: GeoJSONFeature) => {
        if (feature.geometry && feature.geometry.type) {
            featureTypes[feature.geometry.type] = (featureTypes[feature.geometry.type] || 0) + 1;
        }
    });

    return (
        <Paper
            elevation={3}
            sx={{
                position: 'absolute',
                bottom: 20,
                left: 20,
                padding: 2,
                width: 'auto',
                maxWidth: 300,
                backgroundColor: 'rgba(255, 255, 255, 0.9)',
                zIndex: 10
            }}
        >
            <Typography variant="subtitle1" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                <LayersIcon sx={{ mr: 1 }} />
                GeoJSON Dataset
            </Typography>

            <Typography variant="body2" color="text.secondary" gutterBottom>
                {geoJsonData.features.length} features loaded
            </Typography>

            <Box sx={{ mt: 1, display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                {Object.entries(featureTypes).map(([type, count]) => (
                    <Chip
                        key={type}
                        icon={<MapIcon />}
                        label={`${type}: ${count}`}
                        size="small"
                        variant="outlined"
                        color="primary"
                    />
                ))}
            </Box>
        </Paper>
    );
};

export default InfoPanel;
