import { useState, useMemo } from 'react';

interface ProfileBrowserState {
    filters: {
        status: string[];
        category: string[];
        risk: string[];
        performance: string[];
    };
    sort: {
        field: string;
        direction: 'asc' | 'desc';
    };
    searchQuery: string;
    viewMode: 'grid' | 'list';
    selectedItems: string[];
    activeTab: string;
}

export function useProfileBrowser(initialMode: 'trader' | 'developer' = 'trader', items: any[] = []) {
    const [state, setState] = useState<ProfileBrowserState>({
        filters: {
            status: [],
            category: [],
            risk: [],
            performance: []
        },
        sort: {
            field: 'recent',
            direction: 'desc'
        },
        searchQuery: '',
        viewMode: 'grid',
        selectedItems: [],
        activeTab: initialMode === 'trader' ? 'items' : 'created'
    });

    const handleFilterChange = (key: string, value: any) => {
        if (key === 'clear') {
            setState(prev => ({
                ...prev,
                filters: {
                    status: [],
                    category: [],
                    risk: [],
                    performance: []
                }
            }));
            return;
        }

        setState(prev => {
            const currentFilters = { ...prev.filters } as any;
            const currentValues = currentFilters[key] || [];

            // Toggle value
            if (currentValues.includes(value)) {
                currentFilters[key] = currentValues.filter((v: string) => v !== value);
            } else {
                currentFilters[key] = [...currentValues, value];
            }

            return { ...prev, filters: currentFilters };
        });
    };

    const handleSortChange = (field: string) => {
        setState(prev => ({
            ...prev,
            sort: {
                field,
                direction: prev.sort.field === field && prev.sort.direction === 'desc' ? 'asc' : 'desc'
            }
        }));
    };

    const handleSearchChange = (query: string) => {
        setState(prev => ({ ...prev, searchQuery: query }));
    };

    const handleViewModeChange = (mode: 'grid' | 'list') => {
        setState(prev => ({ ...prev, viewMode: mode }));
    };

    const handleTabChange = (tab: string) => {
        setState(prev => ({ ...prev, activeTab: tab, selectedItems: [] }));
    };

    const handleSelectionChange = (id: string, selected: boolean) => {
        setState(prev => {
            if (selected) {
                return { ...prev, selectedItems: [...prev.selectedItems, id] };
            } else {
                return { ...prev, selectedItems: prev.selectedItems.filter(item => item !== id) };
            }
        });
    };

    const handleClearSelection = () => {
        setState(prev => ({ ...prev, selectedItems: [] }));
    };

    // Filter and sort logic
    const filteredItems = useMemo(() => {
        let result = [...items];

        // 1. Search
        if (state.searchQuery) {
            const query = state.searchQuery.toLowerCase();
            result = result.filter(item =>
                item.name.toLowerCase().includes(query) ||
                item.creator.toLowerCase().includes(query) ||
                item.category.toLowerCase().includes(query)
            );
        }

        // 2. Filters
        if (state.filters.status.length > 0) {
            result = result.filter(item => state.filters.status.includes(item.status));
        }
        if (state.filters.category.length > 0) {
            result = result.filter(item => state.filters.category.includes(item.category));
        }
        if (state.filters.risk.length > 0) {
            result = result.filter(item => state.filters.risk.includes(item.risk));
        }
        // Performance filter logic would go here (simplified for now)

        // 3. Sort
        result.sort((a, b) => {
            const direction = state.sort.direction === 'asc' ? 1 : -1;

            switch (state.sort.field) {
                case 'performance':
                    return (a.return - b.return) * direction;
                case 'winRate':
                    return ((a.metrics?.winRate || 0) - (b.metrics?.winRate || 0)) * direction;
                case 'capital':
                    return ((a.capital || 0) - (b.capital || 0)) * direction;
                case 'recent':
                default:
                    // Mock date sort or ID sort
                    return (a.id > b.id ? 1 : -1) * direction;
            }
        });

        return result;
    }, [items, state.filters, state.sort, state.searchQuery, state.activeTab]);

    return {
        state,
        filteredItems,
        actions: {
            handleFilterChange,
            handleSortChange,
            handleSearchChange,
            handleViewModeChange,
            handleTabChange,
            handleSelectionChange,
            handleClearSelection
        }
    };
}
