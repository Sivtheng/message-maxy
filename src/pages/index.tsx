import React, { useState, useEffect } from "react";
import type { HeadFC, PageProps } from "gatsby";
import PrivateRoute from "../components/PrivateRoute";
import Navbar from "../components/Navbar";
import Inbox from "../components/Inbox";
import ChatInterface from "../components/ChatInterface";
import { User, getCurrentUser, getAllUsers } from "../utils/firebase";

const HomePage: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  useEffect(() => {
    const fetchCurrentUser = async () => {
      const user = await getCurrentUser();
      if (user) {
        setCurrentUser(user);
        fetchUsers(user.uid);
      }
    };

    const fetchUsers = async (currentUserId: string) => {
      const fetchedUsers = await getAllUsers(currentUserId);
      setUsers(fetchedUsers);
    };

    fetchCurrentUser();
  }, []);

  const handleSelectUser = (user: User) => {
    setSelectedUser(user);
  };

  return (
    <div className="flex flex-col h-screen">
      <Navbar />
      <main className="flex-grow flex overflow-hidden">
        <Inbox users={users} onSelectUser={handleSelectUser} />
        {currentUser && (
          <ChatInterface currentUser={currentUser} selectedUser={selectedUser} />
        )}
      </main>
    </div>
  );
};

const IndexPage: React.FC<PageProps> = () => (
  <PrivateRoute component={HomePage} />
);

export default IndexPage;

export const Head: HeadFC = () => <title>Home Page</title>;
