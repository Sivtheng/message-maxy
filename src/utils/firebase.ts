import { getFirestore, doc, setDoc, collection, getDoc, addDoc, serverTimestamp, getDocs, query, where, orderBy, Timestamp, deleteDoc, limit } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, deleteUser } from "firebase/auth";
import { getFirebase } from './firebase-config';

import { User as FirebaseUser } from 'firebase/auth';

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
const app = getFirebase();
const db = app ? getFirestore(app) : undefined;
const storage = app ? getStorage(app) : undefined;

// Initialize Firebase Authentication
const auth = app ? getAuth(app) : undefined;

// Add a new user to the 'users' collection
export const addUser = async (user: Omit<User, 'id'>, userId: string): Promise<string | null> => {
    if (!db) return null;
    const userRef = doc(db, 'users', userId);
    await setDoc(userRef, { ...user, id: userId });
    return userId;
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
export const getMessages = async (userId: string): Promise<Message[]> => {
    if (!db) return [];
    const messagesRef = collection(db, 'messages');
    const q = query(messagesRef,
        where('receiverID', '==', userId),
        orderBy('timestamp', 'desc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Message));
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
    if (!auth || !db) return null;
    try {
        console.log("Attempting to sign in with:", emailOrUsername);
        const userCredential = await signInWithEmailAndPassword(auth, emailOrUsername, password);
        console.log("Sign in successful:", userCredential.user.uid);
        return userCredential.user.uid;
    } catch (error) {
        console.error("Error during email sign in:", error);
        // If email login fails, try to find the user by username
        try {
            const usersRef = collection(db, 'users');
            const q = query(usersRef, where('name', '==', emailOrUsername));
            const querySnapshot = await getDocs(q);
            if (!querySnapshot.empty) {
                const userDoc = querySnapshot.docs[0];
                const userEmail = userDoc.data().email;
                console.log("Found user by username, attempting sign in with email:", userEmail);
                const userCredential = await signInWithEmailAndPassword(auth, userEmail, password);
                console.log("Sign in successful:", userCredential.user.uid);
                return userCredential.user.uid;
            }
        } catch (usernameError) {
            console.error("Error during username sign in:", usernameError);
        }
        if (error instanceof Error) {
            if (error.message.includes('blocked')) {
                throw new Error("Sign-in failed. Please disable any ad blockers or security extensions and try again.");
            }
        }
        throw error; // If both email and username login fail, throw the original error
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
    const q = query(usersRef, where('id', '!=', currentUserId), limit(limitCount));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => doc.data() as User);
};
