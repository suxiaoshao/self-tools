import type { CodegenConfig } from '@graphql-codegen/cli';

export function codegenConfig(output = './src/gql/'): CodegenConfig {
  return {
    schema: './schema.graphql',
    documents: ['./src/**/*.graphql', '!./src/gql/**', '!./src/**/fixtures/**'],
    generates: {
      [`${output}/graphql.ts`]: {
        plugins: ['typescript-operations', 'typed-document-node'],
        config: {
          scalars: {
            DateTime: 'string',
          },
        },
      },
    },
  };
}
export default codegenConfig(process.env.GRAPHQL_OUTPUT_DIR);
