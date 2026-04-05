import { 
  db, 
  auth, 
  handleFirestoreError, 
  OperationType, 
  doc, 
  setDoc, 
  getDoc, 
  collection, 
  getDocs, 
  query, 
  where, 
  deleteDoc,
  updateDoc,
  orderBy,
  limit,
  onSnapshot
} from '../firebase';
import { User, Habit, Session, Note, SyllabusNode, AppState, ChatMessage } from '../types';

export const firebaseService = {
  // User Profile
  async saveUserProfile(userId: string, user: User) {
    const path = `users/${userId}`;
    try {
      await setDoc(doc(db, path), user);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  },

  async getUserProfile(userId: string): Promise<User | null> {
    const path = `users/${userId}`;
    try {
      const docSnap = await getDoc(doc(db, path));
      return docSnap.exists() ? docSnap.data() as User : null;
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, path);
      return null;
    }
  },

  // Habits
  async saveHabit(userId: string, habit: Habit) {
    const path = `users/${userId}/habits/${habit.id}`;
    try {
      await setDoc(doc(db, path), habit);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  },

  async deleteHabit(userId: string, habitId: string) {
    const path = `users/${userId}/habits/${habitId}`;
    try {
      await deleteDoc(doc(db, path));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
    }
  },

  async getHabits(userId: string): Promise<Habit[]> {
    const path = `users/${userId}/habits`;
    try {
      const querySnapshot = await getDocs(collection(db, path));
      return querySnapshot.docs.map(doc => doc.data() as Habit);
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, path);
      return [];
    }
  },

  // Sessions
  async saveSession(userId: string, session: Session) {
    const path = `users/${userId}/sessions/${session.id}`;
    try {
      await setDoc(doc(db, path), session);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  },

  async getSessions(userId: string): Promise<Session[]> {
    const path = `users/${userId}/sessions`;
    try {
      const querySnapshot = await getDocs(collection(db, path));
      return querySnapshot.docs.map(doc => doc.data() as Session);
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, path);
      return [];
    }
  },

  // Notes
  async saveNote(userId: string, note: Note) {
    const path = `users/${userId}/notes/${note.id}`;
    try {
      await setDoc(doc(db, path), note);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  },

  async deleteNote(userId: string, noteId: string) {
    const path = `users/${userId}/notes/${noteId}`;
    try {
      await deleteDoc(doc(db, path));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
    }
  },

  async getNotes(userId: string): Promise<Note[]> {
    const path = `users/${userId}/notes`;
    try {
      const querySnapshot = await getDocs(collection(db, path));
      return querySnapshot.docs.map(doc => doc.data() as Note);
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, path);
      return [];
    }
  },

  // Syllabus
  async saveSyllabus(userId: string, exam: string, nodes: SyllabusNode[]) {
    const path = `users/${userId}/syllabus/${exam}`;
    try {
      await setDoc(doc(db, path), { exam, nodes });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  },

  async getAllSyllabus(userId: string): Promise<Record<string, SyllabusNode[]>> {
    const path = `users/${userId}/syllabus`;
    try {
      const querySnapshot = await getDocs(collection(db, path));
      const syllabus: Record<string, SyllabusNode[]> = {};
      querySnapshot.forEach(doc => {
        const data = doc.data();
        syllabus[data.exam] = data.nodes;
      });
      return syllabus;
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, path);
      return {};
    }
  },

  // Full Load
  async loadAllUserData(userId: string): Promise<Partial<AppState>> {
    const [user, habits, sessions, notes, syllabus] = await Promise.all([
      this.getUserProfile(userId),
      this.getHabits(userId),
      this.getSessions(userId),
      this.getNotes(userId),
      this.getAllSyllabus(userId)
    ]);

    return {
      user: user || undefined,
      habits,
      sessions,
      notes,
      syllabus
    };
  },

  // Community Chat
  async sendChatMessage(message: Omit<ChatMessage, 'id'>) {
    const id = Math.random().toString(36).substr(2, 9);
    const path = `messages/${id}`;
    try {
      await setDoc(doc(db, path), { ...message, id });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  },

  subscribeToChat(callback: (messages: ChatMessage[]) => void) {
    const q = query(
      collection(db, 'messages'),
      orderBy('createdAt', 'desc'),
      limit(100)
    );

    return onSnapshot(q, (snapshot) => {
      const messages = snapshot.docs.map(doc => doc.data() as ChatMessage);
      callback(messages.reverse());
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'messages');
    });
  }
};
