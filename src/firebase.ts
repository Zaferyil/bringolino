import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc, getDocs, doc, updateDoc, deleteDoc, onSnapshot, query, orderBy } from 'firebase/firestore';
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

// Task interface
export interface BringolinoTask {
  id?: string;
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'pending' | 'in-progress' | 'completed';
  assignedTo?: string;
  department: string;
  location: string;
  dueDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// Bringolino için özel functions
export const addBringolinoTask = async (task: Omit<BringolinoTask, 'id' | 'createdAt' | 'updatedAt'>) => {
  try {
    const docRef = await addDoc(collection(db, "bringolino_tasks"), {
      ...task,
      createdAt: new Date(),
      updatedAt: new Date()
    });
    return docRef.id;
  } catch (e) {
    console.error("Error adding task: ", e);
    throw e;
  }
};

export const getBringolinoTasks = async (): Promise<BringolinoTask[]> => {
  try {
    const q = query(collection(db, "bringolino_tasks"), orderBy("createdAt", "desc"));
    const querySnapshot = await getDocs(q);
    const tasks: BringolinoTask[] = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      tasks.push({ 
        id: doc.id, 
        ...data,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
        dueDate: data.dueDate?.toDate() || undefined
      } as BringolinoTask);
    });
    return tasks;
  } catch (e) {
    console.error("Error getting tasks: ", e);
    throw e;
  }
};

export const updateBringolinoTask = async (taskId: string, updates: Partial<BringolinoTask>) => {
  try {
    await updateDoc(doc(db, "bringolino_tasks", taskId), {
      ...updates,
      updatedAt: new Date()
    });
  } catch (e) {
    console.error("Error updating task: ", e);
    throw e;
  }
};

export const deleteBringolinoTask = async (taskId: string) => {
  try {
    await deleteDoc(doc(db, "bringolino_tasks", taskId));
  } catch (e) {
    console.error("Error deleting task: ", e);
    throw e;
  }
};

// Dashboard için task dinleme fonksiyonu
export const listenToAllTasks = (callback: (tasks: BringolinoTask[]) => void) => {
  try {
    const q = query(collection(db, "bringolino_tasks"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const tasks: BringolinoTask[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        tasks.push({ 
          id: doc.id, 
          ...data,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
          dueDate: data.dueDate?.toDate() || undefined
        } as BringolinoTask);
      });
      callback(tasks);
    });
    return unsubscribe;
  } catch (e) {
    console.error("Error listening to tasks: ", e);
    return () => {};
  }
};