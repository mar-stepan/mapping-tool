import { Paper, Typography, Slider, Box, Grid } from '@mui/material';
import type { ChangeEvent } from "react";

// Define types for RGBA values
type RGBAColor = [number, number, number, number];

// Define style object interface
interface StyleSettings {
    fillColor: RGBAColor;
    lineColor: RGBAColor;
    lineWidth: number;
}

// Props for the StyleControls component
interface StyleControlsProps {
    style: StyleSettings;
    onStyleChange: (newStyle: StyleSettings) => void;
}

// Convert RGB array to hex string
const rgbaToHex = (rgba: RGBAColor): string => {
    return '#' + rgba.slice(0, 3).map(x => {
        const hex = x.toString(16);
        return hex.length === 1 ? '0' + hex : hex;
    }).join('');
};

// Convert hex string to RGB array
const hexToRgba = (hex: string, alpha = 255): RGBAColor => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? [
        parseInt(result[1], 16),
        parseInt(result[2], 16),
        parseInt(result[3], 16),
        alpha
    ] : [0, 0, 0, alpha];
};

const StyleControls = ({ style, onStyleChange }: StyleControlsProps) => {
    const handleFillColorChange = (event: ChangeEvent<HTMLInputElement>) => {
        const newColor = hexToRgba(event.target.value, style.fillColor[3]);
        onStyleChange({
            ...style,
            fillColor: newColor
        });
    };

    const handleFillOpacityChange = (_event: Event, newValue: number | number[]) => {
        onStyleChange({
            ...style,
            fillColor: [
                style.fillColor[0],
                style.fillColor[1],
                style.fillColor[2],
                newValue as number
            ]
        });
    };

    const handleLineColorChange = (event: ChangeEvent<HTMLInputElement>) => {
        const newColor = hexToRgba(event.target.value, style.lineColor[3]);
        onStyleChange({
            ...style,
            lineColor: newColor
        });
    };

    const handleLineOpacityChange = (_event: Event, newValue: number | number[]) => {
        onStyleChange({
            ...style,
            lineColor: [
                style.lineColor[0],
                style.lineColor[1],
                style.lineColor[2],
                newValue as number
            ]
        });
    };

    const handleLineWidthChange = (_event: Event, newValue: number | number[]) => {
        onStyleChange({
            ...style,
            lineWidth: newValue as number
        });
    };

    return (
        <Paper sx={{ p: 2, minWidth: 240 }}>
            <Typography variant="h6" gutterBottom>
                Style Settings
            </Typography>

            <Grid container spacing={2}>
                <Grid item xs={12}>
                    <Typography gutterBottom>Fill Color</Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <input
                            type="color"
                            value={rgbaToHex(style.fillColor)}
                            onChange={handleFillColorChange}
                            style={{ marginRight: '8px', width: '40px', height: '40px' }}
                        />
                        <Box sx={{ flexGrow: 1 }}>
                            <Typography id="fill-opacity-slider" gutterBottom>Opacity</Typography>
                            <Slider
                                value={style.fillColor[3]}
                                onChange={handleFillOpacityChange}
                                aria-labelledby="fill-opacity-slider"
                                min={0}
                                max={255}
                                valueLabelDisplay="auto"
                            />
                        </Box>
                    </Box>
                </Grid>

                <Grid item xs={12}>
                    <Typography gutterBottom>Line Color</Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <input
                            type="color"
                            value={rgbaToHex(style.lineColor)}
                            onChange={handleLineColorChange}
                            style={{ marginRight: '8px', width: '40px', height: '40px' }}
                        />
                        <Box sx={{ flexGrow: 1 }}>
                            <Typography id="line-opacity-slider" gutterBottom>Opacity</Typography>
                            <Slider
                                value={style.lineColor[3]}
                                onChange={handleLineOpacityChange}
                                aria-labelledby="line-opacity-slider"
                                min={0}
                                max={255}
                                valueLabelDisplay="auto"
                            />
                        </Box>
                    </Box>
                </Grid>

                <Grid item xs={12}>
                    <Typography id="line-width-slider" gutterBottom>Line Width</Typography>
                    <Slider
                        value={style.lineWidth}
                        onChange={handleLineWidthChange}
                        aria-labelledby="line-width-slider"
                        min={1}
                        max={10}
                        step={0.5}
                        valueLabelDisplay="auto"
                    />
                </Grid>
            </Grid>
        </Paper>
    );
};

export default StyleControls;
