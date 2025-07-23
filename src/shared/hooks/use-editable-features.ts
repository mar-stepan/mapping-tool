import { useState, useEffect, useCallback, useRef } from 'react';
import type { GeoJSONFeatureCollection, SnackbarState } from '../interfaces';

type EditContext = {
    featureIndexes?: number[];
    editHandle?: unknown;
    screenCoords?: number[];
};

type EditEvent = {
    editType: string;
    updatedData: GeoJSONFeatureCollection;
    editContext?: EditContext;
};

export const useEditableFeatures = (
    initialEditableFeatures: GeoJSONFeatureCollection,
    onDrawnFeaturesChange: (features: GeoJSONFeatureCollection) => void,
    onFeatureSelectionChange: (indices: number[]) => void,
    setSnackbar: (snackbar: SnackbarState) => void
) => {
    const [editableFeatures, setEditableFeatures] = useState<GeoJSONFeatureCollection>(initialEditableFeatures);
    const [selectedEditableIndex, setSelectedEditableIndex] = useState<number | null>(null);

    const isUpdatingFromProps = useRef(false);

    useEffect(() => {
        if (initialEditableFeatures && !isUpdatingFromProps.current) {
            const currentIds = editableFeatures.features.map(f => JSON.stringify(f.geometry)).join(',');
            const newIds = initialEditableFeatures.features.map(f => JSON.stringify(f.geometry)).join(',');

            if (currentIds !== newIds ||
                editableFeatures.features.length !== initialEditableFeatures.features.length) {
                isUpdatingFromProps.current = true;
                setEditableFeatures({
                    type: 'FeatureCollection',
                    features: [...initialEditableFeatures.features]
                });

                setTimeout(() => {
                    isUpdatingFromProps.current = false;
                }, 0);
            }
        }
    }, [initialEditableFeatures]);

    useEffect(() => {
        if (!isUpdatingFromProps.current) {
            onDrawnFeaturesChange(editableFeatures);
        }
    }, [editableFeatures, onDrawnFeaturesChange]);

    const handleUpdate = useCallback(({ editType, updatedData, editContext }: EditEvent) => {
        setEditableFeatures({
            type: 'FeatureCollection',
            features: [...updatedData.features]
        });

        if (editType === 'addFeature') {
            setSnackbar({
                open: true,
                message: 'Feature added successfully',
                severity: 'success'
            });
        } else if (editType === 'finishMovePosition') {
            setSnackbar({
                open: true,
                message: 'Feature position updated',
                severity: 'info'
            });
        }

        if (editContext && editContext.featureIndexes && editContext.featureIndexes.length) {
            const editableIndex = editContext.featureIndexes[0];
            setSelectedEditableIndex(editableIndex);
            if (typeof onFeatureSelectionChange === 'function') {
                onFeatureSelectionChange([editableIndex]);
            }
        }
    }, [onFeatureSelectionChange, setSnackbar]);

    const handleClearAllDrawings = useCallback(() => {
        const currentFeatureCount = editableFeatures.features.length;

        if (currentFeatureCount === 0) {
            setSnackbar({
                open: true,
                message: 'No drawings to clear',
                severity: 'info'
            });
            return;
        }

        setEditableFeatures({
            type: 'FeatureCollection' as const,
            features: []
        });

        setTimeout(() => {
            onFeatureSelectionChange([]);
            setSnackbar({
                open: true,
                message: `Cleared all drawings (${currentFeatureCount} features)`,
                severity: 'success'
            });
        }, 0);
    }, [editableFeatures.features.length, onFeatureSelectionChange, setSnackbar]);

    return {
        editableFeatures,
        selectedEditableIndex,
        setSelectedEditableIndex,
        handleUpdate,
        handleClearAllDrawings
    };
};
