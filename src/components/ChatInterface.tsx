import React, { useState, useEffect, KeyboardEvent, useRef } from 'react';
import { User, Message, addMessage, onMessagesUpdate } from '../utils/firebase';

interface ChatInterfaceProps {
    currentUser: User;
    selectedUser: User | null;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({ currentUser, selectedUser }) => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState('');
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

    return (
        <div className="w-2/3 bg-white flex flex-col h-full">
            {selectedUser ? (
                <>
                    <h2 className="text-xl font-bold p-4 border-b">{selectedUser.name || selectedUser.email}</h2>
                    <div className="flex-grow overflow-y-auto p-4 space-y-4">
                        {messages.map((message) => (
                            <div
                                key={message.id}
                                className={`flex ${
                                    message.senderID === currentUser.uid ? 'justify-end' : 'justify-start'
                                }`}
                            >
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
                            placeholder="Type a message and press Enter to send..."
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