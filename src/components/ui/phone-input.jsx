import React, { useState, useEffect, forwardRef } from 'react';
import { Controller } from 'react-hook-form';
import * as Input from '@/components/ui/input';
import * as Select from '@/components/ui/select';
import { fetchCountries, DEFAULT_COUNTRY_CODE, parseContactNumber } from '@/constants/countries';
import { cn } from '@/lib/utils';

/**
 * PhoneInput Component
 * A reusable phone number input with country code selector
 *
 * @param {Object} props
 * @param {string} props.countryCode - Initial country code (default: '+91')
 * @param {string} props.value - Current phone number value
 * @param {Function} props.onChange - Callback when value changes (receives { countryCode, number, formattedValue })
 * @param {Function} props.onCountryCodeChange - Callback when country code changes
 * @param {string} props.placeholder - Placeholder text for phone input
 * @param {boolean} props.disabled - Whether the input is disabled
 * @param {boolean} props.hasError - Whether to show error state
 * @param {string} props.size - Input size: 'medium' | 'small' | 'xsmall'
 * @param {string} props.variant - Input variant: 'default' | 'borderless'
 * @param {number} props.maxLength - Maximum length for phone number (default: 10)
 * @param {boolean} props.allowNumericOnly - Whether to allow only numeric input (default: true)
 * @param {string} props.className - Additional CSS classes
 * @param {Object} props.inputProps - Additional props to pass to the input element
 */
