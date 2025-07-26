import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc, getDocs, doc, updateDoc, deleteDoc, onSnapshot } from 'firebase/firestore';

import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyAaS4lIJE05GanvTrBBXVp4qtyCDrmNWpM",
  authDomain: "bringolino-cd14c.firebaseapp.com",
  projectId: "bringolino-cd14c",
  storageBucket: "bringolino-cd14c.firebasestorage.app",
  messagingSenderId: "3410277143",
  appId: "1:3410277143:web:160b8ee2e81dab4cfa3d52"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);

// Bringolino için özel functions
export const addBringolinoTask = async (task: any) => {
  try {
    const docRef = await addDoc(collection(db, "bringolino_tasks"), {
      ...task,
      createdAt: new Date(),
      updatedAt: new Date()
    });
    return docRef.id;
  } catch (e) {
    console.error("Error adding task: ", e);
  }
};

export const getBringolinoTasks = async () => {
  try {
    const querySnapshot = await getDocs(collection(db, "bringolino_tasks"));
    const tasks: any[] = [];
    querySnapshot.forEach((doc) => {
      tasks.push({ id: doc.id, ...doc.data() });
    });
    return tasks;
  } catch (e) {
    console.error("Error getting tasks: ", e);
  }
};

export const updateBringolinoTask = async (taskId: string, updates: any) => {
  try {
    await updateDoc(doc(db, "bringolino_tasks", taskId), {
      ...updates,
      updatedAt: new Date()
    });
  } catch (e) {
    console.error("Error updating task: ", e);
  }
};
// Dashboard için task dinleme fonksiyonu
export const listenToAllTasks = (callback: (tasks: any[]) => void) => {
  try {
    const unsubscribe = onSnapshot(collection(db, "bringolino_tasks"), (querySnapshot) => {
      const tasks: any[] = [];
      querySnapshot.forEach((doc) => {
        tasks.push({ id: doc.id, ...doc.data() });
      });
      callback(tasks);
    });
    return unsubscribe;
  } catch (e) {
    console.error("Error listening to tasks: ", e);
    return () => {};
  }
};
