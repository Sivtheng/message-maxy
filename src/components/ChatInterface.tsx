import React, { useState, useEffect } from 'react';
import { User, Message, getMessages, sendMessageWithMedia } from '../utils/firebase';

interface ChatInterfaceProps {
    currentUser: User;
    selectedUser: User | null;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({ currentUser, selectedUser }) => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState('');

    useEffect(() => {
        if (selectedUser) {
            const fetchMessages = async () => {
                const fetchedMessages = await getMessages(currentUser.uid);
                setMessages(fetchedMessages.filter(
                    (msg) => msg.senderID === selectedUser.uid || msg.receiverID === selectedUser.uid
                ));
            };
            fetchMessages();
        }
    }, [selectedUser, currentUser]);

    const handleSendMessage = async () => {
        if (newMessage.trim() && selectedUser) {
            await sendMessageWithMedia(currentUser.uid, selectedUser.uid, newMessage, null);
            setNewMessage('');
            // Refresh messages
            const updatedMessages = await getMessages(currentUser.uid);
            setMessages(updatedMessages.filter(
                (msg) => msg.senderID === selectedUser.uid || msg.receiverID === selectedUser.uid
            ));
        }
    };

    return (
        <div className="w-2/3 bg-white flex flex-col h-full">
            {selectedUser ? (
                <>
                    <h2 className="text-xl font-bold p-4">{selectedUser.name || selectedUser.email}</h2>
                    <div className="flex-grow overflow-y-auto px-4 pb-4">
                        {messages.map((message) => (
                            <div
                                key={message.id}
                                className={`mb-2 p-2 rounded ${
                                    message.senderID === currentUser.uid ? 'bg-blue-100 ml-auto' : 'bg-gray-100'
                                }`}
                            >
                                {message.content}
                            </div>
                        ))}
                    </div>
                    <div className="p-4 border-t">
                        <div className="flex">
                            <input
                                type="text"
                                value={newMessage}
                                onChange={(e) => setNewMessage(e.target.value)}
                                className="flex-grow border rounded-l p-2"
                                placeholder="Type a message..."
                            />
                            <button
                                onClick={handleSendMessage}
                                className="bg-blue-500 text-white px-4 py-2 rounded-r"
                            >
                                Send
                            </button>
                        </div>
                    </div>
                </>
            ) : (
                <p className="text-center text-gray-500 p-4">Select a user to start chatting</p>
            )}
        </div>
    );
};

export default ChatInterface;