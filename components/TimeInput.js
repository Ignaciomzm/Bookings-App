import React, { useState } from 'react';
import { TextInput } from 'react-native';

const TimeInput = React.forwardRef(
  (
    {
      baseStyle,
      focusedStyle,
      style,
      onFocus,
      onBlur,
      placeholderTextColor = '#9AA3AF',
      keyboardType = 'numeric',
      selectTextOnFocus = true,
      returnKeyType = 'next',
      blurOnSubmit = false,
      ...rest
    },
    ref
  ) => {
    const [isFocused, setIsFocused] = useState(false);

    const handleFocus = (event) => {
      setIsFocused(true);
      onFocus?.(event);
    };

    const handleBlur = (event) => {
      setIsFocused(false);
      onBlur?.(event);
    };

    return (
      <TextInput
        ref={ref}
        {...rest}
        style={[baseStyle, style, isFocused && focusedStyle]}
        placeholderTextColor={placeholderTextColor}
        keyboardType={keyboardType}
        selectTextOnFocus={selectTextOnFocus}
        returnKeyType={returnKeyType}
        blurOnSubmit={blurOnSubmit}
        onFocus={handleFocus}
        onBlur={handleBlur}
      />
    );
  }
);

TimeInput.displayName = 'TimeInput';

export default TimeInput;