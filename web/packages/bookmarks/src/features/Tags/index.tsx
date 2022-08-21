import { Box } from '@mui/material';
import { Controller, useForm } from 'react-hook-form';
import CollectionSelect from '../../components/CollectionSelect';
import { CreateTagMutationVariables } from '../../graphql';
type FormData = CreateTagMutationVariables;
export default function Tags() {
  const { control } = useForm<FormData>();

  return (
    <Box>
      <Controller
        control={control}
        name="collectionId"
        render={({ field }) => <CollectionSelect sx={{ m: 1, width: '100' }} {...field} />}
      />
    </Box>
  );
}
