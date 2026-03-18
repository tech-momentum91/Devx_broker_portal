// use-column-config.js
import { useState, useEffect, useCallback, useRef } from 'react';
import { FIRST_COLUMN_NAME } from '@/constants/constants';

/**
 * Simplified hook for managing table column configuration
 * Handles visibility, ordering, and localStorage persistence
 */
export const useColumnConfig = (
  tableId,
  defaultColumns,
  persistCall = function () {},
  getCall = () => {},
  options = {},
) => {
  const { autoSave = true, debounce = 500 } = options;

  // Normalize default columns: ensure visible is boolean (defaults to true)
  const normalizeColumn = (col) => ({
    ...col,
    visible: col.visible !== false, // Default to true unless explicitly false
  });

  // Helper: build the minimal payload we persist to the backend
  const buildPersistPayload = (cols) =>
    cols.map((col, index) => ({
      id: col.id,
      visible: col.visible,
      order: index,
      label: col.label,
      enableHiding: col.enableHiding,
    }));

  // Helper: shallow equality for persisted configs to avoid redundant saves
  const areConfigsEqual = (a, b) => {
    if (!a || !b || a.length !== b.length) return false;
    for (let i = 0; i < a.length; i += 1) {
      const ca = a[i];
      const cb = b[i];
      if (
        ca.id !== cb.id ||
        ca.visible !== cb.visible ||
        ca.order !== cb.order ||
        ca.label !== cb.label ||
        ca.enableHiding !== cb.enableHiding
      ) {
        return false;
      }
    }
    return true;
  };

  const [columns, setColumns] = useState(() => defaultColumns.map(normalizeColumn));
  const [isLoading, setIsLoading] = useState(true);
  const saveTimeoutRef = useRef(null);
  const isInitialMount = useRef(true);
  const lastSavedConfigRef = useRef(null);

  // Determine pinned column ID (first match from FIRST_COLUMN_NAME)
  const pinnedColumnId = useRef(null);
  useEffect(() => {
    for (const key of FIRST_COLUMN_NAME ?? []) {
      if (columns.some((c) => c.id === key)) {
        pinnedColumnId.current = key;
        break;
      }
    }
  }, [columns]);

  // Load saved configuration
  useEffect(() => {
    let isMounted = true;

    const loadConfig = async () => {
      if (!tableId) {
        if (isMounted) setIsLoading(false);
        return;
      }

      try {
        const saved = await getCall();

        if (isMounted && saved) {
          let savedConfig = saved;

          // Parse if string (legacy or stringified response)
          if (typeof saved === 'string') {
            try {
              savedConfig = JSON.parse(saved);
            } catch (error) {
              console.error('Failed to parse saved column config:', error);
            }
          }

          // Handle response wrapping: { columns: [...] } or [...]
          const columnsData = Array.isArray(savedConfig) ? savedConfig : savedConfig?.columns || [];

          if (Array.isArray(columnsData) && columnsData.length > 0) {
            const savedMap = new Map(columnsData.map((col) => [col.id, col]));

            // Merge saved config with defaults
            // Always use label from defCol (API labels) to ensure consistency with table headers
            const merged = defaultColumns.map((defCol, index) => {
              const saved = savedMap.get(defCol.id);
              const isPinned = FIRST_COLUMN_NAME?.includes(defCol.id);
              return {
                ...defCol,
                label: defCol.label, // Always use current label from API/defaults, not saved label
                visible: isPinned ? true : (saved?.visible ?? defCol.visible !== false),
                order: saved?.order ?? index,
              };
            });

            merged.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
            setColumns(merged);
            // Treat loaded config as already saved to avoid an immediate redundant persist
            lastSavedConfigRef.current = buildPersistPayload(merged);
          } else {
            // No saved config, treat defaults as the initial "saved" baseline
            lastSavedConfigRef.current = buildPersistPayload(defaultColumns.map(normalizeColumn));
          }
        }
      } catch (error) {
        console.error('Failed to load column config:', error);
      } finally {
        if (isMounted) {
          setIsLoading(false);
          isInitialMount.current = false;
        }
      }
    };

    loadConfig();

    return () => {
      isMounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tableId]); // Only reload if tableId changes

  // Save to localStorage
  const save = useCallback(
    (cols) => {
      if (!tableId) return;

      const saveFunc = async () => {
        try {
          const toSave = buildPersistPayload(cols);

          // Skip persist if nothing actually changed
          if (areConfigsEqual(lastSavedConfigRef.current, toSave)) {
            return;
          }

          lastSavedConfigRef.current = toSave;
          console.log('persist call', persistCall);
          await persistCall(toSave);
        } catch (error) {
          console.error('Failed to save column config:', error);
        }
      };

      if (debounce && autoSave) {
        clearTimeout(saveTimeoutRef.current);
        saveTimeoutRef.current = setTimeout(saveFunc, debounce);
      } else {
        saveFunc();
      }
    },
    [tableId, debounce, autoSave, persistCall],
  );

  // Auto-save on changes
  useEffect(() => {
    if (!isInitialMount.current && autoSave) {
      save(columns);
    }
  }, [columns, autoSave, save]);

  // Actions
  const reorderColumns = useCallback((startIndex, endIndex) => {
    setColumns((previous) => {
      const result = [...previous];
      const [moved] = result.splice(startIndex, 1);
      result.splice(endIndex, 0, moved);
      return result;
    });
  }, []);

  const toggleColumnVisibility = useCallback((columnId) => {
    // Prevent toggling pinned column
    if (FIRST_COLUMN_NAME?.includes(columnId)) return;

    setColumns((previous) =>
      previous.map((col) => (col.id === columnId ? { ...col, visible: !col.visible } : col)),
    );
  }, []);

  const showAllColumns = useCallback(() => {
    setColumns((previous) =>
      previous.map((col) => ({
        ...col,
        visible: col.enableHiding === false ? col.visible : true,
      })),
    );
  }, []);

  const hideAllColumns = useCallback(() => {
    setColumns((previous) =>
      previous.map((col) => {
        const isPinned = FIRST_COLUMN_NAME?.includes(col.id);
        return {
          ...col,
          visible: col.enableHiding === false || isPinned ? col.visible : false,
        };
      }),
    );
  }, []);

  const resetToDefault = useCallback(() => {
    setColumns(defaultColumns.map(normalizeColumn));
    if (tableId) {
      localStorage.removeItem(`column-config-${tableId}`);
    }
  }, [defaultColumns, tableId]);

  // Ensure pinned column stays visible
  useEffect(() => {
    if (!pinnedColumnId.current) return;
    setColumns((prev) =>
      prev.map((col) => (col.id === pinnedColumnId.current ? { ...col, visible: true } : col)),
    );
  }, []);

  // Cleanup
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  return {
    columns,
    visibleColumns: columns.filter((col) => col.visible),
    isLoading,
    setColumns,
    reorderColumns,
    toggleColumnVisibility,
    showAllColumns,
    hideAllColumns,
    resetToDefault,
  };
};
