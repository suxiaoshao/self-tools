import { RequestNotice } from 'custom-graphql';
import { useI18n } from 'i18n';
import { createSearchParams, Link } from 'react-router';
import useParentId from '../hooks/useParentId';
import { graphql } from '@collections/gql/index';
import { useQuery } from '@apollo/client/react';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from 'ui/components/breadcrumb';
import { Fragment } from 'react/jsx-runtime';
import { Spinner } from 'ui/components/spinner';

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
  const {
    data: { getCollection } = {},
    loading,
    error,
    refetch,
  } = useQuery(GetCollectionAncestors, {
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
              <BreadcrumbLink
                render={
                  <Link
                    to={{
                      search: createSearchParams({}).toString(),
                    }}
                  />
                }
              >
                {t('root')}
              </BreadcrumbLink>
            </BreadcrumbItem>
            {getCollection.ancestors?.map(({ id, name }) => (
              <Fragment key={id}>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbLink
                    render={<Link to={{ search: createSearchParams({ parentId: id.toString() }).toString() }} />}
                  >
                    {name}
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
      <RequestNotice error={error} retry={refetch} />
      {!loading && !error && parentId !== null && getCollection === null && <p>{t('request_not_found')}</p>}
      {loading && <Spinner className="mb-2" />}
    </>
  );
}
