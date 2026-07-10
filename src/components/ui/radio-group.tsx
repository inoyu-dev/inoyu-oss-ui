import * as React from "react"
import { Circle } from "lucide-react"
import { cn } from "@/lib/utils"

const RadioGroupContext = React.createContext<{
  value?: string;
  onValueChange?: (value: string) => void;
}>({});

interface RadioGroupProps extends React.HTMLAttributes<HTMLDivElement> {
  value?: string;
  onValueChange?: (value: string) => void;
  defaultValue?: string;
}

const RadioGroup = React.forwardRef<HTMLDivElement, RadioGroupProps>(
  ({ className, value, onValueChange, defaultValue, children, ...props }, ref) => {
    const [internalValue, setInternalValue] = React.useState(defaultValue || value || '');
    
    const currentValue = value !== undefined ? value : internalValue;
    
    const handleChange = (newValue: string) => {
      if (value === undefined) {
        setInternalValue(newValue);
      }
      onValueChange?.(newValue);
    };

    return (
      <RadioGroupContext.Provider value={{ value: currentValue, onValueChange: handleChange }}>
        <div
          ref={ref}
          className={cn("grid gap-2", className)}
          role="radiogroup"
          {...props}
        >
          {children}
        </div>
      </RadioGroupContext.Provider>
    );
  }
);
RadioGroup.displayName = "RadioGroup";

interface RadioGroupItemProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'value'> {
  value: string;
  id?: string;
}

const RadioGroupItem = React.forwardRef<HTMLInputElement, RadioGroupItemProps>(
  ({ className, value, id, ...props }, ref) => {
    const context = React.useContext(RadioGroupContext);
    const inputId = id || `radio-${value}`;
    const checked = context.value === value;
    
    const handleChange = () => {
      context.onValueChange?.(value);
    };
    
    return (
      <div className="relative">
        <input
          ref={ref}
          type="radio"
          id={inputId}
          value={value}
          checked={checked}
          onChange={handleChange}
          className="sr-only"
          {...props}
        />
        <label
          htmlFor={inputId}
          className={cn(
            "aspect-square h-4 w-4 rounded-full border-2 border-primary text-primary ring-offset-background focus-within:outline-none focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer flex items-center justify-center transition-colors",
            checked && "border-primary",
            className
          )}
        >
          {checked && (
            <Circle className="h-2.5 w-2.5 fill-current text-current" />
          )}
        </label>
      </div>
    );
  }
);
RadioGroupItem.displayName = "RadioGroupItem";

export { RadioGroup, RadioGroupItem }
