import { Breadcrumbs, LinearProgress, Link } from '@mui/material';
import { useI18n } from 'i18n';
import { createSearchParams, Link as RouterLink } from 'react-router-dom';
import { useGetCollectionAncestorsQuery } from '../../../graphql';
import useParentId from '../hooks/useParentId';

export default function AncestorsPath() {
  const parentId = useParentId();
  const { data: { getCollection } = {}, loading } = useGetCollectionAncestorsQuery({
    variables: { id: parentId ?? 0 },
    skip: parentId === null,
  });
  const t = useI18n();

  return (
    <>
      {getCollection && (
        <Breadcrumbs sx={{ marginBottom: 2 }}>
          <Link
            component={RouterLink}
            to={{
              search: createSearchParams({}).toString(),
            }}
            underline="hover"
          >
            {t('root')}
          </Link>
          {getCollection.ancestors.map(({ name, id }) => (
            <Link
              component={RouterLink}
              underline="hover"
              to={{ search: createSearchParams({ parentId: id.toString() }).toString() }}
              key={id}
            >
              {name}
            </Link>
          ))}
          <Link underline="hover" color="text.primary">
            {getCollection.name}
          </Link>
        </Breadcrumbs>
      )}
      {loading && <LinearProgress sx={{ marginBottom: 2 }} />}
    </>
  );
}
