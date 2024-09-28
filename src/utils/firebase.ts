import { doc, setDoc, collection, getDoc, addDoc, serverTimestamp, getDocs, query, where, orderBy, Timestamp, deleteDoc, limit } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, deleteUser } from "firebase/auth";
import { getFirebase } from './firebase-config';

import { User as FirebaseUser } from 'firebase/auth';
import { onSnapshot } from 'firebase/firestore';

// Define CustomUser type
export interface CustomUser extends FirebaseUser {
    name?: string;
}

// Use CustomUser type instead of User
export type User = CustomUser;

// Define Message type
export type Message = {
    id: string;
    senderID: string;
    receiverID: string;
    content: string;
    timestamp: Timestamp;
    mediaType?: 'image' | 'video';
    mediaUrl?: string;
};

// Initialize Firebase app, Firestore, and Storage
const { app, auth, db, storage } = getFirebase();

// Add a new user to the 'users' collection
export const addUser = async (user: { name: string; email: string }, uid: string) => {
    if (!db) return;
    
    try {
        await setDoc(doc(db, 'users', uid), {
            name: user.name,
            email: user.email,
            createdAt: serverTimestamp()
        });
        console.log("User added successfully");
    } catch (error) {
        console.error("Error adding user: ", error);
        throw error;
    }
};

// Retrieve a user by their ID from the 'users' collection
export const getUser = async (userId: string): Promise<User | null> => {
    if (!db) return null;
    const userDoc = doc(db, 'users', userId);
    const docSnap = await getDoc(userDoc);
    const userData = docSnap.data();
    if (!docSnap.exists() || !userData) return null;
    const user: CustomUser = {
        ...userData as Omit<CustomUser, 'id'>,
    };
    return {
        ...user,
        delete: async () => {
            if (auth && auth.currentUser) {
                await deleteUser(auth.currentUser);
            }
            await deleteDoc(userDoc);
        },
        toJSON: () => ({ ...user })
    } as User;
};

// Add a new message to the 'messages' collection
export const addMessage = async (message: Omit<Message, 'id' | 'timestamp'>): Promise<string | null> => {
    if (!db) return null;
    const docRef = await addDoc(collection(db, 'messages'), {
        ...message,
        timestamp: serverTimestamp(),
    });
    return docRef.id;
};

// Retrieve messages for a specific user, ordered by timestamp
export const getMessages = async (currentUserId: string, selectedUserId: string): Promise<Message[]> => {
    if (!db) return [];
    const messagesRef = collection(db, 'messages');
    
    const q1 = query(messagesRef,
        where('receiverID', '==', selectedUserId),
        where('senderID', '==', currentUserId),
        orderBy('timestamp', 'asc')
    );
    
    const q2 = query(messagesRef,
        where('receiverID', '==', currentUserId),
        where('senderID', '==', selectedUserId),
        orderBy('timestamp', 'asc')
    );
    
    const [snapshot1, snapshot2] = await Promise.all([getDocs(q1), getDocs(q2)]);
    
    const messages1 = snapshot1.docs.map(doc => ({ id: doc.id, ...doc.data() } as Message));
    const messages2 = snapshot2.docs.map(doc => ({ id: doc.id, ...doc.data() } as Message));
    
    return [...messages1, ...messages2].sort((a, b) => a.timestamp.toMillis() - b.timestamp.toMillis());
};

// Upload a media file to Firebase Storage
export const uploadMedia = async (file: File, path: string): Promise<string | null> => {
    if (!storage) return null;
    const storageRef = ref(storage, path);
    await uploadBytes(storageRef, file);
    return getDownloadURL(storageRef);
};

// Send a message with optional media attachment
export const sendMessageWithMedia = async (
    senderID: string,
    receiverID: string,
    content: string,
    mediaFile: File | null
): Promise<string | null> => {
    if (!mediaFile) {
        return addMessage({ senderID, receiverID, content });
    }

    const mediaType = mediaFile.type.startsWith('image/') ? 'image' : 'video';
    const mediaUrl = await uploadMedia(mediaFile, `messages/${senderID}/${Date.now()}_${mediaFile.name}`);

    if (!mediaUrl) return null;

    return addMessage({
        senderID,
        receiverID,
        content,
        mediaType,
        mediaUrl,
    });
};

