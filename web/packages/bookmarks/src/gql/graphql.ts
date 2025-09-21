/* eslint-disable */
import { TypedDocumentNode as DocumentNode } from '@graphql-typed-document-node/core';
export type Maybe<T> = T | null;
export type InputMaybe<T> = Maybe<T>;
export type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]?: Maybe<T[SubKey]> };
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]: Maybe<T[SubKey]> };
export type MakeEmpty<T extends { [key: string]: unknown }, K extends keyof T> = { [_ in K]?: never };
export type Incremental<T> = T | { [P in keyof T]?: P extends ' $fragmentName' | '__typename' ? T[P] : never };
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: { input: string; output: string };
  String: { input: string; output: string };
  Boolean: { input: boolean; output: boolean };
  Int: { input: number; output: number };
  Float: { input: number; output: number };
  BigDecimal: { input: any; output: any };
  DateTime: { input: any; output: any };
};

export type Author = {
  __typename?: 'Author';
  avatar: Scalars['String']['output'];
  createTime: Scalars['DateTime']['output'];
  description: Scalars['String']['output'];
  id: Scalars['Int']['output'];
  name: Scalars['String']['output'];
  novels: Array<Novel>;
  site: NovelSite;
  siteId: Scalars['String']['output'];
  updateTime: Scalars['DateTime']['output'];
  url: Scalars['String']['output'];
};

export type AuthorList = {
  __typename?: 'AuthorList';
  data: Array<Author>;
  total: Scalars['Int']['output'];
};

export type Chapter = {
  __typename?: 'Chapter';
  author: Author;
  content?: Maybe<Scalars['String']['output']>;
  createTime: Scalars['DateTime']['output'];
  id: Scalars['Int']['output'];
  isRead: Scalars['Boolean']['output'];
  novel: Novel;
  novelId: Scalars['Int']['output'];
  site: NovelSite;
  siteId: Scalars['String']['output'];
  siteNovelId: Scalars['String']['output'];
  time: Scalars['DateTime']['output'];
  title: Scalars['String']['output'];
  updateTime: Scalars['DateTime']['output'];
  url: Scalars['String']['output'];
  wordCount: Scalars['Int']['output'];
};

export type Collection = {
  __typename?: 'Collection';
  ancestors: Array<Collection>;
  children: Array<Collection>;
  createTime: Scalars['DateTime']['output'];
  description?: Maybe<Scalars['String']['output']>;
  id: Scalars['Int']['output'];
  name: Scalars['String']['output'];
  parentId?: Maybe<Scalars['Int']['output']>;
  path: Scalars['String']['output'];
  updateTime: Scalars['DateTime']['output'];
};

export type CollectionList = {
  __typename?: 'CollectionList';
  data: Array<Collection>;
  total: Scalars['Int']['output'];
};

export type CreateNovelInput = {
  authorId: Scalars['Int']['input'];
  avatar: Scalars['String']['input'];
  description: Scalars['String']['input'];
  name: Scalars['String']['input'];
  novelStatus: NovelStatus;
  site: NovelSite;
  siteId: Scalars['String']['input'];
  tags: Array<Scalars['Int']['input']>;
};

export type DraftAuthorInfo = {
  __typename?: 'DraftAuthorInfo';
  description: Scalars['String']['output'];
  id: Scalars['String']['output'];
  image: Scalars['String']['output'];
  name: Scalars['String']['output'];
  novels: Array<DraftNovelInfo>;
  site: NovelSite;
  url: Scalars['String']['output'];
};

export type DraftChapterInfo = {
  __typename?: 'DraftChapterInfo';
  id: Scalars['String']['output'];
  novelId: Scalars['String']['output'];
  site: NovelSite;
  time: Scalars['DateTime']['output'];
  title: Scalars['String']['output'];
  url: Scalars['String']['output'];
  wordCount: Scalars['Int']['output'];
};

export type DraftNovelInfo = {
  __typename?: 'DraftNovelInfo';
  author: DraftAuthorInfo;
  chapters: Array<DraftChapterInfo>;
  description: Scalars['String']['output'];
  id: Scalars['String']['output'];
  image: Scalars['String']['output'];
  name: Scalars['String']['output'];
  site: NovelSite;
  status: NovelStatus;
  tags: Array<DraftTagInfo>;
  url: Scalars['String']['output'];
};

export type DraftTagInfo = {
  __typename?: 'DraftTagInfo';
  id: Scalars['String']['output'];
  name: Scalars['String']['output'];
  url: Scalars['String']['output'];
};

export type MutationRoot = {
  __typename?: 'MutationRoot';
  addCollectionForNovel: Novel;
  addCommentForNovel: NovelComment;
  addReadRecordsForChapter: Scalars['Int']['output'];
  createAuthor: Author;
  createCollection: Collection;
  createNovel: Novel;
  createTag: Tag;
  deleteAuthor: Author;
  deleteCollection: Scalars['Int']['output'];
  deleteCollectionForNovel: Novel;
  deleteCommentForNovel: NovelComment;
  deleteNovel: Novel;
  deleteReadRecordsForChapter: Scalars['Int']['output'];
  deleteTag: Tag;
  saveDraftAuthor: Author;
  saveDraftNovel: Novel;
  updateAuthorByCrawler: Author;
  updateCollection: Collection;
  updateCommentForNovel: NovelComment;
  updateNovelByCrawler: Novel;
};

export type MutationRootAddCollectionForNovelArgs = {
  collectionId: Scalars['Int']['input'];
  novelId: Scalars['Int']['input'];
};

export type MutationRootAddCommentForNovelArgs = {
  content: Scalars['String']['input'];
  novelId: Scalars['Int']['input'];
};

export type MutationRootAddReadRecordsForChapterArgs = {
  chapterIds: Array<Scalars['Int']['input']>;
  novelId: Scalars['Int']['input'];
};

export type MutationRootCreateAuthorArgs = {
  avatar: Scalars['String']['input'];
  description: Scalars['String']['input'];
  name: Scalars['String']['input'];
  site: NovelSite;
  siteId: Scalars['String']['input'];
};

export type MutationRootCreateCollectionArgs = {
  description?: InputMaybe<Scalars['String']['input']>;
  name: Scalars['String']['input'];
  parentId?: InputMaybe<Scalars['Int']['input']>;
};

export type MutationRootCreateNovelArgs = {
  data: CreateNovelInput;
};

export type MutationRootCreateTagArgs = {
  name: Scalars['String']['input'];
  site: NovelSite;
  siteId: Scalars['String']['input'];
};

export type MutationRootDeleteAuthorArgs = {
  id: Scalars['Int']['input'];
};

export type MutationRootDeleteCollectionArgs = {
  id: Scalars['Int']['input'];
};

export type MutationRootDeleteCollectionForNovelArgs = {
  collectionId: Scalars['Int']['input'];
  novelId: Scalars['Int']['input'];
};

export type MutationRootDeleteCommentForNovelArgs = {
  novelId: Scalars['Int']['input'];
};

export type MutationRootDeleteNovelArgs = {
  id: Scalars['Int']['input'];
};

export type MutationRootDeleteReadRecordsForChapterArgs = {
  chapterIds: Array<Scalars['Int']['input']>;
};

export type MutationRootDeleteTagArgs = {
  id: Scalars['Int']['input'];
};

