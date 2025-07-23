import { useState, useCallback, useEffect, useMemo } from 'react';
import { Box, Button, ButtonGroup, Tooltip, Snackbar, Alert } from '@mui/material';
import DeckGL from '@deck.gl/react';
import { GeoJsonLayer } from '@deck.gl/layers';
import { EditableGeoJsonLayer } from '@deck.gl-community/editable-layers';
import { DrawPolygonMode, DrawLineStringMode, ModifyMode, ViewMode } from '@deck.gl-community/editable-layers';
import { Map } from 'react-map-gl';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { saveAs } from 'file-saver';
import StyleControls from './style-controls';
import InfoPanel from './info-panel';
import type { GeoJSONFeatureCollection, LocationData, SnackbarState, GeoJSONFeature } from "../shared/interfaces";
import {
    useMapViewState,
    useBoundingBox,
    useEditableFeatures,
    useDrawingMode,
    useGeoJsonInitialization
} from '../shared/hooks';
import { MAP_CONFIG } from '../shared/constants';

type ColorArray = [number, number, number, number];
type LayerStyle = {
    fillColor: ColorArray;
    lineColor: ColorArray;
    lineWidth: number;
};
type ClickInfo = {
    index: number;
    object: unknown;
    layer: unknown;
    lngLat: [number, number];
    coordinate: [number, number];
    picked: boolean;
    x: number;
    y: number;
    srcEvent: {
        shiftKey: boolean;
    };
};
type MapLayer = GeoJsonLayer<unknown> | EditableGeoJsonLayer | null;

interface MapViewProps {
    geoJsonData: GeoJSONFeatureCollection;
    selectedLocation: LocationData | null;
    onDrawnFeaturesChange: (features: GeoJSONFeatureCollection) => void;
    selectedFeatureIndices?: number[];
    onFeatureSelectionChange?: (indices: number[]) => void;
    initialEditableFeatures?: GeoJSONFeatureCollection;
    onClearAllDrawings?: () => void;
}

