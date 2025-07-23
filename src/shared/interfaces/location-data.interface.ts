export interface LocationData {
    id: string | number;
    display_name: string;
    lat: number;
    lon: number;
    type: string;
    importance: number;
    boundingbox: string[] | number[];
}
