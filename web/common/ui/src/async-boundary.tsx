import { Component, Suspense, type ReactNode } from 'react';

interface AsyncBoundaryProps {
  children: ReactNode;
  pending: ReactNode;
  failed: ReactNode;
  resetKey?: string | number;
}

class FailureBoundary extends Component<
  Pick<AsyncBoundaryProps, 'children' | 'failed' | 'resetKey'>,
  { failed: boolean; resetKey?: string | number }
> {
  state = { failed: false, resetKey: this.props.resetKey };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  static getDerivedStateFromProps(props: AsyncBoundaryProps, state: { resetKey?: string | number }) {
    return props.resetKey !== state.resetKey ? { failed: false, resetKey: props.resetKey } : null;
  }
  render() {
    return this.state.failed ? this.props.failed : this.props.children;
  }
}

export function AsyncBoundary({ children, pending, failed, resetKey }: AsyncBoundaryProps) {
  return (
    <FailureBoundary resetKey={resetKey} failed={failed}>
      <Suspense fallback={pending}>{children}</Suspense>
    </FailureBoundary>
  );
}
