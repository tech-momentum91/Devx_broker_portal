import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RiSearchLine, RiCheckLine, RiCloseLine } from 'react-icons/ri';
import * as Dropdown from '@/components/ui/dropdown';
import * as Avatar from '@/components/ui/avatar';
import * as AvatarGroup from '@/components/ui/avatar-group';
import * as Input from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { searchUsers, selectUserSearch } from '@/redux/userSlice';
import { useDebounce } from '@/hooks/use-debounce';
import * as Button from '@/components/ui/button';
import * as Tooltip from '@/components/ui/tooltip';
// Cache for user data to preserve names and images
const userDataCache = new Map();

// Cache for search results with TTL (Time To Live)
const searchResultsCache = new Map();
const CACHE_TTL = 2 * 60 * 1000; // 2 minutes in milliseconds

// Helper to get cache key for search
const getSearchCacheKey = (searchQuery, names, internalOnly = false) => {
  const namesKey = names && names.length > 0 ? names.sort().join(',') : 'no-names';
  return `${searchQuery || ''}::${namesKey}::${internalOnly ? 'internal' : 'all'}`;
};

// Helper to check if cache entry is still valid
const isCacheValid = (cacheEntry) => {
  if (!cacheEntry) return false;
  const now = Date.now();
  return now - cacheEntry.timestamp < CACHE_TTL;
};

// Helper to clean old cache entries
const cleanOldCacheEntries = () => {
  const now = Date.now();
  for (const [key, entry] of searchResultsCache.entries()) {
    if (now - entry.timestamp >= CACHE_TTL) {
      searchResultsCache.delete(key);
    }
  }
};

