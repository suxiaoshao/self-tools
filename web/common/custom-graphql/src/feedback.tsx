import { useEffect, useRef, useState } from 'react';
import { useI18n, type I18nKey } from 'i18n';
import { isUnconfirmed, RequestError, type FieldViolation, type RequestFailure } from 'request-errors';
import { authenticatedStateVersion, graphQLFailures } from './client';
import { Alert, AlertDescription } from 'ui/components/alert';
import { Button } from 'ui/components/button';

const resourceLabels: Readonly<Record<string, I18nKey>> = {
  AUTHOR: 'author',
  NOVEL: 'novel',
  COLLECTION: 'collection',
  ITEM: 'item',
  TAG: 'tags',
  CHAPTER: 'chapter',
  COMMENT: 'comment',
};

/** UI projections of generated domain results; these are not wire types. */
export type RejectionNotice =
  | { kind: 'validation'; issues: readonly FieldViolation[] }
  | { kind: 'missing'; resources: readonly { kind: string; id: number }[] }
  | { kind: 'conflict'; reason: 'COLLECTION_PATH_EXISTS' | 'MEMBERSHIP_EXISTS' | 'SOURCE_ID_EXISTS' | 'COMMENT_EXISTS' }
  | { kind: 'alreadyRead'; chapterIds: readonly number[] };
export type WriteOutcome =
  | { status: 'saved'; id?: number }
  | { status: 'rejected'; rejection: RejectionNotice }
  | { status: 'failed'; failure: RequestFailure; unconfirmed: boolean };
export const protocolFailure = (): WriteOutcome => ({
  status: 'failed',
  failure: { kind: 'protocol' },
  unconfirmed: true,
});
export function saved(...args: [] | [number]): WriteOutcome {
  const id = args[0];
  return args.length === 0 || (typeof id === 'number' && Number.isSafeInteger(id) && id > 0)
    ? { status: 'saved', id }
    : protocolFailure();
}
export async function attemptWrite<T>(
  request: () => Promise<T>,
  project: (response: T) => WriteOutcome,
): Promise<WriteOutcome> {
  const version = authenticatedStateVersion();
  try {
    const response = await request();
    if (version !== authenticatedStateVersion())
      return { status: 'failed', failure: { kind: 'cancelled' }, unconfirmed: true };
    return project(response);
  } catch (error) {
    const failure = graphQLFailures(error)[0]?.failure ?? { kind: 'protocol' };
    return { status: 'failed', failure, unconfirmed: isUnconfirmed(new RequestError(failure)) };
  }
}
export function useWriteAction() {
  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);
  const [outcome, setOutcome] = useState<WriteOutcome>();
  const [pending, setPending] = useState(false);
  const busy = useRef(false);
  const uncertain = useRef(false);
  const version = useRef(authenticatedStateVersion());
  const run = async (request: () => Promise<WriteOutcome>) => {
    if (!mounted.current || busy.current || uncertain.current) return undefined;
    busy.current = true;
    setPending(true);
    version.current = authenticatedStateVersion();
    try {
      const result = await attemptWrite(request, (result) => result);
      if (!mounted.current || version.current !== authenticatedStateVersion()) return undefined;
      uncertain.current = result.status === 'failed' && result.unconfirmed;
      setOutcome(result);
      return result;
    } finally {
      busy.current = false;
      if (mounted.current) setPending(false);
    }
  };
  const check = async (read: () => Promise<boolean>) => {
    if (!mounted.current || busy.current || version.current !== authenticatedStateVersion()) return false;
    busy.current = true;
    setPending(true);
    try {
      const confirmed = await read();
      if (!mounted.current || version.current !== authenticatedStateVersion()) return false;
      if (confirmed) {
        uncertain.current = false;
        setOutcome({ status: 'saved' });
      }
      return confirmed;
    } catch {
      return false;
    } finally {
      // The original uncertainty remains; a failed read never confirms a write.
      busy.current = false;
      if (mounted.current) setPending(false);
    }
  };
  return { outcome, pending, blocked: pending || (outcome?.status === 'failed' && outcome.unconfirmed), run, check };
}

