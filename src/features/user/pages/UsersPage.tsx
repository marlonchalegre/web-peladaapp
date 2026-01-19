import { useState, useEffect } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  TablePagination,
  Typography,
} from '@mui/material';
import { getUsers, type User, type PaginatedUsers } from '../../../shared/api/user';
import { useTranslation } from 'react-i18next';

const UsersPage = () => {
  const { t } = useTranslation();
  const [users, setUsers] = useState<User[]>([]);
  const [pagination, setPagination] = useState({
    page: 1,
    per_page: 10,
    total: 0,
    totalPages: 0,
  });

  useEffect(() => {
    const fetchUsers = async () => {
      const result: PaginatedUsers = await getUsers({
        page: pagination.page,
        per_page: pagination.per_page,
      });
      setUsers(result.data);
      setPagination((prev) => ({
        ...prev,
        total: result.total,
        totalPages: result.totalPages,
      }));
    };
    fetchUsers();
  }, [pagination.page, pagination.per_page]);

  const handleChangePage = (_event: unknown, newPage: number) => {
    setPagination((prev) => ({ ...prev, page: newPage + 1 }));
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setPagination({
      ...pagination,
      per_page: parseInt(event.target.value, 10),
      page: 1,
    });
  };

  return (
    <>
      <Typography variant="h4" component="h1" gutterBottom>
        {t('user.list.title')}
      </Typography>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>{t('common.fields.id')}</TableCell>
              <TableCell>{t('common.fields.name')}</TableCell>
              <TableCell>{t('common.fields.email')}</TableCell>
              <TableCell>{t('common.fields.score')}</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user.id}>
                <TableCell>{user.id}</TableCell>
                <TableCell>{user.name}</TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>{user.score}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={pagination.total}
          rowsPerPage={pagination.per_page}
          page={pagination.page - 1}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          labelRowsPerPage={t('common.pagination.rows_per_page')}
        />
      </TableContainer>
    </>
  );
};

export default UsersPage;
