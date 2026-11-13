import { forwardRef } from 'react';
import type { InputHTMLAttributes } from 'react';
import { Search } from 'lucide-react';
import { cn } from '../../utils/cn';

interface SearchInputProps extends InputHTMLAttributes<HTMLInputElement> {
  onSearch?: (value: string) => void;
}

const SearchInput = forwardRef<HTMLInputElement, SearchInputProps>(
  ({ className, onSearch, ...props }, ref) => {
    return (
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-navy-400" />
        <input
          ref={ref}
          type="search"
          className={cn(
            'pl-10 flex h-10 w-full rounded-lg border border-navy-300 bg-white px-3 py-2 text-sm ring-offset-white placeholder:text-navy-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-navy-600 dark:bg-navy-800 dark:ring-offset-navy-800 dark:placeholder:text-navy-500 dark:focus-visible:ring-primary-500',
            className
          )}
          onChange={(e) => onSearch?.(e.target.value)}
          {...props}
        />
      </div>
    );
  }
);

SearchInput.displayName = 'SearchInput';

export default SearchInput;