export type MutationRootSaveDraftAuthorArgs = {
  author: SaveDraftAuthor;
};

export type MutationRootSaveDraftNovelArgs = {
  novel: SaveDraftNovel;
};

export type MutationRootUpdateAuthorByCrawlerArgs = {
  authorId: Scalars['Int']['input'];
};

export type MutationRootUpdateCollectionArgs = {
  description?: InputMaybe<Scalars['String']['input']>;
  id: Scalars['Int']['input'];
  name: Scalars['String']['input'];
  parentId?: InputMaybe<Scalars['Int']['input']>;
};

export type MutationRootUpdateCommentForNovelArgs = {
  content: Scalars['String']['input'];
  novelId: Scalars['Int']['input'];
};

export type MutationRootUpdateNovelByCrawlerArgs = {
  novelId: Scalars['Int']['input'];
};

export type Novel = {
  __typename?: 'Novel';
  author: Author;
  avatar: Scalars['String']['output'];
  chapters: Array<Chapter>;
  collections: Array<Collection>;
  comments?: Maybe<NovelComment>;
  createTime: Scalars['DateTime']['output'];
  description: Scalars['String']['output'];
  firstChapter?: Maybe<Chapter>;
  id: Scalars['Int']['output'];
  lastChapter?: Maybe<Chapter>;
  name: Scalars['String']['output'];
  novelStatus: NovelStatus;
  readPercentage: Scalars['Float']['output'];
  site: NovelSite;
  siteId: Scalars['String']['output'];
  tags: Array<Tag>;
  updateTime: Scalars['DateTime']['output'];
  url: Scalars['String']['output'];
  wordCount: Scalars['BigDecimal']['output'];
};

export type NovelComment = {
  __typename?: 'NovelComment';
  content: Scalars['String']['output'];
  createTime: Scalars['DateTime']['output'];
  updateTime: Scalars['DateTime']['output'];
};

export type NovelList = {
  __typename?: 'NovelList';
  data: Array<Novel>;
  total: Scalars['Int']['output'];
};

export enum NovelSite {
  Jjwxc = 'JJWXC',
  Qidian = 'QIDIAN',
}

export enum NovelStatus {
  Completed = 'COMPLETED',
  Ongoing = 'ONGOING',
  Paused = 'PAUSED',
}

export type Pagination = {
  page?: Scalars['Int']['input'];
  pageSize?: Scalars['Int']['input'];
};

export type QueryRoot = {
  __typename?: 'QueryRoot';
  allAuthors: Array<Author>;
  allCollections: Array<Collection>;
  allTags: Array<Tag>;
  fetchAuthor: DraftAuthorInfo;
  fetchNovel: DraftNovelInfo;
  getAuthor: Author;
  getCollection: Collection;
  getCollections: CollectionList;
  getNovel: Novel;
  queryAuthors: AuthorList;
  queryNovels: NovelList;
  queryTags: TagList;
};

export type QueryRootAllAuthorsArgs = {
  searchName?: InputMaybe<Scalars['String']['input']>;
};

export type QueryRootFetchAuthorArgs = {
  id: Scalars['String']['input'];
  novelSite: NovelSite;
};

export type QueryRootFetchNovelArgs = {
  id: Scalars['String']['input'];
  novelSite: NovelSite;
};

export type QueryRootGetAuthorArgs = {
  id: Scalars['Int']['input'];
};

export type QueryRootGetCollectionArgs = {
  id: Scalars['Int']['input'];
};

export type QueryRootGetCollectionsArgs = {
  pagination: Pagination;
  parentId?: InputMaybe<Scalars['Int']['input']>;
};

export type QueryRootGetNovelArgs = {
  id: Scalars['Int']['input'];
};

export type QueryRootQueryAuthorsArgs = {
  pagination: Pagination;
  searchName?: InputMaybe<Scalars['String']['input']>;
};

export type QueryRootQueryNovelsArgs = {
  collectionMatch?: InputMaybe<TagMatch>;
  novelStatus?: InputMaybe<NovelStatus>;
  pagination: Pagination;
  tagMatch?: InputMaybe<TagMatch>;
};

export type QueryRootQueryTagsArgs = {
  pagination: Pagination;
};

export type SaveAuthorInfo = {
  description: Scalars['String']['input'];
  id: Scalars['String']['input'];
  image: Scalars['String']['input'];
  name: Scalars['String']['input'];
  site: NovelSite;
};

export type SaveChapterInfo = {
  id: Scalars['String']['input'];
  name: Scalars['String']['input'];
  time: Scalars['DateTime']['input'];
  wordCount: Scalars['Int']['input'];
};

export type SaveDraftAuthor = {
  description: Scalars['String']['input'];
  id: Scalars['String']['input'];
  image: Scalars['String']['input'];
  name: Scalars['String']['input'];
  novels: Array<SaveNovelInfo>;
  site: NovelSite;
};

export type SaveDraftNovel = {
  author: SaveAuthorInfo;
  chapters: Array<SaveChapterInfo>;
  description: Scalars['String']['input'];
  id: Scalars['String']['input'];
  image: Scalars['String']['input'];
  name: Scalars['String']['input'];
  novelStatus: NovelStatus;
  site: NovelSite;
  tags: Array<SaveTagInfo>;
};

export type SaveNovelInfo = {
  chapters: Array<SaveChapterInfo>;
  description: Scalars['String']['input'];
  id: Scalars['String']['input'];
  image: Scalars['String']['input'];
  name: Scalars['String']['input'];
  novelStatus: NovelStatus;
  site: NovelSite;
  tags: Array<SaveTagInfo>;
};

export type SaveTagInfo = {
  id: Scalars['String']['input'];
  name: Scalars['String']['input'];
};

export type Tag = {
  __typename?: 'Tag';
  createTime: Scalars['DateTime']['output'];
  id: Scalars['Int']['output'];
  name: Scalars['String']['output'];
  site: NovelSite;
  siteId: Scalars['String']['output'];
  updateTime: Scalars['DateTime']['output'];
  url: Scalars['String']['output'];
};

export type TagList = {
  __typename?: 'TagList';
  data: Array<Tag>;
  total: Scalars['Int']['output'];
};

export type TagMatch = {
  fullMatch: Scalars['Boolean']['input'];
  matchSet: Array<Scalars['Int']['input']>;
};

export type SearchAuthorQueryVariables = Exact<{
  searchName?: InputMaybe<Scalars['String']['input']>;
}>;

export type SearchAuthorQuery = {
  __typename?: 'QueryRoot';
  allAuthors: Array<{ __typename?: 'Author'; id: number; name: string; description: string; avatar: string }>;
};

export type AllTagsQueryVariables = Exact<{ [key: string]: never }>;

export type AllTagsQuery = {
  __typename?: 'QueryRoot';
  allTags: Array<{ __typename?: 'Tag'; id: number; name: string }>;
};

export type GetAuthorQueryVariables = Exact<{
  id: Scalars['Int']['input'];
}>;

export type GetAuthorQuery = {
  __typename?: 'QueryRoot';
  getAuthor: {
    __typename?: 'Author';
    id: number;
    site: NovelSite;
    name: string;
    createTime: any;
    updateTime: any;
    avatar: string;
    description: string;
    url: string;
    novels: Array<{
      __typename?: 'Novel';
      id: number;
      name: string;
      avatar: string;
      createTime: any;
      updateTime: any;
      description: string;
      novelStatus: NovelStatus;
      url: string;
      wordCount: any;
      lastChapter?: { __typename?: 'Chapter'; time: any } | null;
      firstChapter?: { __typename?: 'Chapter'; time: any } | null;
    }>;
  };
};

