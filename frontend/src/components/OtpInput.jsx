import { useRef, useState, useEffect } from 'react';

const OtpInput = ({ length = 6, value = '', onChange, error, disabled = false }) => {
  const [digits, setDigits] = useState(() => {
    const arr = new Array(length).fill('');
    if (value) {
      value.split('').forEach((ch, i) => {
        if (i < length) arr[i] = ch;
      });
    }
    return arr;
  });

  const inputRefs = useRef([]);

  useEffect(() => {
    // Sync external value changes
    const arr = new Array(length).fill('');
    if (value) {
      value.split('').forEach((ch, i) => {
        if (i < length) arr[i] = ch;
      });
    }
    setDigits(arr);
  }, [value, length]);

  const focusInput = (index) => {
    if (inputRefs.current[index]) {
      inputRefs.current[index].focus();
      inputRefs.current[index].select();
    }
  };

  const emitChange = (newDigits) => {
    const otp = newDigits.join('');
    onChange?.(otp);
  };

  const handleChange = (index, e) => {
    const val = e.target.value;

    // Handle paste of full OTP
    if (val.length > 1) {
      const pastedDigits = val.replace(/\D/g, '').split('').slice(0, length);
      const newDigits = new Array(length).fill('');
      pastedDigits.forEach((ch, i) => {
        newDigits[i] = ch;
      });
      setDigits(newDigits);
      emitChange(newDigits);
      const nextIndex = Math.min(pastedDigits.length, length - 1);
      focusInput(nextIndex);
      return;
    }

    // Single character
    if (/^\d$/.test(val) || val === '') {
      const newDigits = [...digits];
      newDigits[index] = val;
      setDigits(newDigits);
      emitChange(newDigits);

      if (val && index < length - 1) {
        focusInput(index + 1);
      }
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      const newDigits = [...digits];
      newDigits[index - 1] = '';
      setDigits(newDigits);
      emitChange(newDigits);
      focusInput(index - 1);
    } else if (e.key === 'ArrowLeft' && index > 0) {
      focusInput(index - 1);
    } else if (e.key === 'ArrowRight' && index < length - 1) {
      focusInput(index + 1);
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, length);
    if (pasted) {
      const newDigits = new Array(length).fill('');
      pasted.split('').forEach((ch, i) => {
        newDigits[i] = ch;
      });
      setDigits(newDigits);
      emitChange(newDigits);
      const nextIndex = Math.min(pasted.length, length - 1);
      focusInput(nextIndex);
    }
  };

  return (
    <div className="space-y-1.5">
      <div className="flex gap-2 sm:gap-3 justify-center">
        {digits.map((digit, index) => (
          <input
            key={index}
            ref={(el) => (inputRefs.current[index] = el)}
            type="text"
            inputMode="numeric"
            maxLength={length}
            value={digit}
            onChange={(e) => handleChange(index, e)}
            onKeyDown={(e) => handleKeyDown(index, e)}
            onPaste={handlePaste}
            onFocus={(e) => e.target.select()}
            disabled={disabled}
            className={`otp-input ${error ? 'border-red-400 focus:border-red-500 focus:ring-red-500/20' : ''} ${
              disabled ? 'opacity-50 cursor-not-allowed' : ''
            }`}
            aria-label={`Digit ${index + 1}`}
          />
        ))}
      </div>
      {error && (
        <p className="text-sm text-red-500 text-center flex items-center justify-center gap-1" role="alert">
          <span className="inline-block w-1 h-1 bg-red-500 rounded-full" />
          {error}
        </p>
      )}
    </div>
  );
};

export default OtpInput;