export function RequestNotice({ error, retry }: { error: unknown; retry?: () => unknown }) {
  const t = useI18n();
  const failures = graphQLFailures(error);
  if (!failures.length) return null;
  return (
    <Alert variant="destructive">
      <AlertDescription>
        {failures.map(({ failure }, index) => (
          <div key={index}>
            <FailureText failure={failure} />
          </div>
        ))}
        {retry && (
          <Button
            type="button"
            variant="link"
            className="h-auto p-0 text-current"
            onClick={() => {
              void Promise.resolve()
                .then(retry)
                .catch(() => undefined);
            }}
          >
            {t('refresh')}
          </Button>
        )}
      </AlertDescription>
    </Alert>
  );
}
function FailureText({ failure }: { failure: RequestFailure }) {
  const t = useI18n();
  const requestId =
    failure.kind === 'public' ? failure.error.requestId : 'requestId' in failure ? failure.requestId : undefined;
  const label =
    failure.kind === 'public'
      ? {
          UNAUTHENTICATED: t('request_sign_in'),
          NOT_FOUND: t('request_missing'),
          INVALID_REQUEST: t('request_invalid'),
          RATE_LIMITED: t('request_rate_limited'),
          INTERNAL: t('request_failed'),
          UNAVAILABLE: t('request_unavailable'),
          UPSTREAM_TIMEOUT: t('request_timeout'),
          UPSTREAM_FAILURE: t('request_failed'),
          REQUEST_REJECTED: t('request_rejected'),
          REAUTH_REQUIRED: t('request_sign_in'),
          AUTHENTICATION_FAILED: t('request_rejected'),
          CEREMONY_INVALID: t('request_rejected'),
          NO_PASSKEY: t('request_rejected'),
          PASSKEY_EXISTS: t('request_rejected'),
        }[failure.error.code]
      : {
          network: t('request_network'),
          timeout: t('request_timeout'),
          protocol: t('request_protocol'),
          cancelled: t('request_cancelled'),
        }[failure.kind];
  return (
    <>
      {label}
      {requestId && (
        <span className="block text-xs break-all">
          {t('request_id')}: {requestId}
        </span>
      )}
    </>
  );
}
export function WriteNotice({
  outcome,
  check,
  pending,
  viewHref,
  fieldLabels,
}: {
  outcome?: WriteOutcome;
  check?: () => unknown;
  pending?: boolean;
  viewHref?: string;
  fieldLabels?: Readonly<Record<string, string>>;
}) {
  const t = useI18n();
  if (!outcome || outcome.status === 'saved') return null;
  const rejection = outcome.status === 'rejected' ? outcome.rejection : undefined;
  return (
    <Alert variant="destructive">
      <AlertDescription>
        {outcome.status === 'failed' && (
          <>
            {outcome.unconfirmed && <p>{t('request_write_unknown')}</p>}
            <FailureText failure={outcome.failure} />
          </>
        )}
        {rejection?.kind === 'validation' && (
          <ul>
            {rejection.issues.map((issue, index) => (
              <li key={index}>
                {fieldLabels?.[issue.path.join('.')] ?? fieldLabels?.[String(issue.path[0])] ?? t('field_error')}:{' '}
                {
                  {
                    REQUIRED: t('request_required'),
                    INVALID_FORMAT: t('request_invalid'),
                    TOO_LONG: t('request_too_long'),
                    OUT_OF_RANGE: t('request_out_of_range'),
                  }[issue.code]
                }
                {issue.min !== undefined && ` ≥ ${issue.min}`}
                {issue.max !== undefined && ` ≤ ${issue.max}`}
              </li>
            ))}
          </ul>
        )}
        {rejection?.kind === 'missing' && (
          <p>
            {t('request_missing')} (
            {rejection.resources.map((r) => `${t(resourceLabels[r.kind] ?? 'resource')} #${r.id}`).join(', ')})
          </p>
        )}
        {rejection?.kind === 'conflict' && (
          <p>
            {
              {
                COLLECTION_PATH_EXISTS: t('request_path_exists'),
                MEMBERSHIP_EXISTS: t('request_membership_exists'),
                SOURCE_ID_EXISTS: t('request_source_exists'),
                COMMENT_EXISTS: t('request_comment_exists'),
              }[rejection.reason]
            }
          </p>
        )}
        {rejection?.kind === 'alreadyRead' && (
          <p>
            {t('request_already_read')} ({rejection.chapterIds.join(', ')})
          </p>
        )}
        {outcome.status === 'failed' && outcome.unconfirmed && (
          <div className="flex gap-3 mt-2">
            {check && (
              <Button
                type="button"
                disabled={pending}
                variant="link"
                className="h-auto p-0 text-current"
                onClick={() => {
                  void Promise.resolve()
                    .then(check)
                    .catch(() => undefined);
                }}
              >
                {t('request_check_result')}
              </Button>
            )}
            {viewHref && (
              <a className="underline" href={viewHref} target="_blank" rel="noreferrer">
                {t('request_view_list')}
              </a>
            )}
          </div>
        )}
      </AlertDescription>
    </Alert>
  );
}
/** Errors on the root or this association are relevant; sibling failures retain the useful fields. */
export function hasQueryFailure(error: unknown, path: readonly (string | number)[]): boolean {
  return graphQLFailures(error).some(
    (entry) => !entry.path || entry.path.every((part, index) => index >= path.length || part === path[index]),
  );
}
export function rejectionFieldErrors(outcome: WriteOutcome | undefined): readonly FieldViolation[] {
  return outcome?.status === 'rejected' && outcome.rejection.kind === 'validation' ? outcome.rejection.issues : [];
}