export type UpdateAuthorByCrawlerMutationVariables = Exact<{
  authorId: Scalars['Int']['input'];
}>;

export type UpdateAuthorByCrawlerMutation = {
  __typename?: 'MutationRoot';
  updateAuthorByCrawler: { __typename?: 'Author'; id: number };
};

export type FetchAuthorQueryVariables = Exact<{
  id: Scalars['String']['input'];
  novelSite: NovelSite;
}>;

export type FetchAuthorQuery = {
  __typename?: 'QueryRoot';
  fetchAuthor: {
    __typename: 'DraftAuthorInfo';
    name: string;
    description: string;
    image: string;
    url: string;
    id: string;
    site: NovelSite;
    novels: Array<{
      __typename?: 'DraftNovelInfo';
      id: string;
      name: string;
      description: string;
      image: string;
      url: string;
      status: NovelStatus;
      site: NovelSite;
      chapters: Array<{
        __typename?: 'DraftChapterInfo';
        id: string;
        novelId: string;
        title: string;
        url: string;
        time: any;
        wordCount: number;
        site: NovelSite;
      }>;
      tags: Array<{ __typename?: 'DraftTagInfo'; id: string; name: string; url: string }>;
    }>;
  };
};

export type SaveDraftAuthorMutationVariables = Exact<{
  author: SaveDraftAuthor;
}>;

export type SaveDraftAuthorMutation = {
  __typename?: 'MutationRoot';
  saveDraftAuthor: { __typename?: 'Author'; id: number };
};

export type CreateAuthorMutationVariables = Exact<{
  avatar: Scalars['String']['input'];
  description: Scalars['String']['input'];
  name: Scalars['String']['input'];
  site: NovelSite;
  siteId: Scalars['String']['input'];
}>;

export type CreateAuthorMutation = { __typename?: 'MutationRoot'; createAuthor: { __typename?: 'Author'; id: number } };

export type GetAuthorsQueryVariables = Exact<{
  pagination: Pagination;
}>;

export type GetAuthorsQuery = {
  __typename?: 'QueryRoot';
  queryAuthors: {
    __typename?: 'AuthorList';
    total: number;
    data: Array<{
      __typename?: 'Author';
      id: number;
      site: NovelSite;
      name: string;
      createTime: any;
      updateTime: any;
      avatar: string;
      description: string;
      url: string;
    }>;
  };
};

export type DeleteAuthorMutationVariables = Exact<{
  id: Scalars['Int']['input'];
}>;

export type DeleteAuthorMutation = { __typename?: 'MutationRoot'; deleteAuthor: { __typename?: 'Author'; id: number } };

export type AllCollectionsQueryVariables = Exact<{ [key: string]: never }>;

export type AllCollectionsQuery = {
  __typename?: 'QueryRoot';
  allCollections: Array<{
    __typename?: 'Collection';
    name: string;
    id: number;
    path: string;
    createTime: any;
    updateTime: any;
    description?: string | null;
    parentId?: number | null;
  }>;
};

export type GetCollectionAncestorsQueryVariables = Exact<{
  id: Scalars['Int']['input'];
}>;

export type GetCollectionAncestorsQuery = {
  __typename?: 'QueryRoot';
  getCollection: {
    __typename?: 'Collection';
    id: number;
    name: string;
    ancestors: Array<{ __typename?: 'Collection'; id: number; name: string }>;
  };
};

export type DeleteCollectionMutationVariables = Exact<{
  id: Scalars['Int']['input'];
}>;

export type DeleteCollectionMutation = { __typename?: 'MutationRoot'; deleteCollection: number };

export type UpdateCollectionMutationVariables = Exact<{
  id: Scalars['Int']['input'];
  name: Scalars['String']['input'];
  parentId?: InputMaybe<Scalars['Int']['input']>;
  description?: InputMaybe<Scalars['String']['input']>;
}>;

export type UpdateCollectionMutation = { __typename?: 'MutationRoot'; updateCollection: { __typename: 'Collection' } };

export type CreateCollectionMutationVariables = Exact<{
  parentId?: InputMaybe<Scalars['Int']['input']>;
  name: Scalars['String']['input'];
  description?: InputMaybe<Scalars['String']['input']>;
}>;

export type CreateCollectionMutation = {
  __typename?: 'MutationRoot';
  createCollection: { __typename?: 'Collection'; path: string };
};

export type GetCollectionsQueryVariables = Exact<{
  parentId?: InputMaybe<Scalars['Int']['input']>;
  pagination: Pagination;
}>;

export type GetCollectionsQuery = {
  __typename?: 'QueryRoot';
  getCollections: {
    __typename?: 'CollectionList';
    total: number;
    data: Array<{
      __typename?: 'Collection';
      name: string;
      id: number;
      path: string;
      createTime: any;
      updateTime: any;
      description?: string | null;
    }>;
  };
};

export type AddCollectionForNovelMutationVariables = Exact<{
  novelId: Scalars['Int']['input'];
  collectionId: Scalars['Int']['input'];
}>;

export type AddCollectionForNovelMutation = {
  __typename?: 'MutationRoot';
  addCollectionForNovel: { __typename?: 'Novel'; id: number };
};

export type AddReadRecordMutationVariables = Exact<{
  novelId: Scalars['Int']['input'];
  chapterIds: Array<Scalars['Int']['input']> | Scalars['Int']['input'];
}>;

export type AddReadRecordMutation = { __typename?: 'MutationRoot'; addReadRecordsForChapter: number };

export type DeleteReadRecordMutationVariables = Exact<{
  chapterIds: Array<Scalars['Int']['input']> | Scalars['Int']['input'];
}>;

export type DeleteReadRecordMutation = { __typename?: 'MutationRoot'; deleteReadRecordsForChapter: number };

export type CreateCommentMutationVariables = Exact<{
  novelId: Scalars['Int']['input'];
  content: Scalars['String']['input'];
}>;

export type CreateCommentMutation = { __typename?: 'MutationRoot'; addCommentForNovel: { __typename: 'NovelComment' } };

export type UpdateCommentMutationVariables = Exact<{
  novelId: Scalars['Int']['input'];
  content: Scalars['String']['input'];
}>;

export type UpdateCommentMutation = {
  __typename?: 'MutationRoot';
  updateCommentForNovel: { __typename: 'NovelComment' };
};

export type GetNovelQueryVariables = Exact<{
  id: Scalars['Int']['input'];
}>;

export type GetNovelQuery = {
  __typename?: 'QueryRoot';
  getNovel: {
    __typename?: 'Novel';
    id: number;
    name: string;
    avatar: string;
    description: string;
    createTime: any;
    updateTime: any;
    novelStatus: NovelStatus;
    url: string;
    wordCount: any;
    site: NovelSite;
    chapters: Array<{
      __typename?: 'Chapter';
      id: number;
      title: string;
      createTime: any;
      updateTime: any;
      url: string;
      wordCount: number;
      time: any;
      isRead: boolean;
    }>;
    author: { __typename?: 'Author'; avatar: string; description: string; id: number; name: string; site: NovelSite };
    lastChapter?: { __typename?: 'Chapter'; time: any } | null;
    firstChapter?: { __typename?: 'Chapter'; time: any } | null;
    tags: Array<{ __typename?: 'Tag'; url: string; name: string; id: number }>;
    collections: Array<{
      __typename?: 'Collection';
      name: string;
      id: number;
      description?: string | null;
      path: string;
    }>;
    comments?: { __typename?: 'NovelComment'; content: string } | null;
  };
};

