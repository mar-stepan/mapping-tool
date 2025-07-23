import React, { useState, useCallback } from 'react';
import {
    TextField,
    Autocomplete,
    CircularProgress,
    Box,
    Typography,
} from '@mui/material';
import { searchLocations } from '../shared/services';
import type { LocationData } from "../shared/interfaces";

interface SearchBarProps {
    onSearchResult: (location: LocationData) => void;
    onLocationReset?: () => void;
}

type DebounceFn = <T extends (...args: unknown[]) => void>(
    func: T,
    delay: number
) => (...args: Parameters<T>) => void;

export const SearchBar: React.FC<SearchBarProps> = ({ onSearchResult, onLocationReset }) => {
    const [inputValue, setInputValue] = useState<string>('');
    const [options, setOptions] = useState<LocationData[]>([]);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    const debounce: DebounceFn = (func, delay) => {
        let timer: ReturnType<typeof setTimeout>;
        return (...args) => {
            clearTimeout(timer);
            timer = setTimeout(() => func(...args), delay);
        };
    };

    const searchLocation = async (query: string): Promise<void> => {
        if (!query || query.length < 3) {
            setOptions([]);
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const searchResults = await searchLocations(query, 5);
            setOptions(searchResults);
        } catch (err: unknown) {
            console.error('Error searching locations:', err);
            setError(err instanceof Error ? err.message : 'Failed to search locations');
            setOptions([]);
        } finally {
            setLoading(false);
        }
    };

    const debouncedSearch = useCallback(
        debounce(searchLocation as (...args: unknown[]) => void, 500),
        []
    );

    const handleInputChange = (_event: React.SyntheticEvent, newInputValue: string): void => {
        setInputValue(newInputValue);
        debouncedSearch(newInputValue);
    };

    const handleOptionSelected = (
        _event: React.SyntheticEvent,
        option: LocationData | null | string,
    ): void => {
        if (option) {
            onSearchResult(option as LocationData);
        } else {
            // User cleared the selection (clicked X button)
            setInputValue('');
            setOptions([]);
            setError(null);
            if (onLocationReset) {
                onLocationReset();
            }
        }

    };

    return (
        <Autocomplete<LocationData, false, false, true>
            id="location-search"
            sx={{ width: 300, bgcolor: 'background.paper', borderRadius: 1 }}
            options={options}
            getOptionLabel={(option: LocationData | string) => typeof option === 'string' ? option : option.display_name || ''}
            isOptionEqualToValue={(option, value) => option.id === value.id}
            renderOption={(props, option) => {
                const { key, ...otherProps } = props;
                return (
                    <Box component="li" key={option.id || String(key)} {...otherProps}>
                        <Box>
                            <Typography variant="body1">{option.display_name}</Typography>
                            <Typography variant="caption" color="text.secondary">
                                {option.type}
                            </Typography>
                        </Box>
                    </Box>
                );
            }}
            filterOptions={(x) => x}
            noOptionsText="No locations found"
            loading={loading}
            loadingText="Searching..."
            onChange={handleOptionSelected}
            onInputChange={handleInputChange}
            inputValue={inputValue}
            freeSolo
            renderInput={(params) => (
                <TextField
                    {...params}
                    label="Search locations"
                    variant="outlined"
                    size="small"
                    error={!!error}
                    helperText={error}
                    InputProps={{
                        ...params.InputProps,
                        endAdornment: (
                            <React.Fragment>
                                {loading ? <CircularProgress color="inherit" size={20}/> : null}
                                {params.InputProps.endAdornment}
                            </React.Fragment>
                        ),
                    }}
                />
            )}
        />
    );
};
