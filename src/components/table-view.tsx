import { useMemo } from 'react';
import { Box, Typography, Paper } from '@mui/material';
import { DataGrid, type GridColDef } from '@mui/x-data-grid';
import type { GeoJSONFeatureCollection, GeoJSONFeature } from "../shared/interfaces";

interface DataRow {
    id: number;
    geometry_type?: string;
    [key: string]: unknown;
}

interface TableViewProps {
    geoJsonData: GeoJSONFeatureCollection | null;
    selectedFeatureIndices?: number[];
    onFeatureSelectionChange?: (indices: number[]) => void;
}

export const TableView: React.FC<TableViewProps> = ({
                                                        geoJsonData,
                                                        selectedFeatureIndices = [],
                                                        onFeatureSelectionChange = () => {
                                                        },
                                                    }) => {
    const { rows, columns } = useMemo(() => {
        if (!geoJsonData || !geoJsonData.features || geoJsonData.features.length === 0) {
            return { rows: [] as DataRow[], columns: [] as GridColDef[] };
        }

        const propertyKeys = new Set<string>();
        geoJsonData.features.forEach((feature: GeoJSONFeature) => {
            if (feature.properties) {
                Object.keys(feature.properties).forEach(key => propertyKeys.add(key));
            }
        });

        propertyKeys.add('geometry_type');

        const columns: GridColDef[] = [{ field: 'id', headerName: 'ID', width: 90 }];
        propertyKeys.forEach((key: string) => {
            columns.push({
                field: key,
                headerName: key.charAt(0).toUpperCase() + key.slice(1).replace(/_/g, ' '),
                width: 150,
                editable: false,
            });
        });

        const rows: DataRow[] = geoJsonData.features.map((feature: GeoJSONFeature, index: number) => {
            const row: DataRow = { id: index };

            if (feature.properties) {
                Object.entries(feature.properties).forEach(([key, value]) => {
                    row[key] = value;
                });
            }

            if (feature.geometry && feature.geometry.type) {
                row.geometry_type = feature.geometry.type;
            }

            return row;
        });

        return { rows, columns };
    }, [geoJsonData]);

    if (!geoJsonData || !geoJsonData.features || geoJsonData.features.length === 0) {
        return (
            <Box sx={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Paper sx={{ p: 3 }}>
                    <Typography variant="h6" color="textSecondary">
                        No data available. Draw features on the map or load GeoJSON data.
                    </Typography>
                </Paper>
            </Box>
        );
    }

    return (
        <Box sx={{ height: '100%', width: '100%' }}>
            <DataGrid
                rows={rows}
                columns={columns}
                initialState={{
                    pagination: {
                        paginationModel: { page: 0, pageSize: 10 },
                    },
                }}
                pageSizeOptions={[5, 10, 25, 50]}
                checkboxSelection
                rowSelectionModel={selectedFeatureIndices}
                onRowSelectionModelChange={(newSelectionModel) => {
                    onFeatureSelectionChange(newSelectionModel as number[]);
                }}
            />
        </Box>
    );
};
