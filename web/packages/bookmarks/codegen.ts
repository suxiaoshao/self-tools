import type { CodegenConfig } from '@graphql-codegen/cli';

export function codegenConfig(output = './src/gql/'): CodegenConfig {
  return {
    schema: './schema.graphql',
    documents: ['./src/**/*.tsx', './src/**/*.ts', '!./src/gql/**', '!./src/**/*.test.*', '!./src/**/fixtures/**'],
    generates: {
      [output]: {
        preset: 'client',
        config: {
          scalars: {
            BigDecimal: 'string',
            DateTime: 'string',
          },
        },
      },
    },
  };
}
export default codegenConfig(process.env.GRAPHQL_OUTPUT_DIR);
