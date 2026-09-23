import React from 'react';
import CustomDatePicker from '../CustomDatePicker';

export default function CustomDateInput({
  value,
  onChange,
  placeholder,
  isDarkMode,
  theme,
  required,
  min,
  max,
  lang = 'RU',
  size = 'md',
  className = ''
}) {
  return (
    <CustomDatePicker
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      isDarkMode={isDarkMode}
      theme={theme}
      required={required}
      min={min}
      max={max}
      lang={lang}
      size={size}
      className={className}
    />
  );
}