const PhoneInput = forwardRef(
  (
    {
      countryCode: controlledCountryCode,
      value: controlledValue = '',
      onChange,
      onCountryCodeChange,
      placeholder = 'Enter phone number',
      disabled = false,
      hasError = false,
      size = 'medium',
      variant = 'default',
      maxLength = 10,
      allowNumericOnly = true,
      className,
      inputProps = {},
      ...rest
    },
    ref,
  ) => {
    const [internalCountryCode, setInternalCountryCode] = useState(
      controlledCountryCode || DEFAULT_COUNTRY_CODE,
    );
    const [internalValue, setInternalValue] = useState(controlledValue || '');
    const [selectedCountryKey, setSelectedCountryKey] = useState(''); // Track selected country's unique key
    const [countries, setCountries] = useState([]);
    const [isLoadingCountries, setIsLoadingCountries] = useState(true);

    // Use controlled values if provided, otherwise use internal state
    const countryCode =
      controlledCountryCode !== undefined ? controlledCountryCode : internalCountryCode;
    const value = controlledValue !== undefined ? controlledValue : internalValue;

    // Fetch countries on mount
    useEffect(() => {
      let isMounted = true;

      fetchCountries()
        .then((fetchedCountries) => {
          if (isMounted) {
            setCountries(fetchedCountries);
            // Set initial selected country key based on countryCode
            const initialCountry = fetchedCountries.find((c) => c.value === countryCode);
            if (initialCountry) {
              setSelectedCountryKey(initialCountry.uniqueKey);
            }
            setIsLoadingCountries(false);
          }
        })
        .catch((error) => {
          console.error('Failed to load countries:', error);
          if (isMounted) {
            setIsLoadingCountries(false);
          }
        });

      return () => {
        isMounted = false;
      };
    }, []);

    // Update internal state when controlled values change
    useEffect(() => {
      if (controlledCountryCode !== undefined) {
        setInternalCountryCode(controlledCountryCode);
      }
    }, [controlledCountryCode]);

    useEffect(() => {
      if (controlledValue !== undefined) {
        setInternalValue(controlledValue);
      }
    }, [controlledValue]);

    const handleCountryCodeChange = (newCountryKey) => {
      // Find the country by uniqueKey
      const selectedCountry = countries.find((c) => c.uniqueKey === newCountryKey);
      if (!selectedCountry) return;

      const newCountryCode = selectedCountry.value; // Extract phone code
      setSelectedCountryKey(newCountryKey);

      if (controlledCountryCode === undefined) {
        setInternalCountryCode(newCountryCode);
      }
      onCountryCodeChange?.(newCountryCode);

      // Keep the existing phone number, just update the country code
      const currentNumber = value || '';

      // Only call onChange if there's a phone number
      // This prevents triggering validation errors when just changing country
      if (currentNumber) {
        const newFormattedValue = `${newCountryCode}-${currentNumber}`;
        onChange?.({
          countryCode: newCountryCode,
          number: currentNumber,
          formattedValue: newFormattedValue,
        });
      }
    };

    const handlePhoneNumberChange = (e) => {
      let newValue = e.target.value;

      if (allowNumericOnly) {
        // Only allow numeric input
        newValue = [...newValue].filter((char) => /\d/.test(char)).join('');
      }

      // Limit to maxLength
      newValue = newValue.slice(0, maxLength);

      // Update internal state if not controlled
      if (controlledValue === undefined) {
        setInternalValue(newValue);
      }

      // Call onChange callback with structured data
      // Always format with country code, even if number is empty (for consistency)
      const formattedValue = newValue ? `${countryCode}-${newValue}` : '';
      onChange?.({
        countryCode,
        number: newValue,
        formattedValue,
        event: e,
      });
    };

    // Find selected country by uniqueKey or by phone code, with fallbacks
    const selectedCountry = (countries.length > 0 &&
      selectedCountryKey &&
      countries.find((c) => c.uniqueKey === selectedCountryKey)) ||
      (countries.length > 0 && countries.find((c) => c.value === countryCode)) ||
      (countries.length > 0 && countries.find((c) => c.value === DEFAULT_COUNTRY_CODE)) ||
      (countries.length > 0 && countries[0]) || {
      value: countryCode,
      label: countryCode,
      flag: 'https://flagcdn.com/xx.svg', // Fallback flag
      flagCode: 'xx',
      uniqueKey: countryCode,
    }; // Fallback if countries not loaded yet

    return (
      <Input.Root
        size={size}
        variant={variant}
        hasError={hasError}
        className={cn('w-full', className)}
        {...rest}
      >
        <Select.Root
          variant='compactForInput'
          value={selectedCountry?.uniqueKey || selectedCountryKey}
          onValueChange={handleCountryCodeChange}
          disabled={disabled || isLoadingCountries}
          matchTriggerWidth={false}
        >
          <Select.Trigger className={variant === 'borderless' ? 'pl-1' : ''}>
            <Select.Value asChild>
              <span className='flex items-center gap-1'>
                {selectedCountry?.flag ? (
                  <img
                    src={selectedCountry.flag}
                    alt={selectedCountry.label || countryCode}
                    className='w-5 h-5 object-cover rounded-full'
                  />
                ) : (
                  <span>🌍</span>
                )}
                <span>{countryCode}</span>
              </span>
            </Select.Value>
          </Select.Trigger>
          <Select.Content className='min-w-[120px] p-0 gap-0'>
            {isLoadingCountries ? (
              <Select.Item value='loading' disabled>
                Loading...
              </Select.Item>
            ) : countries.length > 0 ? (
              countries.map((country, index) => (
                <Select.Item
                  className='flex whitespace-nowrap items-center gap-2'
                  key={country.uniqueKey || `fallback-${index}`}
                  value={country.uniqueKey}
                >
                  <Select.ItemIcon>
                    {country.flag ? (
                      <img
                        src={country.flag}
                        alt={country.label}
                        className='w-5 h-5 object-cover rounded-full'
                        loading='lazy'
                      />
                    ) : (
                      <span>🌍</span>
                    )}
                  </Select.ItemIcon>
                  <span className='flex-1'>
                    {country.label} {country.value}
                  </span>
                </Select.Item>
              ))
            ) : (
              <Select.Item value='error' disabled>
                Failed to load countries
              </Select.Item>
            )}
          </Select.Content>
        </Select.Root>
        <Input.Wrapper>
          <Input.Input
            ref={ref}
            type='tel'
            placeholder={placeholder}
            value={value}
            onChange={handlePhoneNumberChange}
            onInput={handlePhoneNumberChange}
            disabled={disabled || isLoadingCountries}
            maxLength={maxLength}
            {...inputProps}
          />
        </Input.Wrapper>
      </Input.Root>
    );
  },
);

PhoneInput.displayName = 'PhoneInput';

