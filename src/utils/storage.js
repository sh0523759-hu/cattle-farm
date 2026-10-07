// Multi-Tenant LocalStorage manager for Cattle Farm ERP

export const getStorageData = (key, defaultValue) => {
  try {
    const item = localStorage.getItem(`cattle_erp_${key}`);
    return item ? JSON.parse(item) : defaultValue;
  } catch (error) {
    console.error(`Error loading key ${key} from LocalStorage`, error);
    return defaultValue;
  }
};

export const setStorageData = (key, value) => {
  try {
    localStorage.setItem(`cattle_erp_${key}`, JSON.stringify(value));
  } catch (error) {
    console.error(`Error saving key ${key} to LocalStorage`, error);
  }
};

export const removeStorageData = (key) => {
  try {
    localStorage.removeItem(`cattle_erp_${key}`);
  } catch (error) {
    console.error(`Error removing key ${key} from LocalStorage`, error);
  }
};

// --- Tenant Scoped Storage Helpers --- //

export const getTenantStorageData = (tenantId, key, defaultValue) => {
  if (!tenantId) return defaultValue;
  const fullKey = `cattle_erp_${tenantId}_${key}`;
  try {
    const item = localStorage.getItem(fullKey);
    return item ? JSON.parse(item) : defaultValue;
  } catch (error) {
    console.error(`Error loading key ${fullKey} from LocalStorage`, error);
    return defaultValue;
  }
};

export const setTenantStorageData = (tenantId, key, value) => {
  if (!tenantId) return;
  const fullKey = `cattle_erp_${tenantId}_${key}`;
  try {
    localStorage.setItem(fullKey, JSON.stringify(value));
  } catch (error) {
    console.error(`Error saving key ${fullKey} to LocalStorage`, error);
  }
};

export const removeTenantStorageData = (tenantId, key) => {
  if (!tenantId) return;
  const fullKey = `cattle_erp_${tenantId}_${key}`;
  try {
    localStorage.removeItem(fullKey);
  } catch (error) {
    console.error(`Error removing key ${fullKey} from LocalStorage`, error);
  }
};

export const clearTenantStorage = (tenantId) => {
  if (!tenantId) return;
  try {
    const prefix = `cattle_erp_${tenantId}_`;
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith(prefix)) {
        localStorage.removeItem(key);
      }
    });
  } catch (error) {
    console.error(`Error clearing tenant storage for ${tenantId}`, error);
  }
};

export const clearAllStorageData = () => {
  try {
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith('cattle_erp_')) {
        localStorage.removeItem(key);
      }
    });
  } catch (error) {
    console.error(`Error clearing LocalStorage`, error);
  }
};

