import { useState, useCallback } from 'react';
import { DrawPolygonMode, DrawLineStringMode, ModifyMode, ViewMode } from '@deck.gl-community/editable-layers';
import type { SnackbarState } from '../interfaces';

export const useDrawingMode = (
    setSnackbar: (snackbar: SnackbarState) => void,
    onFeatureSelectionChange: (indices: number[]) => void,
    selectedFeatureIndices: number[]
) => {
    const [mode, setMode] = useState(() => ViewMode);

    const handleDrawPolygon = useCallback(() => {
        setMode(() => DrawPolygonMode);
        setSnackbar({
            open: true,
            message: 'Draw Polygon: Click to add points, double-click to finish',
            severity: 'info'
        });
    }, [setSnackbar]);

    const handleDrawLine = useCallback(() => {
        setMode(() => DrawLineStringMode);
        setSnackbar({
            open: true,
            message: 'Draw Line: Click to add points, double-click to finish',
            severity: 'info'
        });
    }, [setSnackbar]);

    const handleModify = useCallback(() => {
        setMode(() => ModifyMode);
        setSnackbar({
            open: true,
            message: 'Modify Mode: Click and drag vertices to edit features',
            severity: 'info'
        });
    }, [setSnackbar]);

    const handleView = useCallback(() => {
        setMode(() => ViewMode);
        if (selectedFeatureIndices.length > 0 && typeof onFeatureSelectionChange === 'function') {
            onFeatureSelectionChange([]);
        }
    }, [onFeatureSelectionChange, selectedFeatureIndices]);

    return {
        mode,
        handleDrawPolygon,
        handleDrawLine,
        handleModify,
        handleView
    };
};
