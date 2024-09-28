import React, { useState, useEffect, KeyboardEvent, useRef } from 'react';
import { User, Message, addMessage, onMessagesUpdate, deleteMessage } from '../utils/firebase';

interface ChatInterfaceProps {
    currentUser: User;
    selectedUser: User | null;
    customStyles?: string;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({ currentUser, selectedUser, customStyles = '' }) => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [showOptions, setShowOptions] = useState<string | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        if (selectedUser && currentUser) {
            const unsubscribe = onMessagesUpdate(currentUser.uid, selectedUser.uid, (updatedMessages) => {
                setMessages(updatedMessages);
            });

            return () => unsubscribe();
        }
    }, [selectedUser, currentUser]);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSendMessage = async () => {
        if (newMessage.trim() && selectedUser) {
            try {
                await addMessage({
                    senderID: currentUser.uid,
                    receiverID: selectedUser.uid,
                    content: newMessage.trim(),
                });
                setNewMessage('');
            } catch (error) {
                console.error("Error sending message:", error);
            }
        }
    };

    const handleKeyPress = (e: KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    const handleDeleteMessage = async (messageId: string) => {
        try {
            await deleteMessage(messageId);
            setShowOptions(null);
        } catch (error) {
            console.error("Error deleting message:", error);
        }
    };

    return (
        <div className={`bg-white flex flex-col h-full ${customStyles}`}>
            {selectedUser ? (
                <>
                    <h2 className="text-xl font-bold p-4 border-b">{selectedUser.name || selectedUser.email}</h2>
                    <div className="flex-grow overflow-y-auto p-4 space-y-4">
                        {messages.map((message) => (
                            <div
                                key={message.id}
                                className={`flex items-center ${
                                    message.senderID === currentUser.uid ? 'justify-end' : 'justify-start'
                                } group`}
                            >
                                {message.senderID === currentUser.uid && (
                                    <div className="mr-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                        <button
                                            onClick={() => setShowOptions(message.id)}
                                            className="text-gray-500 hover:text-gray-700 focus:outline-none bg-white rounded-full p-1 shadow-md"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                                <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                                            </svg>
                                        </button>
                                        {showOptions === message.id && (
                                            <div className="absolute mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-10">
                                                <div className="py-1" role="menu" aria-orientation="vertical" aria-labelledby="options-menu">
                                                    <button
                                                        onClick={() => handleDeleteMessage(message.id)}
                                                        className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                                                        role="menuitem"
                                                    >
                                                        Delete Message
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}
                                <div
                                    className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                                        message.senderID === currentUser.uid
                                            ? 'bg-blue-500 text-white'
                                            : 'bg-gray-200 text-gray-800'
                                    }`}
                                >
                                    {message.content}
                                </div>
                            </div>
                        ))}
                        <div ref={messagesEndRef} />
                    </div>
                    <div className="p-4 border-t">
                        <input
                            type="text"
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            onKeyPress={handleKeyPress}
                            className="w-full border rounded p-2"
                            placeholder="Say something..."
                        />
                    </div>
                </>
            ) : (
                <p className="text-center text-gray-500 p-4">Select a user to start chatting</p>
            )}
        </div>
    );
};

export default ChatInterface;