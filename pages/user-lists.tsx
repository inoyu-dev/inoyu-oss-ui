import React from 'react';
import { NextPage } from 'next';
import RegistryPage from '@/components/shared/RegistryPage';
import UserListList from '@/components/user-lists/UserListList';

const UserLists: NextPage = () => (
  <RegistryPage route="/user-lists" defaultComponent={UserListList} />
);

export default UserLists;
