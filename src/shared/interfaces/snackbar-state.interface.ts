import type { AlertColor } from "@mui/material";

export interface SnackbarState {
    open: boolean;
    message: string;
    severity: AlertColor;
}
