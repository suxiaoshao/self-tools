import { useUiMessages } from '../locale';
import { cn } from '../lib/utils';
import { Loader2Icon } from 'lucide-react';

function Spinner({ className, ...props }: React.ComponentProps<'svg'>) {
  const messages = useUiMessages();
  return (
    <Loader2Icon
      role="status"
      aria-label={messages.loading}
      className={cn('size-4 animate-spin', className)}
      {...props}
    />
  );
}

export { Spinner };
