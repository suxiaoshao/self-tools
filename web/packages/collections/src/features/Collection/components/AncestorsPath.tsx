import { useI18n } from 'i18n';
import { createSearchParams, Link } from 'react-router-dom';
import useParentId from '../hooks/useParentId';
import { graphql } from '@collections/gql';
import { useQuery } from '@apollo/client/react';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@portal/components/ui/breadcrumb';
import { Fragment } from 'react/jsx-runtime';
import { Spinner } from '@portal/components/ui/spinner';

const GetCollectionAncestors = graphql(`
  query getCollectionAncestors($id: Int!) {
    getCollection(id: $id) {
      ancestors {
        id
        name
      }
      id
      name
    }
  }
`);

export default function AncestorsPath() {
  const parentId = useParentId();
  const { data: { getCollection } = {}, loading } = useQuery(GetCollectionAncestors, {
    variables: { id: parentId ?? 0 },
    skip: parentId === null,
  });
  const t = useI18n();

  return (
    <>
      {getCollection && (
        <Breadcrumb className="mb-2">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link
                  to={{
                    search: createSearchParams({}).toString(),
                  }}
                >
                  {t('root')}
                </Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            {getCollection.ancestors.map(({ id, name }) => (
              <Fragment key={id}>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbLink asChild>
                    <Link to={{ search: createSearchParams({ parentId: id.toString() }).toString() }}>{name}</Link>
                  </BreadcrumbLink>
                </BreadcrumbItem>
              </Fragment>
            ))}
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{getCollection.name}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      )}
      {loading && <Spinner className="mb-2" />}
    </>
  );
}
