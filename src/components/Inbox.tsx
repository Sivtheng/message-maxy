import React from 'react';
import { User } from '../utils/firebase';

interface InboxProps {
    users: User[];
    onSelectUser: (user: User) => void;
}

const Inbox: React.FC<InboxProps> = ({ users, onSelectUser }) => {
    return (
        <div className="w-1/3 bg-gray-100 flex flex-col h-full">
            <h2 className="text-xl font-bold p-4">Inbox</h2>
            <div className="flex-grow overflow-y-auto">
                {users.length > 0 ? (
                    <ul>
                        {users.map((user) => (
                            <li
                                key={user.uid}
                                className="cursor-pointer hover:bg-gray-200 p-2"
                                onClick={() => onSelectUser(user)}
                            >
                                {user.name || user.email}
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p className="text-center text-gray-500 p-4">No users available</p>
                )}
            </div>
        </div>
    );
};

export default Inbox;