// Sign up a new user
export const signUp = async (email: string, password: string): Promise<string | null> => {
    if (!auth) return null;
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    return userCredential.user.uid;
};

// Sign in an existing user
export const signIn = async (emailOrUsername: string, password: string): Promise<string | null> => {
    const { auth, db } = getFirebase();
    if (!auth || !db) {
        console.error("Firebase not initialized");
        return null;
    }

    try {
        // First, try to sign in assuming the input is an email
        console.log("Attempting to sign in with email:", emailOrUsername);
        const userCredential = await signInWithEmailAndPassword(auth, emailOrUsername, password);
        console.log("Sign in successful:", userCredential.user.uid);
        return userCredential.user.uid;
    } catch (error) {
        console.error("Error during email sign in:", error);
        
        // If email sign-in fails, try to find the user by username
        try {
            console.log("Attempting to find user by username:", emailOrUsername);
            const usersRef = collection(db, 'users');
            const q = query(usersRef, where('name', '==', emailOrUsername));
            const querySnapshot = await getDocs(q);
            
            if (!querySnapshot.empty) {
                const userDoc = querySnapshot.docs[0];
                const userEmail = userDoc.data().email;
                console.log("Found user by username, attempting sign in with email:", userEmail);
                
                // Now try to sign in with the found email
                const userCredential = await signInWithEmailAndPassword(auth, userEmail, password);
                console.log("Sign in successful:", userCredential.user.uid);
                return userCredential.user.uid;
            } else {
                console.log("No user found with the given username");
                throw new Error("Invalid username or password");
            }
        } catch (usernameError) {
            console.error("Error during username sign in:", usernameError);
            throw new Error("Invalid username or password");
        }
    }
};

// Sign out the current user
export const signOutUser = async (): Promise<void> => {
    if (!auth) throw new Error("Firebase Auth not initialized");
    await signOut(auth);
};

// Get the current user
export const getCurrentUser = async (): Promise<CustomUser | null> => {
    if (!auth || !db) return null;
    const firebaseUser = auth.currentUser;
    if (!firebaseUser) return null;
    
    const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
    if (userDoc.exists()) {
        const userData = userDoc.data();
        return {
            ...firebaseUser,
            name: userData.name || '',
        } as CustomUser;
    }
    return firebaseUser as CustomUser;
};

export { getFirebase };
// Delete user from Firebase Auth
export const deleteUserAuth = async (): Promise<void> => {
    if (!auth || !db) throw new Error("Firebase Auth or Firestore not initialized");

    const user = auth.currentUser;
    if (!user) throw new Error("No user is currently signed in");

    try {
        // Delete user's messages
        const messagesRef = collection(db, 'messages');
        const userMessagesQuery = query(messagesRef, where('senderID', '==', user.uid));
        const querySnapshot = await getDocs(userMessagesQuery);
        const deletePromises = querySnapshot.docs.map(doc => deleteDoc(doc.ref));
        await Promise.all(deletePromises);

        // Delete user document from Firestore
        const userDocRef = doc(db, 'users', user.uid);
        await deleteDoc(userDocRef);

        // Delete user from Authentication
        await deleteUser(user);

        console.log("User and associated data deleted successfully");
    } catch (error) {
        console.error("Error deleting user and associated data:", error);
        throw error;
    }
};

// Add this function after the existing functions
export const getAllUsers = async (currentUserId: string, limitCount: number = 20): Promise<User[]> => {
    if (!db) return [];
    const usersRef = collection(db, 'users');
    const q = query(usersRef, limit(limitCount));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs
        .map(doc => ({ ...doc.data(), uid: doc.id } as User))
        .filter(user => user.uid !== currentUserId);
};

export const onMessagesUpdate = (
    currentUserId: string,
    selectedUserId: string,
    callback: (messages: Message[]) => void
) => {
    if (!db) return () => {};

    const messagesRef = collection(db, 'messages');
    const q = query(
        messagesRef,
        where('senderID', 'in', [currentUserId, selectedUserId]),
        where('receiverID', 'in', [currentUserId, selectedUserId]),
        orderBy('timestamp', 'asc')
    );

    return onSnapshot(q, (snapshot) => {
        const messages = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Message));
        callback(messages);
    });
};