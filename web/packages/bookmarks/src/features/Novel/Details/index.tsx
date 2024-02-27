/*
 * @Author: suxiaoshao suxiaoshao@gmail.com
 * @Date: 2024-02-28 04:24:47
 * @LastEditors: suxiaoshao suxiaoshao@gmail.com
 * @LastEditTime: 2024-02-28 05:01:20
 * @FilePath: /self-tools/web/packages/bookmarks/src/features/Novel/Details/index.tsx
 */
import { useGetNovelQuery } from '@bookmarks/graphql';
import { Avatar, Box, Card, CardHeader, Tooltip } from '@mui/material';
import { useParams } from 'react-router-dom';

export default function NovelDetails() {
  const { novelId } = useParams();
  const { data, loading } = useGetNovelQuery({ variables: { id: Number(novelId) } });
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', width: '100%', p: 2 }}>
      {data?.getNovel && (
        <Card
          sx={{
            margin: 1,
            marginTop: 0,
            height: (theme) => `calc(100% - ${theme.spacing(1)})`,
            overflow: 'auto',
          }}
        >
          <CardHeader
            // avatar={<Avatar src={data.getNovel} />}
            title={data.getNovel.name}
            subheader={data.getNovel.author.name}
          />
        </Card>
      )}
    </Box>
  );
}
