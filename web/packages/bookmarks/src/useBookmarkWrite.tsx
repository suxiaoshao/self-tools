import { useRef } from 'react';
import { useWriteAction, WriteNotice } from 'custom-graphql';
import { writeResult } from './results';

export default function useBookmarkWrite(viewHref: string) {
  const action = useWriteAction();
  const executing = useRef(false);
  const recovery = useRef<{ verify: () => Promise<boolean>; confirmed?: () => unknown } | undefined>(undefined);
  const execute = async (
    request: () => Promise<Parameters<typeof writeResult>[0]>,
    recover?: typeof recovery.current,
  ) => {
    if (action.blocked || executing.current) return false;
    executing.current = true;
    try {
      recovery.current = recover;
      const outcome = await action.run(async () => writeResult(await request()));
      return outcome?.status === 'saved';
    } finally {
      executing.current = false;
    }
  };
  return {
    execute,
    outcome: action.outcome,
    pending: action.pending,
    blocked: action.blocked,
    notice: (
      <WriteNotice
        outcome={action.outcome}
        pending={action.pending}
        viewHref={viewHref}
        check={
          recovery.current
            ? async () => {
                const current = recovery.current;
                if (current && (await action.check(current.verify))) await current.confirmed?.();
              }
            : undefined
        }
      />
    ),
  };
}
