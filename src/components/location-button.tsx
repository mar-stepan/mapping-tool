import { Button, Tooltip, CircularProgress } from '@mui/material';
import LocationOnIcon from '@mui/icons-material/LocationOn';

interface LocationButtonProps {
    onLocationRequested: () => Promise<void>;
    loading: boolean;
}

export const LocationButton = ({ onLocationRequested, loading }: LocationButtonProps) => {

    const handleClick = async (): Promise<void> => {
        try {
            await onLocationRequested();
        } catch (error) {
            console.error('Location request failed:', error);
        }
    };

    return (
        <Tooltip title="Use my current location">
            <Button
                color="secondary"
                variant="contained"
                onClick={handleClick}
                disabled={loading}
                startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <LocationOnIcon />}
                sx={{ ml: 1 }}
            >
                My Location
            </Button>
        </Tooltip>
    );
};
