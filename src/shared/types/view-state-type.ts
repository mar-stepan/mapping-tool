export type ViewStateType = {
    longitude: number;
    latitude: number;
    zoom: number;
    pitch: number;
    bearing: number;
    transitionDuration?: number;
    transitionInterpolator?: unknown;
    transitionEasing?: (t: number) => number;
};
