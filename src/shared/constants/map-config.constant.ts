export const MAP_CONFIG = {
    POINT_RADIUS: {
        MIN: 5,
        MAX: 30
    },
    LINE_WIDTH: {
        DEFAULT: 2,
        SELECTED: 3
    },
    COLORS: {
        SELECTED: {
            FILL: [255, 140, 0, 200],
            LINE: [255, 100, 0, 255]
        },
        DEFAULT: {
            FILL: [80, 140, 250, 180],
            LINE: [0, 92, 196, 255]
        },
        HIGHLIGHT: [255, 255, 255, 100],
        BOUNDARY: [30, 150, 240, 200],
        LOCATION: {
            FILL: [255, 80, 80, 180],
            LINE: [255, 255, 255, 200]
        }
    }
} as const;