const AssigneeMultiSelect = ({
  value = [],
  onChange,
  onBlur,
  disabled = false,
  readonly = false,
  placeholder = 'Select assignees',
  maxVisibleAvatars = 4,
  size = 'medium',
  hasError = false,
  variant = 'borderless',
  internalOnly = false,
}) => {
  const dispatch = useDispatch();
  const userSearch = useSelector(selectUserSearch);

  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [assignees, setAssignees] = useState([]); // Selected users fetched with names
  const [assigneesLoading, setAssigneesLoading] = useState(false);

  // Track the value when dropdown was opened
  const valueWhenOpenedRef = useRef([]);
  // Track current draft selection
  const [draftSelection, setDraftSelection] = useState([]);
  // Ref for input field to focus when dropdown opens
  const inputRef = useRef(null);

  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  // Extract user IDs from value prop (handles both strings and objects)
  const valueIds = useMemo(() => {
    if (!value) return [];
    const array = Array.isArray(value) ? value : [value].filter(Boolean);
    return array.map((v) => {
      if (typeof v === 'string') return v;
      if (v && typeof v === 'object') return v.value || v.email || v.name || v;
      return String(v);
    });
  }, [value]);

  // Convert value to display options with full data (name, image, etc.)
  // Uses cache to preserve user data even if API returns just emails
  const valueOptions = useMemo(() => {
    if (!value) return [];
    const array = Array.isArray(value) ? value : [value].filter(Boolean);
    return array
      .map((v) => {
        if (typeof v === 'string') {
          // Check cache first
          const cached = userDataCache.get(v);
          if (cached) {
            return cached;
          }
          // Create basic object and cache it
          const basic = {
            value: v,
            label: v,
            email: v,
            name: v,
            image: null,
            user_role: null,
            roles: [],
          };
          userDataCache.set(v, basic);
          return basic;
        }
        if (v && typeof v === 'object') {
          const userValue = v.value || v.email || v.name || v;
          const userData = {
            value: userValue,
            label: v.label || v.full_name || v.name || v.email || v.value || 'User',
            email: v.email || userValue,
            name: v.name || v.value || userValue,
            image: v.image || v.avatar || v.user_image || null,
            user_role: v.user_role || null,
            roles: v.roles || (v.user_role ? [v.user_role] : v.role ? [v.role] : []), // Support both formats
          };
          // Cache the full user data
          userDataCache.set(userValue, userData);
          return userData;
        }
        return null;
      })
      .filter(Boolean);
  }, [value]);

  // Current selection for display - use draft when open, valueIds when closed
  const currentSelection = open ? draftSelection : valueIds;

  // Extract selected user names/IDs for names payload (API expects user IDs/names)
  const selectedUserNames = useMemo(() => {
    if (!valueOptions || valueOptions.length === 0) return [];
    // API expects user names (which are the user IDs in Frappe)
    return valueOptions.map((opt) => opt.name || opt.value).filter(Boolean);
  }, [valueOptions]);

  // Focus input when dropdown opens
  useEffect(() => {
    if (!open) return;
    // Delay so dropdown content is mounted and inputRef.current is set
    const timer = setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus();
      }
    }, 100);
    return () => clearTimeout(timer);
  }, [open]);

  // Fetch assignees (selected users) when dropdown opens and there are selected users
  useEffect(() => {
    if (open && selectedUserNames.length > 0 && debouncedSearchQuery.trim().length === 0) {
      setAssigneesLoading(true);
      dispatch(
        searchUsers({
          searchQuery: '',
          names: selectedUserNames,
          limit: selectedUserNames.length,
          updateSearchData: false, // Don't overwrite userSearch.data with assignees
          internal_only: internalOnly,
        }),
      )
        .then((result) => {
          if (searchUsers.fulfilled.match(result)) {
            const formattedAssignees = result.payload.users || [];
            // Cache assignees
            formattedAssignees.forEach((user) => {
              userDataCache.set(user.value, user);
            });
            setAssignees(formattedAssignees);
          } else {
            setAssignees([]);
          }
          setAssigneesLoading(false);
        })
        .catch((error) => {
          console.error('Failed to fetch assignees:', error);
          setAssignees([]);
          setAssigneesLoading(false);
        });
    } else {
      setAssignees([]);
      setAssigneesLoading(false);
    }
  }, [open, selectedUserNames, debouncedSearchQuery, dispatch, internalOnly]);

  // Fetch initial users when dropdown opens, or search when typing
  useEffect(() => {
    if (open) {
      const hasSearchQuery = debouncedSearchQuery.trim().length > 0;
      const names = []; // Don't pass names when searching or fetching people list

      // Clean old cache entries periodically
      cleanOldCacheEntries();

      // Check cache first
      const cacheKey = getSearchCacheKey(debouncedSearchQuery, names, internalOnly);
      const cachedResult = searchResultsCache.get(cacheKey);

      if (isCacheValid(cachedResult)) {
        // Use cached result - manually update Redux state by dispatching fulfilled action
        // This bypasses the API call
        dispatch({
          type: 'user/searchUsers/fulfilled',
          payload: {
            searchQuery: debouncedSearchQuery || '',
            users: cachedResult.data,
            updateSearchData: true, // Cache is for people list, so update search data
          },
        });
        return;
      }

      // Cache miss or expired - make API call
      const searchPromise = hasSearchQuery
        ? dispatch(
          searchUsers({
            searchQuery: debouncedSearchQuery,
            limit: 50,
            names: [], // Don't pass names when searching
            internal_only: internalOnly,
          }),
        )
        : dispatch(
          searchUsers({
            searchQuery: '',
            limit: 10,
            names: [], // Fetch general people list
            internal_only: internalOnly,
          }),
        );

      // Cache the result after API call completes
      searchPromise.then((result) => {
        // Check if the action was fulfilled (not rejected)
        if (searchUsers.fulfilled.match(result)) {
          searchResultsCache.set(cacheKey, {
            data: result.payload.users || [],
            timestamp: Date.now(),
          });
        }
      });
    }
  }, [debouncedSearchQuery, dispatch, open, internalOnly]);

  // Helper to convert IDs to options (using cache when available)
  const idsToOptions = useCallback(
    (ids) => {
      return ids.map((id) => {
        // Check cache first
        const cached = userDataCache.get(id);
        if (cached) {
          return cached;
        }
        // Check valueOptions for full data
        const fromValue = valueOptions.find((opt) => opt.value === id);
        if (fromValue) {
          return fromValue;
        }
        // Create basic option and cache it
        const basic = {
          value: id,
          label: id,
          email: id,
          name: id,
          image: null,
          user_role: null,
          roles: [],
        };
        userDataCache.set(id, basic);
        return basic;
      });
    },
    [valueOptions],
  );

  // All assignees - merge API assignees with locally selected users
  const allAssignees = useMemo(() => {
    if (searchQuery.trim().length > 0) return []; // Don't show assignees section when searching

    const assigneesMap = new Map();
    const selectedIds = open ? draftSelection : valueIds;

    // Add assignees from API
    assignees.forEach((assignee) => {
      assigneesMap.set(assignee.value, assignee);
    });

    // Add locally selected users that aren't in assignees yet
    if (selectedIds.length > 0) {
      const localSelectedOptions = idsToOptions(selectedIds);
      localSelectedOptions.forEach((opt) => {
        if (!assigneesMap.has(opt.value)) {
          assigneesMap.set(opt.value, opt);
        }
      });
    }

    return [...assigneesMap.values()];
  }, [assignees, draftSelection, valueIds, open, searchQuery, idsToOptions]);

  // People options (from search results or initial users)
  const peopleOptions = useMemo(() => {
    if (!userSearch.data || userSearch.data.length === 0) return [];

    const hasSearchQuery = searchQuery.trim().length > 0;
    const selectedIds = open ? draftSelection : valueIds;

    // Filter out selected users from people list when not searching
    if (!hasSearchQuery && selectedIds.length > 0) {
      return userSearch.data.filter((opt) => !selectedIds.includes(opt.value));
    }

    return userSearch.data;
  }, [userSearch.data, searchQuery, open, draftSelection, valueIds]);

  // Handle dropdown open
  const handleOpen = useCallback(() => {
    if (disabled || readonly) return;
    // Store current value when opening
    valueWhenOpenedRef.current = [...valueIds];
    // Initialize draft with current value
    setDraftSelection([...valueIds]);
    setOpen(true);
  }, [valueIds, disabled, readonly]);

  // Handle dropdown close
  const handleClose = useCallback(() => {
    setOpen(false);
    setSearchQuery('');
    setAssignees([]);

    // Compare draft with value when opened
    const openedSorted = [...valueWhenOpenedRef.current].sort().join(',');
    const draftSorted = [...draftSelection].sort().join(',');
    const hasChanged = openedSorted !== draftSorted;

    // Call onBlur if there are changes
    if (hasChanged && onBlur) {
      onBlur(draftSelection);
    }

    // Reset draft
    setDraftSelection([]);
  }, [draftSelection, onBlur]);

  // Handle toggle - update draft selection
  const handleToggle = useCallback(
    (optionValue) => {
      if (disabled || readonly) return;

      const isSelected = draftSelection.includes(optionValue);
      const newSelection = isSelected
        ? draftSelection.filter((v) => v !== optionValue)
        : [...draftSelection, optionValue];

      setDraftSelection(newSelection);
      // Call onChange for optimistic UI update
      onChange?.(newSelection);
    },
    [draftSelection, onChange, disabled, readonly],
  );

  // Handle remove assignee - remove directly from valueIds
  const handleRemoveAssignee = useCallback(
    (optionValue, e) => {
      if (disabled || readonly) return;
      e.preventDefault();
      e.stopPropagation(); // Prevent opening dropdown

      const newSelection = valueIds.filter((v) => v !== optionValue);

      // Update local state immediately
      onChange?.(newSelection);

      // Trigger onBlur to persist the change via API
      if (onBlur) {
        onBlur(newSelection);
      }
    },
    [valueIds, onChange, onBlur, disabled, readonly],
  );

  // Handle mouse down to prevent dropdown opening
  const handleRemoveMouseDown = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  // Display options for trigger (always use valueOptions for display - they have full data)
  const displayOptions = valueOptions.filter((opt) => valueIds.includes(opt.value));

  return (
    <Dropdown.Root open={open} onOpenChange={(isOpen) => (isOpen ? handleOpen() : handleClose())}>
      <Dropdown.Trigger asChild>
        <Button.Root
          {...(variant === 'borderless'
            ? {
              variant: 'neutral',
              mode: 'ghost',
            }
            : {
              variant: 'neutral',
              mode: 'stroke',
            })}
          type='button'
          disabled={disabled}
          className={cn(
            'w-full text-left justify-start',
            disabled && 'cursor-not-allowed opacity-50',
            readonly && 'cursor-not-allowed hover:bg-transparent',
            hasError && 'ring-error-base',
          )}
          size={size}
          hasError={hasError}
          {...(readonly && {
            onClick: (e) => {
              e.preventDefault();
              e.stopPropagation();
            },
          })}
        >
          {displayOptions.length === 0 ? (
            <span className='text-paragraph-sm text-text-soft-400'>{placeholder}</span>
          ) : (
            <AvatarGroup.Root size={24}>
              {displayOptions.slice(0, maxVisibleAvatars).map((opt, index) => {
                const name = opt.label || opt.name || opt.email || opt.value || 'User';
                const { image } = opt;
                return (
                  <Tooltip.Root size='xsmall' key={opt.value || index}>
                    <Tooltip.Trigger asChild>
                      <Avatar.Root size={24} color='gray' className='ring-0 group/avatar relative'>
                        {image ? (
                          <Avatar.Image src={image} alt={name} />
                        ) : (
                          <span className='text-label-xs'>{name.charAt(0).toUpperCase()}</span>
                        )}
                        {!disabled && !readonly && (
                          <button
                            type='button'
                            onClick={(e) => handleRemoveAssignee(opt.value, e)}
                            onMouseDown={handleRemoveMouseDown}
                            onPointerDown={handleRemoveMouseDown}
                            className={cn(
                              'absolute -top-1 -right-1 size-4 rounded-full bg-error-base text-white',
                              'flex items-center justify-center',
                              'opacity-0 group-hover/avatar:opacity-100 transition-opacity duration-200',
                              'hover:bg-error-600 focus:outline-none focus:ring-2 focus:ring-error-base focus:ring-offset-1',
                              'cursor-pointer z-10',
                            )}
                            aria-label={`Remove ${name}`}
                          >
                            <RiCloseLine className='size-2.5' />
                          </button>
                        )}
                      </Avatar.Root>
                    </Tooltip.Trigger>
                    {name && (
                      <Tooltip.Content size='xsmall' side='bottom'>
                        {name}
                      </Tooltip.Content>
                    )}
                  </Tooltip.Root>
                );
              })}
              {displayOptions.length > maxVisibleAvatars && (
                <AvatarGroup.Overflow size={24}>
                  +{displayOptions.length - maxVisibleAvatars}
                </AvatarGroup.Overflow>
              )}
            </AvatarGroup.Root>
          )}
        </Button.Root>
      </Dropdown.Trigger>
      <Dropdown.Content
        className='w-[320px] p-0 gap-0 min-h-[200px] max-h-[300px] overflow-y-auto'
        align='start'
      >
        <div className='p-2 border-b border-stroke-soft-200'>
          <Input.Root size='small'>
            <Input.Wrapper>
              <Input.Icon as={RiSearchLine} />
              <Input.Input
                ref={inputRef}
                placeholder='Search users...'
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                autoFocus
                autoComplete='off'
                autoCorrect='off'
                autoCapitalize='off'
                spellCheck='false'
              />
            </Input.Wrapper>
          </Input.Root>
        </div>
        <div className='flex flex-col h-full flex-1 max-h-[300px] overflow-y-auto'>
          {userSearch.status === 'loading' || assigneesLoading ? (
            <div className='flex-1 flex items-center justify-center px-4 py-8 text-center grow'>
              <p className='text-paragraph-sm text-text-soft-400'>
                {searchQuery.trim().length > 0 ? 'Searching...' : 'Loading users...'}
              </p>
            </div>
          ) : (
            <>
              {/* Assignees Section */}
              {allAssignees.length > 0 && searchQuery.trim().length === 0 && (
                <div className='px-2 pt-2'>
                  <Dropdown.Label className='px-2 py-1.5'>Assignees</Dropdown.Label>
                  <div className='space-y-1'>
                    {allAssignees.map((option) => {
                      const isSelected = currentSelection.includes(option.value);
                      const name =
                        option.label || option.name || option.email || option.value || 'User';
                      const { image, user_role } = option;
                      return (
                        <div
                          key={option.value}
                          onClick={() => handleToggle(option.value)}
                          className={cn(
                            'group/item relative cursor-pointer select-none rounded-lg p-2 text-paragraph-sm text-text-strong-950 outline-none',
                            'flex items-center gap-2',
                            'transition duration-200 ease-out',
                            'focus:outline-none',
                            isSelected && 'bg-bg-weak-50',
                          )}
                          role='button'
                          tabIndex={0}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault();
                              handleToggle(option.value);
                            }
                          }}
                        >
                          <Avatar.Root size={32} color='gray'>
                            {image ? (
                              <Avatar.Image src={image} alt={name} />
                            ) : (
                              <span className='text-label-xs'>{name.charAt(0).toUpperCase()}</span>
                            )}
                          </Avatar.Root>
                          <div className='flex flex-col flex-1'>
                            <span className='text-paragraph-sm text-text-main-900'>{name}</span>
                            {user_role && (
                              <span className='text-label-xs text-text-soft-400'>{user_role}</span>
                            )}
                          </div>
                          {isSelected && (
                            <RiCheckLine className='size-4 text-text-main-900 shrink-0' />
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* People Section */}
              <div
                className={cn(
                  'px-2 flex flex-1 grow flex-col',
                  allAssignees.length > 0 && searchQuery.trim().length === 0 && 'pt-2',
                )}
              >
                {peopleOptions.length > 0 &&
                  allAssignees.length > 0 &&
                  searchQuery.trim().length === 0 && (
                  <Dropdown.Label className='px-2 py-1.5'>People</Dropdown.Label>
                )}
                {peopleOptions.length === 0 ? (
                  <div className='flex-1 flex items-center justify-center px-4 py-8 text-center grow'>
                    <p className='text-paragraph-sm text-text-soft-400'>
                      {searchQuery.trim().length > 0 ? 'No users found' : 'No users available'}
                    </p>
                  </div>
                ) : (
                  <div className='space-y-1'>
                    {peopleOptions.map((option) => {
                      const isSelected = currentSelection.includes(option.value);
                      const name =
                        option.label || option.name || option.email || option.value || 'User';
                      const { image, user_role, roles } = option;
                      // Prefer user_role over roles array
                      const roleDisplay =
                        user_role || (roles && roles.length > 0 ? roles[0] : null);
                      return (
                        <div
                          key={option.value}
                          onClick={() => handleToggle(option.value)}
                          className={cn(
                            'group/item relative cursor-pointer select-none rounded-lg p-2 text-paragraph-sm text-text-strong-950 outline-none',
                            'flex items-center gap-2',
                            'transition duration-200 ease-out',
                            'focus:outline-none',
                            isSelected && 'bg-bg-weak-50',
                          )}
                          role='button'
                          tabIndex={0}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault();
                              handleToggle(option.value);
                            }
                          }}
                        >
                          <Avatar.Root size={32} color='gray'>
                            {image ? (
                              <Avatar.Image src={image} alt={name} />
                            ) : (
                              <span className='text-label-xs'>{name.charAt(0).toUpperCase()}</span>
                            )}
                          </Avatar.Root>
                          <div className='flex flex-col flex-1'>
                            <span className='text-paragraph-sm text-text-main-900'>{name}</span>
                            {roleDisplay && (
                              <span className='text-label-xs text-text-soft-400'>
                                {roleDisplay}
                              </span>
                            )}
                          </div>
                          {isSelected && (
                            <RiCheckLine className='size-4 text-text-main-900 shrink-0' />
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </Dropdown.Content>
    </Dropdown.Root>
  );
};

export default AssigneeMultiSelect;
