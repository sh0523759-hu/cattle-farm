import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

export const DEFAULT_USERS = [
  {
    id: 'usr_admin',
    name: 'Farm Admin',
    email: 'admin@cattleerp.com',
    password: 'admin123',
    role: 'Farm Manager',
    farmName: 'CattlePro ERP',
    erpAccess: true,
    currentPlan: 'Plan B (Full ERP Suite)'
  },
  {
    id: 'usr_almadina',
    name: 'Tariq Mahmood',
    email: 'almadina@farm.com',
    password: 'farm123',
    role: 'Farm Owner',
    farmName: 'Al-Madina Cattle Farm',
    erpAccess: true,
    currentPlan: 'Plan B (Full ERP Suite)'
  }
];

export const AuthProvider = ({ children }) => {
  const [users, setUsers] = useState(() => {
    try {
      const storedUsers = localStorage.getItem('cattle_erp_registered_users');
      if (storedUsers) {
        const parsed = JSON.parse(storedUsers);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {}
    localStorage.setItem('cattle_erp_registered_users', JSON.stringify(DEFAULT_USERS));
    return DEFAULT_USERS;
  });

  const [user, setUser] = useState(() => {
    const storedUser = localStorage.getItem('cattle_erp_user');
    if (storedUser) {
      try {
        const parsed = JSON.parse(storedUser);
        if (parsed && (parsed.id || parsed._id)) {
          return {
            ...parsed,
            erpAccess: true,
            currentPlan: parsed.currentPlan || 'Plan B (Full ERP Suite)'
          };
        }
      } catch (e) {}
    }
    // If no stored session, initialize with default Admin session so app opens immediately
    const defaultUser = DEFAULT_USERS[0];
    localStorage.setItem('cattle_erp_user', JSON.stringify(defaultUser));
    localStorage.setItem('cattle_erp_token', 'local_token_admin');
    return defaultUser;
  });

  const [isAuthenticated, setIsAuthenticated] = useState(() => Boolean(user));
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem('cattle_erp_registered_users', JSON.stringify(users));
    } catch (e) {}
  }, [users]);

  // Helper to clear session
  const _clearSession = () => {
    setIsAuthenticated(false);
    setUser(null);
    localStorage.removeItem('cattle_erp_token');
    localStorage.removeItem('cattle_erp_user');
    localStorage.removeItem('cattle_erp_auth');
  };

  // Standalone Registration
  const register = async ({ name, email, password, farmName, phone, city }) => {
    if (!email || !password || !name) {
      return { success: false, message: 'Please fill in all required fields.' };
    }

    if (password.length < 4) {
      return { success: false, message: 'Password must be at least 4 characters long.' };
    }

    const cleanEmail = email.trim().toLowerCase();
    const existingUser = users.find(u => u.email.toLowerCase() === cleanEmail);
    if (existingUser) {
      return { success: false, message: 'An account with this email address already exists. Please sign in instead.' };
    }

    const tenantId = `usr_${cleanEmail.replace(/[^a-z0-9]/g, '_')}`;
    const newUser = {
      id: tenantId,
      name: name.trim(),
      email: cleanEmail,
      password: password,
      role: 'Farm Owner',
      farmName: (farmName || `${name.trim()}'s Cattle Farm`).trim(),
      erpAccess: true,
      currentPlan: 'Plan B (Full ERP Suite)',
      phone: phone || '0300-0000000',
      city: city || 'Punjab'
    };

    const updatedUsers = [...users, newUser];
    setUsers(updatedUsers);
    localStorage.setItem('cattle_erp_registered_users', JSON.stringify(updatedUsers));

    const loggedInUser = {
      id: newUser.id,
      name: newUser.name,
      email: newUser.email,
      role: newUser.role,
      farmName: newUser.farmName,
      erpAccess: true,
      currentPlan: newUser.currentPlan
    };

    localStorage.setItem('cattle_erp_token', `local_token_${tenantId}`);
    localStorage.setItem('cattle_erp_user', JSON.stringify(loggedInUser));
    setUser(loggedInUser);
    setIsAuthenticated(true);

    return { success: true, user: loggedInUser };
  };

  // Standalone Login
  const login = async (email, password) => {
    if (!email || !password) {
      return { success: false, message: 'Please enter both email and password.' };
    }

    if (password.length < 4) {
      return { success: false, message: 'Password must be at least 4 characters long.' };
    }

    const cleanEmail = email.trim().toLowerCase();
    let targetUser = users.find(u => u.email.toLowerCase() === cleanEmail);

    if (targetUser) {
      if (targetUser.password && targetUser.password !== password) {
        return { success: false, message: 'Incorrect password. Please try again.' };
      }
    } else {
      // Auto-register user on client side if new
      const tenantId = `usr_${cleanEmail.replace(/[^a-z0-9]/g, '_')}`;
      const defaultName = cleanEmail.split('@')[0].replace(/[^a-zA-Z0-9]/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) || 'Farm Owner';
      targetUser = {
        id: tenantId,
        name: defaultName,
        email: cleanEmail,
        password: password,
        role: 'Farm Owner',
        farmName: `${defaultName}'s Farm`,
        erpAccess: true,
        currentPlan: 'Plan B (Full ERP Suite)'
      };
      const updatedUsers = [...users, targetUser];
      setUsers(updatedUsers);
      localStorage.setItem('cattle_erp_registered_users', JSON.stringify(updatedUsers));
    }

    const loggedInUser = {
      id: targetUser.id,
      name: targetUser.name,
      email: targetUser.email,
      role: targetUser.role || 'Farm Manager',
      farmName: targetUser.farmName || 'CattlePro ERP',
      erpAccess: true,
      currentPlan: targetUser.currentPlan || 'Plan B (Full ERP Suite)'
    };

    localStorage.setItem('cattle_erp_token', `local_token_${loggedInUser.id}`);
    localStorage.setItem('cattle_erp_user', JSON.stringify(loggedInUser));
    setUser(loggedInUser);
    setIsAuthenticated(true);

    return { success: true, user: loggedInUser };
  };

  const logout = () => {
    _clearSession();
  };

  const updateUser = (updatedFields) => {
    const updatedUser = { ...user, ...updatedFields };
    setUser(updatedUser);
    localStorage.setItem('cattle_erp_user', JSON.stringify(updatedUser));
    setUsers(prev => prev.map(u => u.id === (user?.id || user?._id) ? { ...u, ...updatedFields } : u));
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        loading,
        user,
        users,
        login,
        register,
        logout,
        updateUser
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