export type UpdateNovelByCrawlerMutationVariables = Exact<{
  novelId: Scalars['Int']['input'];
}>;

export type UpdateNovelByCrawlerMutation = {
  __typename?: 'MutationRoot';
  updateNovelByCrawler: { __typename?: 'Novel'; id: number };
};

export type DeleteCommentForNovelMutationVariables = Exact<{
  novelId: Scalars['Int']['input'];
}>;

export type DeleteCommentForNovelMutation = {
  __typename?: 'MutationRoot';
  deleteCommentForNovel: { __typename: 'NovelComment' };
};

export type DeleteCollectionForNovelMutationVariables = Exact<{
  novelId: Scalars['Int']['input'];
  collectionId: Scalars['Int']['input'];
}>;

export type DeleteCollectionForNovelMutation = {
  __typename?: 'MutationRoot';
  deleteCollectionForNovel: { __typename?: 'Novel'; id: number };
};

export type FetchNovelQueryVariables = Exact<{
  id: Scalars['String']['input'];
  novelSite: NovelSite;
}>;

export type FetchNovelQuery = {
  __typename?: 'QueryRoot';
  fetchNovel: {
    __typename?: 'DraftNovelInfo';
    description: string;
    image: string;
    name: string;
    url: string;
    site: NovelSite;
    status: NovelStatus;
    id: string;
    author: {
      __typename?: 'DraftAuthorInfo';
      description: string;
      image: string;
      name: string;
      url: string;
      id: string;
    };
    chapters: Array<{
      __typename?: 'DraftChapterInfo';
      title: string;
      url: string;
      site: NovelSite;
      time: any;
      wordCount: number;
      id: string;
    }>;
    tags: Array<{ __typename?: 'DraftTagInfo'; id: string; name: string; url: string }>;
  };
};

export type SaveDraftNovelMutationVariables = Exact<{
  novel: SaveDraftNovel;
}>;

export type SaveDraftNovelMutation = {
  __typename?: 'MutationRoot';
  saveDraftNovel: { __typename?: 'Novel'; id: number };
};

export type CreateNovelMutationVariables = Exact<{
  data: CreateNovelInput;
}>;

export type CreateNovelMutation = { __typename?: 'MutationRoot'; createNovel: { __typename?: 'Novel'; id: number } };

export type GetNovelsQueryVariables = Exact<{
  collectionMatch?: InputMaybe<TagMatch>;
  novelStatus?: InputMaybe<NovelStatus>;
  tagMatch?: InputMaybe<TagMatch>;
  pagination: Pagination;
}>;

export type GetNovelsQuery = {
  __typename?: 'QueryRoot';
  queryNovels: {
    __typename?: 'NovelList';
    total: number;
    data: Array<{
      __typename?: 'Novel';
      id: number;
      name: string;
      description: string;
      createTime: any;
      updateTime: any;
      novelStatus: NovelStatus;
      avatar: string;
      site: NovelSite;
    }>;
  };
};

export type DeleteNovelMutationVariables = Exact<{
  id: Scalars['Int']['input'];
}>;

export type DeleteNovelMutation = { __typename?: 'MutationRoot'; deleteNovel: { __typename?: 'Novel'; id: number } };

export type CreateTagMutationVariables = Exact<{
  name: Scalars['String']['input'];
  site: NovelSite;
  siteId: Scalars['String']['input'];
}>;

export type CreateTagMutation = {
  __typename?: 'MutationRoot';
  createTag: { __typename?: 'Tag'; name: string; id: number };
};

export type GetTagsQueryVariables = Exact<{
  pagination: Pagination;
}>;

export type GetTagsQuery = {
  __typename?: 'QueryRoot';
  queryTags: {
    __typename?: 'TagList';
    total: number;
    data: Array<{
      __typename?: 'Tag';
      name: string;
      id: number;
      site: NovelSite;
      url: string;
      createTime: any;
      updateTime: any;
    }>;
  };
};

export type DeleteTagMutationVariables = Exact<{
  id: Scalars['Int']['input'];
}>;

export type DeleteTagMutation = { __typename?: 'MutationRoot'; deleteTag: { __typename?: 'Tag'; id: number } };

