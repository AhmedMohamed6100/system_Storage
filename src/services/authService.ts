import { User, AuthState } from '../types';
import { getItem, setItem, STORAGE_KEYS } from '../utils/storage';
import { generateId, today } from '../utils/formatters';

const DEFAULT_ADMIN: User = {
  id: 'admin-root',
  username: 'admin',
  password: '2580',
  role: 'administrator',
  createdAt: today(),
};

const RECOVERY_KEY = 'abdallah123456a';

function initUsers(): User[] {
  const users = getItem<User[]>(STORAGE_KEYS.USERS, []);
  if (!users.find(u => u.id === 'admin-root')) {
    const updated = [DEFAULT_ADMIN, ...users];
    setItem(STORAGE_KEYS.USERS, updated);
    return updated;
  }
  return users;
}

export const authService = {
  login(username: string, password: string): User | null {
    const users = initUsers();
    const user = users.find(u => u.username === username && u.password === password);
    if (user) {
      const authState: AuthState = { isAuthenticated: true, currentUser: user };
      setItem(STORAGE_KEYS.AUTH, authState);
      return user;
    }
    return null;
  },

  loginWithRecoveryKey(key: string): User | null {
    if (key === RECOVERY_KEY) {
      const users = initUsers();
      const admin = users.find(u => u.id === 'admin-root') || DEFAULT_ADMIN;
      const authState: AuthState = { isAuthenticated: true, currentUser: admin };
      setItem(STORAGE_KEYS.AUTH, authState);
      return admin;
    }
    return null;
  },

  logout(): void {
    setItem(STORAGE_KEYS.AUTH, { isAuthenticated: false, currentUser: null });
  },

  getAuthState(): AuthState {
    return getItem<AuthState>(STORAGE_KEYS.AUTH, { isAuthenticated: false, currentUser: null });
  },

  getUsers(): User[] {
    return initUsers();
  },

  addUser(data: Omit<User, 'id' | 'createdAt'>): User {
    const users = initUsers();
    const user: User = { ...data, id: generateId(), createdAt: today() };
    setItem(STORAGE_KEYS.USERS, [...users, user]);
    return user;
  },

  updateUser(id: string, data: Partial<User>): User | null {
    const users = initUsers();
    const idx = users.findIndex(u => u.id === id);
    if (idx === -1) return null;
    users[idx] = { ...users[idx], ...data };
    setItem(STORAGE_KEYS.USERS, users);
    return users[idx];
  },

  deleteUser(id: string): boolean {
    if (id === 'admin-root') return false;
    const users = initUsers();
    const filtered = users.filter(u => u.id !== id);
    setItem(STORAGE_KEYS.USERS, filtered);
    return true;
  },
};
