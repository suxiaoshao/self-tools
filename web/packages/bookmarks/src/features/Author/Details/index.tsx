/*
 * @Author: suxiaoshao suxiaoshao@gmail.com
 * @Date: 2024-02-29 06:28:45
 * @LastEditors: suxiaoshao suxiaoshao@gmail.com
 * @LastEditTime: 2024-02-29 07:10:10
 * @FilePath: /self-tools/web/packages/bookmarks/src/features/Author/Details/index.tsx
 */
import { useGetAuthorQuery } from '@bookmarks/graphql';
import { KeyboardArrowLeft } from '@mui/icons-material';
import { Box, IconButton } from '@mui/material';
import { useNavigate, useParams } from 'react-router-dom';

export default function AuthorDetails() {
  const { authorId } = useParams();
  const { data, loading, refetch } = useGetAuthorQuery({ variables: { id: Number(authorId) } });
  const navigate = useNavigate();
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', width: '100%', p: 2 }}>
      <Box>
        <IconButton onClick={() => navigate(-1)}>
          <KeyboardArrowLeft />
        </IconButton>
      </Box>
      author
    </Box>
  );
}