export const SearchAuthorDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'query',
      name: { kind: 'Name', value: 'searchAuthor' },
      variableDefinitions: [
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'searchName' } },
          type: { kind: 'NamedType', name: { kind: 'Name', value: 'String' } },
        },
      ],
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'allAuthors' },
            arguments: [
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'searchName' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'searchName' } },
              },
            ],
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                { kind: 'Field', name: { kind: 'Name', value: 'id' } },
                { kind: 'Field', name: { kind: 'Name', value: 'name' } },
                { kind: 'Field', name: { kind: 'Name', value: 'description' } },
                { kind: 'Field', name: { kind: 'Name', value: 'avatar' } },
              ],
            },
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode<SearchAuthorQuery, SearchAuthorQueryVariables>;
export const AllTagsDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'query',
      name: { kind: 'Name', value: 'allTags' },
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'allTags' },
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                { kind: 'Field', name: { kind: 'Name', value: 'id' } },
                { kind: 'Field', name: { kind: 'Name', value: 'name' } },
              ],
            },
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode<AllTagsQuery, AllTagsQueryVariables>;
export const GetAuthorDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'query',
      name: { kind: 'Name', value: 'getAuthor' },
      variableDefinitions: [
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'id' } },
          type: { kind: 'NonNullType', type: { kind: 'NamedType', name: { kind: 'Name', value: 'Int' } } },
        },
      ],
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'getAuthor' },
            arguments: [
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'id' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'id' } },
              },
            ],
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'novels' },
                  selectionSet: {
                    kind: 'SelectionSet',
                    selections: [
                      { kind: 'Field', name: { kind: 'Name', value: 'id' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'name' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'avatar' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'createTime' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'updateTime' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'description' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'novelStatus' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'url' } },
                      {
                        kind: 'Field',
                        name: { kind: 'Name', value: 'lastChapter' },
                        selectionSet: {
                          kind: 'SelectionSet',
                          selections: [{ kind: 'Field', name: { kind: 'Name', value: 'time' } }],
                        },
                      },
                      {
                        kind: 'Field',
                        name: { kind: 'Name', value: 'firstChapter' },
                        selectionSet: {
                          kind: 'SelectionSet',
                          selections: [{ kind: 'Field', name: { kind: 'Name', value: 'time' } }],
                        },
                      },
                      { kind: 'Field', name: { kind: 'Name', value: 'wordCount' } },
                    ],
                  },
                },
                { kind: 'Field', name: { kind: 'Name', value: 'id' } },
                { kind: 'Field', name: { kind: 'Name', value: 'site' } },
                { kind: 'Field', name: { kind: 'Name', value: 'name' } },
                { kind: 'Field', name: { kind: 'Name', value: 'createTime' } },
                { kind: 'Field', name: { kind: 'Name', value: 'updateTime' } },
                { kind: 'Field', name: { kind: 'Name', value: 'avatar' } },
                { kind: 'Field', name: { kind: 'Name', value: 'description' } },
                { kind: 'Field', name: { kind: 'Name', value: 'url' } },
              ],
            },
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode<GetAuthorQuery, GetAuthorQueryVariables>;
export const UpdateAuthorByCrawlerDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'mutation',
      name: { kind: 'Name', value: 'updateAuthorByCrawler' },
      variableDefinitions: [
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'authorId' } },
          type: { kind: 'NonNullType', type: { kind: 'NamedType', name: { kind: 'Name', value: 'Int' } } },
        },
      ],
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'updateAuthorByCrawler' },
            arguments: [
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'authorId' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'authorId' } },
              },
            ],
            selectionSet: {
              kind: 'SelectionSet',
              selections: [{ kind: 'Field', name: { kind: 'Name', value: 'id' } }],
            },
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode<UpdateAuthorByCrawlerMutation, UpdateAuthorByCrawlerMutationVariables>;
export const FetchAuthorDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'query',
      name: { kind: 'Name', value: 'fetchAuthor' },
      variableDefinitions: [
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'id' } },
          type: { kind: 'NonNullType', type: { kind: 'NamedType', name: { kind: 'Name', value: 'String' } } },
        },
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'novelSite' } },
          type: { kind: 'NonNullType', type: { kind: 'NamedType', name: { kind: 'Name', value: 'NovelSite' } } },
        },
      ],
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'fetchAuthor' },
            arguments: [
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'id' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'id' } },
              },
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'novelSite' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'novelSite' } },
              },
            ],
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                { kind: 'Field', name: { kind: 'Name', value: '__typename' } },
                { kind: 'Field', name: { kind: 'Name', value: 'name' } },
                { kind: 'Field', name: { kind: 'Name', value: 'description' } },
                { kind: 'Field', name: { kind: 'Name', value: 'image' } },
                { kind: 'Field', name: { kind: 'Name', value: 'url' } },
                { kind: 'Field', name: { kind: 'Name', value: 'id' } },
                { kind: 'Field', name: { kind: 'Name', value: 'site' } },
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'novels' },
                  selectionSet: {
                    kind: 'SelectionSet',
                    selections: [
                      { kind: 'Field', name: { kind: 'Name', value: 'id' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'name' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'description' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'image' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'url' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'status' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'site' } },
                      {
                        kind: 'Field',
                        name: { kind: 'Name', value: 'chapters' },
                        selectionSet: {
                          kind: 'SelectionSet',
                          selections: [
                            { kind: 'Field', name: { kind: 'Name', value: 'id' } },
                            { kind: 'Field', name: { kind: 'Name', value: 'novelId' } },
                            { kind: 'Field', name: { kind: 'Name', value: 'title' } },
                            { kind: 'Field', name: { kind: 'Name', value: 'url' } },
                            { kind: 'Field', name: { kind: 'Name', value: 'time' } },
                            { kind: 'Field', name: { kind: 'Name', value: 'wordCount' } },
                            { kind: 'Field', name: { kind: 'Name', value: 'site' } },
                          ],
                        },
                      },
                      {
                        kind: 'Field',
                        name: { kind: 'Name', value: 'tags' },
                        selectionSet: {
                          kind: 'SelectionSet',
                          selections: [
                            { kind: 'Field', name: { kind: 'Name', value: 'id' } },
                            { kind: 'Field', name: { kind: 'Name', value: 'name' } },
                            { kind: 'Field', name: { kind: 'Name', value: 'url' } },
                          ],
                        },
                      },
                    ],
                  },
                },
              ],
            },
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode<FetchAuthorQuery, FetchAuthorQueryVariables>;
export const SaveDraftAuthorDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'mutation',
      name: { kind: 'Name', value: 'saveDraftAuthor' },
      variableDefinitions: [
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'author' } },
          type: { kind: 'NonNullType', type: { kind: 'NamedType', name: { kind: 'Name', value: 'SaveDraftAuthor' } } },
        },
      ],
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'saveDraftAuthor' },
            arguments: [
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'author' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'author' } },
              },
            ],
            selectionSet: {
              kind: 'SelectionSet',
              selections: [{ kind: 'Field', name: { kind: 'Name', value: 'id' } }],
            },
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode<SaveDraftAuthorMutation, SaveDraftAuthorMutationVariables>;
export const CreateAuthorDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'mutation',
      name: { kind: 'Name', value: 'createAuthor' },
      variableDefinitions: [
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'avatar' } },
          type: { kind: 'NonNullType', type: { kind: 'NamedType', name: { kind: 'Name', value: 'String' } } },
        },
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'description' } },
          type: { kind: 'NonNullType', type: { kind: 'NamedType', name: { kind: 'Name', value: 'String' } } },
        },
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'name' } },
          type: { kind: 'NonNullType', type: { kind: 'NamedType', name: { kind: 'Name', value: 'String' } } },
        },
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'site' } },
          type: { kind: 'NonNullType', type: { kind: 'NamedType', name: { kind: 'Name', value: 'NovelSite' } } },
        },
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'siteId' } },
          type: { kind: 'NonNullType', type: { kind: 'NamedType', name: { kind: 'Name', value: 'String' } } },
        },
      ],
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'createAuthor' },
            arguments: [
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'avatar' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'avatar' } },
              },
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'description' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'description' } },
              },
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'name' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'name' } },
              },
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'site' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'site' } },
              },
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'siteId' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'siteId' } },
              },
            ],
            selectionSet: {
              kind: 'SelectionSet',
              selections: [{ kind: 'Field', name: { kind: 'Name', value: 'id' } }],
            },
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode<CreateAuthorMutation, CreateAuthorMutationVariables>;
export const GetAuthorsDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'query',
      name: { kind: 'Name', value: 'getAuthors' },
      variableDefinitions: [
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'pagination' } },
          type: { kind: 'NonNullType', type: { kind: 'NamedType', name: { kind: 'Name', value: 'Pagination' } } },
        },
      ],
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'queryAuthors' },
            arguments: [
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'pagination' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'pagination' } },
              },
            ],
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'data' },
                  selectionSet: {
                    kind: 'SelectionSet',
                    selections: [
                      { kind: 'Field', name: { kind: 'Name', value: 'id' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'site' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'name' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'createTime' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'updateTime' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'avatar' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'description' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'url' } },
                    ],
                  },
                },
                { kind: 'Field', name: { kind: 'Name', value: 'total' } },
              ],
            },
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode<GetAuthorsQuery, GetAuthorsQueryVariables>;
export const DeleteAuthorDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'mutation',
      name: { kind: 'Name', value: 'deleteAuthor' },
      variableDefinitions: [
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'id' } },
          type: { kind: 'NonNullType', type: { kind: 'NamedType', name: { kind: 'Name', value: 'Int' } } },
        },
      ],
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'deleteAuthor' },
            arguments: [
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'id' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'id' } },
              },
            ],
            selectionSet: {
              kind: 'SelectionSet',
              selections: [{ kind: 'Field', name: { kind: 'Name', value: 'id' } }],
            },
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode<DeleteAuthorMutation, DeleteAuthorMutationVariables>;
export const AllCollectionsDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'query',
      name: { kind: 'Name', value: 'allCollections' },
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'allCollections' },
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                { kind: 'Field', name: { kind: 'Name', value: 'name' } },
                { kind: 'Field', name: { kind: 'Name', value: 'id' } },
                { kind: 'Field', name: { kind: 'Name', value: 'path' } },
                { kind: 'Field', name: { kind: 'Name', value: 'createTime' } },
                { kind: 'Field', name: { kind: 'Name', value: 'updateTime' } },
                { kind: 'Field', name: { kind: 'Name', value: 'description' } },
                { kind: 'Field', name: { kind: 'Name', value: 'parentId' } },
              ],
            },
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode<AllCollectionsQuery, AllCollectionsQueryVariables>;
export const GetCollectionAncestorsDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'query',
      name: { kind: 'Name', value: 'getCollectionAncestors' },
      variableDefinitions: [
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'id' } },
          type: { kind: 'NonNullType', type: { kind: 'NamedType', name: { kind: 'Name', value: 'Int' } } },
        },
      ],
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'getCollection' },
            arguments: [
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'id' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'id' } },
              },
            ],
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'ancestors' },
                  selectionSet: {
                    kind: 'SelectionSet',
                    selections: [
                      { kind: 'Field', name: { kind: 'Name', value: 'id' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'name' } },
                    ],
                  },
                },
                { kind: 'Field', name: { kind: 'Name', value: 'id' } },
                { kind: 'Field', name: { kind: 'Name', value: 'name' } },
              ],
            },
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode<GetCollectionAncestorsQuery, GetCollectionAncestorsQueryVariables>;
export const DeleteCollectionDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'mutation',
      name: { kind: 'Name', value: 'deleteCollection' },
      variableDefinitions: [
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'id' } },
          type: { kind: 'NonNullType', type: { kind: 'NamedType', name: { kind: 'Name', value: 'Int' } } },
        },
      ],
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'deleteCollection' },
            arguments: [
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'id' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'id' } },
              },
            ],
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode<DeleteCollectionMutation, DeleteCollectionMutationVariables>;
export const UpdateCollectionDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'mutation',
      name: { kind: 'Name', value: 'updateCollection' },
      variableDefinitions: [
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'id' } },
          type: { kind: 'NonNullType', type: { kind: 'NamedType', name: { kind: 'Name', value: 'Int' } } },
        },
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'name' } },
          type: { kind: 'NonNullType', type: { kind: 'NamedType', name: { kind: 'Name', value: 'String' } } },
        },
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'parentId' } },
          type: { kind: 'NamedType', name: { kind: 'Name', value: 'Int' } },
        },
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'description' } },
          type: { kind: 'NamedType', name: { kind: 'Name', value: 'String' } },
        },
      ],
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'updateCollection' },
            arguments: [
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'id' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'id' } },
              },
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'name' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'name' } },
              },
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'parentId' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'parentId' } },
              },
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'description' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'description' } },
              },
            ],
            selectionSet: {
              kind: 'SelectionSet',
              selections: [{ kind: 'Field', name: { kind: 'Name', value: '__typename' } }],
            },
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode<UpdateCollectionMutation, UpdateCollectionMutationVariables>;
export const CreateCollectionDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'mutation',
      name: { kind: 'Name', value: 'createCollection' },
      variableDefinitions: [
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'parentId' } },
          type: { kind: 'NamedType', name: { kind: 'Name', value: 'Int' } },
        },
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'name' } },
          type: { kind: 'NonNullType', type: { kind: 'NamedType', name: { kind: 'Name', value: 'String' } } },
        },
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'description' } },
          type: { kind: 'NamedType', name: { kind: 'Name', value: 'String' } },
        },
      ],
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'createCollection' },
            arguments: [
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'parentId' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'parentId' } },
              },
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'name' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'name' } },
              },
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'description' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'description' } },
              },
            ],
            selectionSet: {
              kind: 'SelectionSet',
              selections: [{ kind: 'Field', name: { kind: 'Name', value: 'path' } }],
            },
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode<CreateCollectionMutation, CreateCollectionMutationVariables>;
export const GetCollectionsDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'query',
      name: { kind: 'Name', value: 'getCollections' },
      variableDefinitions: [
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'parentId' } },
          type: { kind: 'NamedType', name: { kind: 'Name', value: 'Int' } },
        },
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'pagination' } },
          type: { kind: 'NonNullType', type: { kind: 'NamedType', name: { kind: 'Name', value: 'Pagination' } } },
        },
      ],
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'getCollections' },
            arguments: [
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'parentId' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'parentId' } },
              },
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'pagination' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'pagination' } },
              },
            ],
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'data' },
                  selectionSet: {
                    kind: 'SelectionSet',
                    selections: [
                      { kind: 'Field', name: { kind: 'Name', value: 'name' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'id' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'path' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'createTime' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'updateTime' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'description' } },
                    ],
                  },
                },
                { kind: 'Field', name: { kind: 'Name', value: 'total' } },
              ],
            },
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode<GetCollectionsQuery, GetCollectionsQueryVariables>;
export const AddCollectionForNovelDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'mutation',
      name: { kind: 'Name', value: 'addCollectionForNovel' },
      variableDefinitions: [
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'novelId' } },
          type: { kind: 'NonNullType', type: { kind: 'NamedType', name: { kind: 'Name', value: 'Int' } } },
        },
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'collectionId' } },
          type: { kind: 'NonNullType', type: { kind: 'NamedType', name: { kind: 'Name', value: 'Int' } } },
        },
      ],
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'addCollectionForNovel' },
            arguments: [
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'collectionId' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'collectionId' } },
              },
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'novelId' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'novelId' } },
              },
            ],
            selectionSet: {
              kind: 'SelectionSet',
              selections: [{ kind: 'Field', name: { kind: 'Name', value: 'id' } }],
            },
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode<AddCollectionForNovelMutation, AddCollectionForNovelMutationVariables>;
export const AddReadRecordDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'mutation',
      name: { kind: 'Name', value: 'addReadRecord' },
      variableDefinitions: [
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'novelId' } },
          type: { kind: 'NonNullType', type: { kind: 'NamedType', name: { kind: 'Name', value: 'Int' } } },
        },
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'chapterIds' } },
          type: {
            kind: 'NonNullType',
            type: {
              kind: 'ListType',
              type: { kind: 'NonNullType', type: { kind: 'NamedType', name: { kind: 'Name', value: 'Int' } } },
            },
          },
        },
      ],
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'addReadRecordsForChapter' },
            arguments: [
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'novelId' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'novelId' } },
              },
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'chapterIds' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'chapterIds' } },
              },
            ],
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode<AddReadRecordMutation, AddReadRecordMutationVariables>;
export const DeleteReadRecordDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'mutation',
      name: { kind: 'Name', value: 'deleteReadRecord' },
      variableDefinitions: [
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'chapterIds' } },
          type: {
            kind: 'NonNullType',
            type: {
              kind: 'ListType',
              type: { kind: 'NonNullType', type: { kind: 'NamedType', name: { kind: 'Name', value: 'Int' } } },
            },
          },
        },
      ],
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'deleteReadRecordsForChapter' },
            arguments: [
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'chapterIds' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'chapterIds' } },
              },
            ],
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode<DeleteReadRecordMutation, DeleteReadRecordMutationVariables>;
export const CreateCommentDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'mutation',
      name: { kind: 'Name', value: 'CreateComment' },
      variableDefinitions: [
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'novelId' } },
          type: { kind: 'NonNullType', type: { kind: 'NamedType', name: { kind: 'Name', value: 'Int' } } },
        },
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'content' } },
          type: { kind: 'NonNullType', type: { kind: 'NamedType', name: { kind: 'Name', value: 'String' } } },
        },
      ],
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'addCommentForNovel' },
            arguments: [
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'novelId' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'novelId' } },
              },
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'content' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'content' } },
              },
            ],
            selectionSet: {
              kind: 'SelectionSet',
              selections: [{ kind: 'Field', name: { kind: 'Name', value: '__typename' } }],
            },
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode<CreateCommentMutation, CreateCommentMutationVariables>;
export const UpdateCommentDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'mutation',
      name: { kind: 'Name', value: 'UpdateComment' },
      variableDefinitions: [
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'novelId' } },
          type: { kind: 'NonNullType', type: { kind: 'NamedType', name: { kind: 'Name', value: 'Int' } } },
        },
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'content' } },
          type: { kind: 'NonNullType', type: { kind: 'NamedType', name: { kind: 'Name', value: 'String' } } },
        },
      ],
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'updateCommentForNovel' },
            arguments: [
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'novelId' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'novelId' } },
              },
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'content' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'content' } },
              },
            ],
            selectionSet: {
              kind: 'SelectionSet',
              selections: [{ kind: 'Field', name: { kind: 'Name', value: '__typename' } }],
            },
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode<UpdateCommentMutation, UpdateCommentMutationVariables>;
export const GetNovelDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'query',
      name: { kind: 'Name', value: 'getNovel' },
      variableDefinitions: [
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'id' } },
          type: { kind: 'NonNullType', type: { kind: 'NamedType', name: { kind: 'Name', value: 'Int' } } },
        },
      ],
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'getNovel' },
            arguments: [
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'id' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'id' } },
              },
            ],
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                { kind: 'Field', name: { kind: 'Name', value: 'id' } },
                { kind: 'Field', name: { kind: 'Name', value: 'name' } },
                { kind: 'Field', name: { kind: 'Name', value: 'avatar' } },
                { kind: 'Field', name: { kind: 'Name', value: 'description' } },
                { kind: 'Field', name: { kind: 'Name', value: 'createTime' } },
                { kind: 'Field', name: { kind: 'Name', value: 'updateTime' } },
                { kind: 'Field', name: { kind: 'Name', value: 'description' } },
                { kind: 'Field', name: { kind: 'Name', value: 'novelStatus' } },
                { kind: 'Field', name: { kind: 'Name', value: 'url' } },
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'chapters' },
                  selectionSet: {
                    kind: 'SelectionSet',
                    selections: [
                      { kind: 'Field', name: { kind: 'Name', value: 'id' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'title' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'createTime' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'updateTime' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'url' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'wordCount' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'time' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'isRead' } },
                    ],
                  },
                },
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'author' },
                  selectionSet: {
                    kind: 'SelectionSet',
                    selections: [
                      { kind: 'Field', name: { kind: 'Name', value: 'avatar' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'description' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'id' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'name' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'site' } },
                    ],
                  },
                },
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'lastChapter' },
                  selectionSet: {
                    kind: 'SelectionSet',
                    selections: [{ kind: 'Field', name: { kind: 'Name', value: 'time' } }],
                  },
                },
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'firstChapter' },
                  selectionSet: {
                    kind: 'SelectionSet',
                    selections: [{ kind: 'Field', name: { kind: 'Name', value: 'time' } }],
                  },
                },
                { kind: 'Field', name: { kind: 'Name', value: 'wordCount' } },
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'tags' },
                  selectionSet: {
                    kind: 'SelectionSet',
                    selections: [
                      { kind: 'Field', name: { kind: 'Name', value: 'url' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'name' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'id' } },
                    ],
                  },
                },
                { kind: 'Field', name: { kind: 'Name', value: 'site' } },
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'collections' },
                  selectionSet: {
                    kind: 'SelectionSet',
                    selections: [
                      { kind: 'Field', name: { kind: 'Name', value: 'name' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'id' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'description' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'path' } },
                    ],
                  },
                },
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'comments' },
                  selectionSet: {
                    kind: 'SelectionSet',
                    selections: [{ kind: 'Field', name: { kind: 'Name', value: 'content' } }],
                  },
                },
              ],
            },
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode<GetNovelQuery, GetNovelQueryVariables>;
export const UpdateNovelByCrawlerDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'mutation',
      name: { kind: 'Name', value: 'updateNovelByCrawler' },
      variableDefinitions: [
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'novelId' } },
          type: { kind: 'NonNullType', type: { kind: 'NamedType', name: { kind: 'Name', value: 'Int' } } },
        },
      ],
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'updateNovelByCrawler' },
            arguments: [
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'novelId' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'novelId' } },
              },
            ],
            selectionSet: {
              kind: 'SelectionSet',
              selections: [{ kind: 'Field', name: { kind: 'Name', value: 'id' } }],
            },
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode<UpdateNovelByCrawlerMutation, UpdateNovelByCrawlerMutationVariables>;
export const DeleteCommentForNovelDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'mutation',
      name: { kind: 'Name', value: 'deleteCommentForNovel' },
      variableDefinitions: [
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'novelId' } },
          type: { kind: 'NonNullType', type: { kind: 'NamedType', name: { kind: 'Name', value: 'Int' } } },
        },
      ],
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'deleteCommentForNovel' },
            arguments: [
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'novelId' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'novelId' } },
              },
            ],
            selectionSet: {
              kind: 'SelectionSet',
              selections: [{ kind: 'Field', name: { kind: 'Name', value: '__typename' } }],
            },
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode<DeleteCommentForNovelMutation, DeleteCommentForNovelMutationVariables>;
export const DeleteCollectionForNovelDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'mutation',
      name: { kind: 'Name', value: 'deleteCollectionForNovel' },
      variableDefinitions: [
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'novelId' } },
          type: { kind: 'NonNullType', type: { kind: 'NamedType', name: { kind: 'Name', value: 'Int' } } },
        },
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'collectionId' } },
          type: { kind: 'NonNullType', type: { kind: 'NamedType', name: { kind: 'Name', value: 'Int' } } },
        },
      ],
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'deleteCollectionForNovel' },
            arguments: [
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'collectionId' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'collectionId' } },
              },
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'novelId' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'novelId' } },
              },
            ],
            selectionSet: {
              kind: 'SelectionSet',
              selections: [{ kind: 'Field', name: { kind: 'Name', value: 'id' } }],
            },
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode<DeleteCollectionForNovelMutation, DeleteCollectionForNovelMutationVariables>;
export const FetchNovelDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'query',
      name: { kind: 'Name', value: 'fetchNovel' },
      variableDefinitions: [
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'id' } },
          type: { kind: 'NonNullType', type: { kind: 'NamedType', name: { kind: 'Name', value: 'String' } } },
        },
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'novelSite' } },
          type: { kind: 'NonNullType', type: { kind: 'NamedType', name: { kind: 'Name', value: 'NovelSite' } } },
        },
      ],
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'fetchNovel' },
            arguments: [
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'id' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'id' } },
              },
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'novelSite' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'novelSite' } },
              },
            ],
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'author' },
                  selectionSet: {
                    kind: 'SelectionSet',
                    selections: [
                      { kind: 'Field', name: { kind: 'Name', value: 'description' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'image' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'name' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'url' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'id' } },
                    ],
                  },
                },
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'chapters' },
                  selectionSet: {
                    kind: 'SelectionSet',
                    selections: [
                      { kind: 'Field', name: { kind: 'Name', value: 'title' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'url' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'site' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'time' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'wordCount' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'id' } },
                    ],
                  },
                },
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'tags' },
                  selectionSet: {
                    kind: 'SelectionSet',
                    selections: [
                      { kind: 'Field', name: { kind: 'Name', value: 'id' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'name' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'url' } },
                    ],
                  },
                },
                { kind: 'Field', name: { kind: 'Name', value: 'description' } },
                { kind: 'Field', name: { kind: 'Name', value: 'image' } },
                { kind: 'Field', name: { kind: 'Name', value: 'name' } },
                { kind: 'Field', name: { kind: 'Name', value: 'url' } },
                { kind: 'Field', name: { kind: 'Name', value: 'site' } },
                { kind: 'Field', name: { kind: 'Name', value: 'status' } },
                { kind: 'Field', name: { kind: 'Name', value: 'id' } },
              ],
            },
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode<FetchNovelQuery, FetchNovelQueryVariables>;
export const SaveDraftNovelDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'mutation',
      name: { kind: 'Name', value: 'saveDraftNovel' },
      variableDefinitions: [
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'novel' } },
          type: { kind: 'NonNullType', type: { kind: 'NamedType', name: { kind: 'Name', value: 'SaveDraftNovel' } } },
        },
      ],
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'saveDraftNovel' },
            arguments: [
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'novel' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'novel' } },
              },
            ],
            selectionSet: {
              kind: 'SelectionSet',
              selections: [{ kind: 'Field', name: { kind: 'Name', value: 'id' } }],
            },
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode<SaveDraftNovelMutation, SaveDraftNovelMutationVariables>;
export const CreateNovelDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'mutation',
      name: { kind: 'Name', value: 'createNovel' },
      variableDefinitions: [
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'data' } },
          type: { kind: 'NonNullType', type: { kind: 'NamedType', name: { kind: 'Name', value: 'CreateNovelInput' } } },
        },
      ],
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'createNovel' },
            arguments: [
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'data' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'data' } },
              },
            ],
            selectionSet: {
              kind: 'SelectionSet',
              selections: [{ kind: 'Field', name: { kind: 'Name', value: 'id' } }],
            },
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode<CreateNovelMutation, CreateNovelMutationVariables>;
export const GetNovelsDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'query',
      name: { kind: 'Name', value: 'getNovels' },
      variableDefinitions: [
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'collectionMatch' } },
          type: { kind: 'NamedType', name: { kind: 'Name', value: 'TagMatch' } },
        },
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'novelStatus' } },
          type: { kind: 'NamedType', name: { kind: 'Name', value: 'NovelStatus' } },
        },
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'tagMatch' } },
          type: { kind: 'NamedType', name: { kind: 'Name', value: 'TagMatch' } },
        },
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'pagination' } },
          type: { kind: 'NonNullType', type: { kind: 'NamedType', name: { kind: 'Name', value: 'Pagination' } } },
        },
      ],
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'queryNovels' },
            arguments: [
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'collectionMatch' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'collectionMatch' } },
              },
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'novelStatus' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'novelStatus' } },
              },
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'tagMatch' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'tagMatch' } },
              },
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'pagination' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'pagination' } },
              },
            ],
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'data' },
                  selectionSet: {
                    kind: 'SelectionSet',
                    selections: [
                      { kind: 'Field', name: { kind: 'Name', value: 'id' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'name' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'description' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'createTime' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'updateTime' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'description' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'novelStatus' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'avatar' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'site' } },
                    ],
                  },
                },
                { kind: 'Field', name: { kind: 'Name', value: 'total' } },
              ],
            },
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode<GetNovelsQuery, GetNovelsQueryVariables>;
export const DeleteNovelDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'mutation',
      name: { kind: 'Name', value: 'deleteNovel' },
      variableDefinitions: [
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'id' } },
          type: { kind: 'NonNullType', type: { kind: 'NamedType', name: { kind: 'Name', value: 'Int' } } },
        },
      ],
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'deleteNovel' },
            arguments: [
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'id' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'id' } },
              },
            ],
            selectionSet: {
              kind: 'SelectionSet',
              selections: [{ kind: 'Field', name: { kind: 'Name', value: 'id' } }],
            },
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode<DeleteNovelMutation, DeleteNovelMutationVariables>;
export const CreateTagDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'mutation',
      name: { kind: 'Name', value: 'createTag' },
      variableDefinitions: [
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'name' } },
          type: { kind: 'NonNullType', type: { kind: 'NamedType', name: { kind: 'Name', value: 'String' } } },
        },
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'site' } },
          type: { kind: 'NonNullType', type: { kind: 'NamedType', name: { kind: 'Name', value: 'NovelSite' } } },
        },
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'siteId' } },
          type: { kind: 'NonNullType', type: { kind: 'NamedType', name: { kind: 'Name', value: 'String' } } },
        },
      ],
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'createTag' },
            arguments: [
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'name' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'name' } },
              },
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'site' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'site' } },
              },
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'siteId' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'siteId' } },
              },
            ],
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                { kind: 'Field', name: { kind: 'Name', value: 'name' } },
                { kind: 'Field', name: { kind: 'Name', value: 'id' } },
              ],
            },
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode<CreateTagMutation, CreateTagMutationVariables>;
export const GetTagsDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'query',
      name: { kind: 'Name', value: 'getTags' },
      variableDefinitions: [
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'pagination' } },
          type: { kind: 'NonNullType', type: { kind: 'NamedType', name: { kind: 'Name', value: 'Pagination' } } },
        },
      ],
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'queryTags' },
            arguments: [
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'pagination' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'pagination' } },
              },
            ],
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'data' },
                  selectionSet: {
                    kind: 'SelectionSet',
                    selections: [
                      { kind: 'Field', name: { kind: 'Name', value: 'name' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'id' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'site' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'url' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'createTime' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'updateTime' } },
                    ],
                  },
                },
                { kind: 'Field', name: { kind: 'Name', value: 'total' } },
              ],
            },
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode<GetTagsQuery, GetTagsQueryVariables>;
export const DeleteTagDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'mutation',
      name: { kind: 'Name', value: 'deleteTag' },
      variableDefinitions: [
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'id' } },
          type: { kind: 'NonNullType', type: { kind: 'NamedType', name: { kind: 'Name', value: 'Int' } } },
        },
      ],
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'deleteTag' },
            arguments: [
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'id' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'id' } },
              },
            ],
            selectionSet: {
              kind: 'SelectionSet',
              selections: [{ kind: 'Field', name: { kind: 'Name', value: 'id' } }],
            },
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode<DeleteTagMutation, DeleteTagMutationVariables>;