/**
 * PhoneInputController - Wrapper for use with react-hook-form Controller
 *
 * Usage with react-hook-form:
 *
 * <Controller
 *   name="phone"
 *   control={control}
 *   render={({ field, fieldState }) => (
 *     <PhoneInputController
 *       value={field.value}
 *       onChange={(data) => {
 *         // data is { countryCode, number, formattedValue }
 *         field.onChange(data.formattedValue);
 *       }}
 *       error={fieldState.error}
 *     />
 *   )}
 * />
 */
export const PhoneInputController = ({
  value,
  onChange,
  error,
  countryCode: initialCountryCode,
  onCountryCodeChange,
  ...props
}) => {
  const [countryCode, setCountryCode] = useState(initialCountryCode || DEFAULT_COUNTRY_CODE);
  const [countries, setCountries] = useState([]);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [lastFormattedValue, setLastFormattedValue] = useState('');

  // Fetch countries on mount
  useEffect(() => {
    fetchCountries().then(setCountries).catch(console.error);
  }, []);

  // Initialize country code and phone number from value (only on mount or when value changes externally)
  useEffect(() => {
    // Only parse if the value is different from what we last sent (i.e., it's an external change)
    if (value === lastFormattedValue) {
      return;
    }

    if (!value) {
      // Only clear if this is an external change (not from our own onChange)
      if (lastFormattedValue !== undefined && lastFormattedValue !== '') {
        setPhoneNumber('');
        setLastFormattedValue('');
      }
      return;
    }

    if (typeof value === 'string' && value.includes('-')) {
      // Value is formatted, parse it
      const parseValue = async () => {
        const countriesToUse = countries.length > 0 ? countries : await fetchCountries();
        if (countriesToUse.length === 0) {
          const fetched = await fetchCountries();
          setCountries(fetched);
          return parseContactNumber(value, fetched);
        }
        return parseContactNumber(value, countriesToUse);
      };

      parseValue().then((parsed) => {
        setCountryCode(parsed.countryCode);
        setPhoneNumber(parsed.number);
        setLastFormattedValue(value);
      });
    } else if (typeof value === 'string') {
      // Value is just a number, use it directly
      setPhoneNumber(value);
      // Don't update lastFormattedValue if it's just a number (not formatted)
      // This allows the user to type freely
    }
  }, [value]); // Only depend on value, not countries or lastFormattedValue

  // Set initial country code
  useEffect(() => {
    if (initialCountryCode && !value) {
      setCountryCode(initialCountryCode);
    }
  }, [initialCountryCode, value]);

  const handleChange = (data) => {
    // Extract the number and formatted value from the data
    let number = '';
    let formattedValue = '';

    if (data && typeof data === 'object' && 'formattedValue' in data) {
      number = data.number || '';
      formattedValue = data.formattedValue || '';
    } else if (typeof data === 'string') {
      formattedValue = data;
      // If it's a string and contains '-', parse it
      if (formattedValue.includes('-')) {
        const parts = formattedValue.split('-');
        number = parts[1] || '';
      } else {
        number = formattedValue;
      }
    }

    // Update phoneNumber immediately for responsive typing
    setPhoneNumber(number);
    // Update our tracking
    setLastFormattedValue(formattedValue);
    // Always call onChange with the formatted value (even if empty)
    // The form validation should handle empty values appropriately
    onChange?.(formattedValue);
  };

  const handleCountryCodeChange = (newCountryCode) => {
    setCountryCode(newCountryCode);
    onCountryCodeChange?.(newCountryCode);

    // Keep the existing phone number, just update the country code in formatted value
    const currentNumber = phoneNumber || '';

    if (currentNumber) {
      // If there's a number, update the formatted value with new country code
      const newFormattedValue = `${newCountryCode}-${currentNumber}`;
      setLastFormattedValue(newFormattedValue);
      onChange?.(newFormattedValue);
    } else {
      // If no number, don't update the form value to avoid triggering validation
      // The country code is updated internally, and when user types, it will use the new country code
      setLastFormattedValue('');
      // Don't call onChange to avoid triggering "Required" validation
    }
  };

  return (
    <PhoneInput
      countryCode={countryCode}
      value={phoneNumber}
      onChange={handleChange}
      onCountryCodeChange={handleCountryCodeChange}
      hasError={!!error}
      {...props}
    />
  );
};

PhoneInputController.displayName = 'PhoneInputController';

export default PhoneInput;
