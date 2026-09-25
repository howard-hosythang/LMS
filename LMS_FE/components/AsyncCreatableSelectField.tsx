import AsyncCreatableSelect from 'react-select/async-creatable';
import debounce from 'lodash/debounce';
import { useMemo, useEffect } from 'react';

type Option = {
    value: number | string | null;
    label: string;
};

type Props = {
    isMulti?: boolean;
    value: Option[] | Option | null;
    onChange: (value: any) => void;
    loadOptions: (inputValue: string) => Promise<Option[]>;
    onCreate: (inputValue: string) => Promise<Option>;
    placeholder?: string;
    isDisabled?: boolean;
};

const AsyncCreatableSelectField = ({
    isMulti = false,
    value,
    onChange,
    loadOptions,
    onCreate,
    placeholder,
    isDisabled = false, // default false
}: Props) => {

    // 🔥 Debounce loadOptions
    const debouncedLoadOptions = useMemo(() => {
        return debounce(
            (
                inputValue: string,
                callback: (options: Option[]) => void
            ) => {
                loadOptions(inputValue)
                    .then((options) => {
                        callback(options);
                    })
                    .catch((err) => {
                        console.error('Load options error:', err);
                        callback([]);
                    });
            },
            500 // delay 500ms
        );
    }, [loadOptions]);

    // 🧹 Cleanup debounce khi unmount
    useEffect(() => {
        return () => {
            debouncedLoadOptions.cancel();
        };
    }, [debouncedLoadOptions]);

    return (
        <AsyncCreatableSelect
            isMulti={isMulti}
            isDisabled={isDisabled}
            cacheOptions
            defaultOptions
            loadOptions={debouncedLoadOptions} // ✅ dùng debounce ở đây
            value={value}
            onChange={(val) => {
                if (isDisabled) return;
                onChange(val);
            }}
            onCreateOption={async (inputValue) => {
                if (isDisabled) return;
                try {
                    const newOption = await onCreate(inputValue);

                    if (isMulti) {
                        onChange([...(value as Option[] || []), newOption]);
                    } else {
                        onChange(newOption);
                    }
                } catch (err) {
                    console.error('Create option error:', err);
                }
            }}
            menuPortalTarget={document.body}
            menuPosition="fixed"
            styles={{
                menuPortal: (base) => ({ ...base, zIndex: 9999 }),
                control: (base, state) => ({
                    ...base,
                    backgroundColor: isDisabled ? '#f8fafc' : '#ffffff',
                    cursor: isDisabled ? 'not-allowed' : 'default',
                    opacity: isDisabled ? 0.8 : 1,
                    minHeight: '44px',
                    borderColor: state.isFocused ? '#6366f1' : '#e2e8f0',
                    borderRadius: '0.5rem',
                    boxShadow: state.isFocused ? '0 0 0 2px rgba(99,102,241,0.15)' : 'none',
                    '&:hover': { borderColor: '#a5b4fc' },
                    fontSize: '0.875rem',
                    transition: 'border-color 0.15s, box-shadow 0.15s',
                }),
                valueContainer: (base) => ({
                    ...base,
                    padding: '4px 10px',
                    gap: '4px',
                }),
                multiValue: (base) => ({
                    ...base,
                    backgroundColor: '#eef2ff',
                    borderRadius: '6px',
                    border: '1px solid #c7d2fe',
                    margin: '2px',
                }),
                multiValueLabel: (base) => ({
                    ...base,
                    color: '#4338ca',
                    fontWeight: '500',
                    fontSize: '0.8125rem',
                    padding: '2px 6px',
                }),
                multiValueRemove: (base) => ({
                    ...base,
                    color: '#818cf8',
                    borderRadius: '0 5px 5px 0',
                    paddingLeft: '4px',
                    paddingRight: '4px',
                    '&:hover': { backgroundColor: '#c7d2fe', color: '#3730a3' },
                }),
                singleValue: (base) => ({
                    ...base,
                    color: '#1e293b',
                    fontWeight: '500',
                    fontSize: '0.875rem',
                }),
                placeholder: (base) => ({
                    ...base,
                    color: '#94a3b8',
                    fontSize: '0.875rem',
                }),
                input: (base) => ({
                    ...base,
                    color: '#1e293b',
                    fontSize: '0.875rem',
                }),
                option: (base, state) => ({
                    ...base,
                    backgroundColor: state.isSelected ? '#eef2ff' : state.isFocused ? '#f8fafc' : undefined,
                    color: state.isSelected ? '#4338ca' : '#334155',
                    fontWeight: state.isSelected ? '500' : '400',
                    fontSize: '0.875rem',
                    '&:active': { backgroundColor: '#e0e7ff' },
                }),
                menu: (base) => ({
                    ...base,
                    borderRadius: '0.5rem',
                    boxShadow: '0 4px 6px -1px rgba(0,0,0,0.08), 0 2px 4px -2px rgba(0,0,0,0.06)',
                    border: '1px solid #e2e8f0',
                    overflow: 'hidden',
                }),
                dropdownIndicator: (base) => ({
                    ...base,
                    color: '#94a3b8',
                    '&:hover': { color: '#6366f1' },
                }),
                clearIndicator: (base) => ({
                    ...base,
                    color: '#94a3b8',
                    '&:hover': { color: '#ef4444' },
                }),
            }}
            placeholder={placeholder}
        />
    );
};

export default AsyncCreatableSelectField;