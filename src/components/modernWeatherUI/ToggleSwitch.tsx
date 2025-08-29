import React from 'react';

interface ToggleSwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  ariaLabel?: string;
  disabled?: boolean;
  size?: 'small' | 'medium' | 'large';
}

/**
 * iOS26 Toggle Switch
 * Accessible, keyboard-friendly switch following iOS visual style.
 */
export const ToggleSwitch: React.FC<ToggleSwitchProps> = ({
  checked,
  onChange,
  ariaLabel,
  disabled = false,
  size = 'medium',
}) => {
  const handleKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      if (!disabled) onChange(!checked);
    }
  };

  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={ariaLabel}
      disabled={disabled}
      className={`ios26-switch ios26-switch--${size}${checked ? ' ios26-switch--checked' : ''}${disabled ? ' is-disabled' : ''}`}
      onClick={() => !disabled && onChange(!checked)}
      onKeyDown={handleKeyDown}
    >
      <span className="ios26-switch__thumb" aria-hidden="true" />
    </button>
  );
};

export default ToggleSwitch;