export const MapView = ({
                            geoJsonData,
                            selectedLocation,
                            onDrawnFeaturesChange,
                            selectedFeatureIndices = [],
                            onFeatureSelectionChange = () => {
                            },
                            initialEditableFeatures = { type: 'FeatureCollection', features: [] },
                        }: MapViewProps) => {
    const [layerStyle, setLayerStyle] = useState<LayerStyle>({
        fillColor: [0, 120, 255, 100],
        lineColor: [0, 120, 255, 255],
        lineWidth: 2
    });
    const [snackbar, setSnackbar] = useState<SnackbarState>({
        open: false,
        message: '',
        severity: 'success' as 'success' | 'info' | 'warning' | 'error'
    });
    const { viewState, setViewState, parseCoord, handleViewStateChange } =
        useMapViewState(selectedLocation);
    const { calculateBoundingBox } = useBoundingBox();
    const {
        editableFeatures,
        selectedEditableIndex,
        setSelectedEditableIndex,
        handleUpdate,
        handleClearAllDrawings
    } = useEditableFeatures(initialEditableFeatures, onDrawnFeaturesChange, onFeatureSelectionChange, setSnackbar);
    const { mode, handleDrawPolygon, handleDrawLine, handleModify, handleView } =
        useDrawingMode(setSnackbar, onFeatureSelectionChange, selectedFeatureIndices);
    useGeoJsonInitialization(geoJsonData, calculateBoundingBox, viewState, setViewState, setSnackbar);

    useEffect(() => {
        const newSelectedIndex = selectedFeatureIndices.length === 1 &&
        selectedFeatureIndices[0] < editableFeatures.features.length ?
            selectedFeatureIndices[0] : null;
        if (newSelectedIndex !== selectedEditableIndex) {
            setSelectedEditableIndex(newSelectedIndex);
        }
    }, [selectedFeatureIndices, editableFeatures.features.length, selectedEditableIndex, setSelectedEditableIndex]);
    const handleExport = useCallback(() => {
        if (!editableFeatures || editableFeatures.features.length === 0) {
            setSnackbar({
                open: true,
                message: 'No features to export',
                severity: 'warning'
            });
            return;
        }
        const blob = new Blob([JSON.stringify(editableFeatures, null, 2)], {
            type: 'application/json'
        });
        saveAs(blob, 'map-features.geojson');
        setSnackbar({
            open: true,
            message: 'GeoJSON exported successfully',
            severity: 'success'
        });
    }, [editableFeatures]);

    const handleSnackbarClose = () => {
        setSnackbar(prev => ({ ...prev, open: false }));
    };

    const handleFeatureClick = useCallback((info: ClickInfo) => {
        if (info.index !== -1 && mode === ViewMode && typeof onFeatureSelectionChange === 'function') {
            const clickedIndex = info.index;
            const isSelected = selectedFeatureIndices.includes(clickedIndex);
            if (isSelected) {
                onFeatureSelectionChange(selectedFeatureIndices.filter(idx => idx !== clickedIndex));
            } else {
                const newSelection = info.srcEvent.shiftKey
                    ? [...selectedFeatureIndices, clickedIndex]
                    : [clickedIndex];
                onFeatureSelectionChange(newSelection);
            }
        }
    }, [mode, selectedFeatureIndices, onFeatureSelectionChange]);
    const boundaryGeoJson = useMemo(() => {
        if (selectedLocation?.boundingbox?.length === 4) {
            return {
                type: 'Feature' as const,
                geometry: {
                    type: 'Polygon' as const,
                    coordinates: [[
                        [parseCoord(selectedLocation.boundingbox[2]), parseCoord(selectedLocation.boundingbox[0])], // SW
                        [parseCoord(selectedLocation.boundingbox[3]), parseCoord(selectedLocation.boundingbox[0])], // SE
                        [parseCoord(selectedLocation.boundingbox[3]), parseCoord(selectedLocation.boundingbox[1])], // NE
                        [parseCoord(selectedLocation.boundingbox[2]), parseCoord(selectedLocation.boundingbox[1])], // NW
                        [parseCoord(selectedLocation.boundingbox[2]), parseCoord(selectedLocation.boundingbox[0])]  // SW (close the loop)
                    ]]
                }
            };
        }
        return null;
    }, [selectedLocation, parseCoord]);
    const layers = useMemo(() => {
        const layerArray: MapLayer[] = [
            new GeoJsonLayer({
                id: 'geojson-layer',
                data: geoJsonData,
                pickable: true,
                stroked: true,
                filled: true,
                extruded: true,
                lineWidthScale: 20,
                lineWidthMinPixels: 2,
                getFillColor: (_: GeoJSONFeature, { index }: { index: number }) => {
                    // Check if this feature is selected
                    const isSelected = selectedFeatureIndices.includes(index);
                    return isSelected ? MAP_CONFIG.COLORS.SELECTED.FILL : MAP_CONFIG.COLORS.DEFAULT.FILL;
                },
                getLineColor: (_: GeoJSONFeature, { index }: { index: number }) => {
                    const isSelected = selectedFeatureIndices.includes(index);
                    return isSelected ? MAP_CONFIG.COLORS.SELECTED.LINE : MAP_CONFIG.COLORS.DEFAULT.LINE;
                },
                getPointRadius: (d: GeoJSONFeature) => d.properties?.radius || 100,
                getLineWidth: (d: GeoJSONFeature, { index }: { index: number }) => {
                    const isSelected = selectedFeatureIndices.includes(index);
                    return isSelected ? MAP_CONFIG.LINE_WIDTH.SELECTED : (d.properties?.lineWidth || MAP_CONFIG.LINE_WIDTH.DEFAULT);
                },
                getElevation: (d: GeoJSONFeature, { index }: { index: number }) => {
                    const isSelected = selectedFeatureIndices.includes(index);
                    return isSelected ? 60 : (d.properties?.elevation || 30);
                },
                pointRadiusMinPixels: MAP_CONFIG.POINT_RADIUS.MIN,
                pointRadiusMaxPixels: MAP_CONFIG.POINT_RADIUS.MAX,
                autoHighlight: true,
                highlightColor: MAP_CONFIG.COLORS.HIGHLIGHT,
                onClick: handleFeatureClick
            }),
            boundaryGeoJson ? new GeoJsonLayer({
                id: 'boundary-layer',
                data: boundaryGeoJson,
                pickable: true,
                stroked: true,
                filled: false,
                lineWidthScale: 20,
                lineWidthMinPixels: 2,
                getLineColor: MAP_CONFIG.COLORS.BOUNDARY,
                getLineWidth: MAP_CONFIG.LINE_WIDTH.DEFAULT + 1
            }) : null,
            new EditableGeoJsonLayer({
                id: 'editable-geojson-layer',
                data: {
                    type: 'FeatureCollection',
                    features: [...editableFeatures.features]
                },
                mode,
                selectedFeatureIndexes: selectedEditableIndex !== null ? [selectedEditableIndex] : [],
                onEdit: handleUpdate,
                pickable: true,
                autoHighlight: true,
                pointRadiusScale: 2000,
                pointRadiusMinPixels: MAP_CONFIG.POINT_RADIUS.MIN,
                getPointRadius: 0.5,
                getFillColor: layerStyle.fillColor,
                getLineColor: layerStyle.lineColor,
                getLineWidth: layerStyle.lineWidth,
                editHandlePointRadiusScale: 2000,
                editHandlePointRadiusMinPixels: 6,
                getEditHandlePointColor: (h: { type: string }) => [
                    255,
                    h.type === 'existing' ? 140 : 200,
                    h.type === 'existing' ? 0 : 0,
                    255
                ],
            }),
            selectedLocation ? new GeoJsonLayer({
                id: 'selected-location',
                data: {
                    type: 'Feature' as const,
                    geometry: {
                        type: 'Point' as const,
                        coordinates: [
                            parseCoord(selectedLocation.lon),
                            parseCoord(selectedLocation.lat)
                        ]
                    }
                } as GeoJSONFeature,
                pickable: true,
                stroked: true,
                filled: true,
                pointRadiusScale: 1,
                pointRadiusMinPixels: 6,
                getPointRadius: 5,
                getFillColor: MAP_CONFIG.COLORS.LOCATION.FILL,
                getLineColor: MAP_CONFIG.COLORS.LOCATION.LINE,
                getLineWidth: MAP_CONFIG.LINE_WIDTH.DEFAULT
            }) : null
        ];
        return layerArray.filter(Boolean) as MapLayer[];
    }, [
        geoJsonData,
        selectedFeatureIndices,
        boundaryGeoJson,
        editableFeatures,
        mode,
        selectedEditableIndex,
        layerStyle,
        selectedLocation,
        handleFeatureClick,
        handleUpdate,
        parseCoord
    ]);
    return (
        <Box sx={{ position: 'relative', width: '100%', height: '100%' }}>
            <DeckGL
                viewState={viewState}
                onViewStateChange={handleViewStateChange}
                controller={true}
                layers={layers}
                getCursor={({ isDragging }: {
                    isDragging: boolean
                }) => isDragging ? 'grabbing' : mode === ViewMode ? 'default' : 'crosshair'}
            >
                <Map
                    mapLib={maplibregl as never}
                    mapStyle="https://basemaps.cartocdn.com/gl/positron-gl-style/style.json"
                    reuseMaps
                />
            </DeckGL>

            <Box sx={{ position: 'absolute', top: 10, left: 10, zIndex: 1 }}>
                <ButtonGroup orientation="vertical" variant="contained" color="primary" aria-label="drawing tools">
                    <Tooltip title="View Mode" placement="right">
                        <Button onClick={handleView} variant={mode === ViewMode ? 'contained' : 'outlined'}>
                            Pan
                        </Button>
                    </Tooltip>
                    <Tooltip title="Draw Polygon" placement="right">
                        <Button onClick={handleDrawPolygon}
                                variant={mode === DrawPolygonMode ? 'contained' : 'outlined'}>
                            Polygon
                        </Button>
                    </Tooltip>
                    <Tooltip title="Draw Line" placement="right">
                        <Button onClick={handleDrawLine}
                                variant={mode === DrawLineStringMode ? 'contained' : 'outlined'}>
                            Line
                        </Button>
                    </Tooltip>
                    <Tooltip title="Modify Features" placement="right">
                        <Button onClick={handleModify} variant={mode === ModifyMode ? 'contained' : 'outlined'}>
                            Edit
                        </Button>
                    </Tooltip>
                    <Tooltip title="Export GeoJSON" placement="right">
                        <Button onClick={handleExport} color="secondary">
                            Export
                        </Button>
                    </Tooltip>
                </ButtonGroup>
            </Box>

            <Box sx={{
                position: 'absolute',
                top: 10,
                right: 10,
                zIndex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-end',
                gap: 1
            }}>
                <StyleControls style={layerStyle} onStyleChange={setLayerStyle}/>
                <Button
                    variant="contained"
                    color="error"
                    size="small"
                    disabled={editableFeatures.features.length === 0}
                    onClick={handleClearAllDrawings}
                    sx={{ mt: 1, fontWeight: 'bold' }}
                >
                    Clear All Drawings
                </Button>
            </Box>

            <InfoPanel geoJsonData={geoJsonData}/>

            <Snackbar open={snackbar.open} autoHideDuration={6000} onClose={handleSnackbarClose}>
                <Alert onClose={handleSnackbarClose} severity={snackbar.severity} sx={{ width: '100%' }}>
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </Box>
    );
};
