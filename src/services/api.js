// Client-Side Mock API Service for Standalone Cattle ERP Frontend
// Eliminates external backend dependencies so all features run locally in-browser.

export const api = {
  async get() {
    return { success: true, data: null, message: 'Local client mode active' };
  },

  async post(_endpoint, body) {
    return { success: true, data: body, message: 'Local client mode active' };
  },

  async put(_endpoint, body) {
    return { success: true, data: body, message: 'Local client mode active' };
  },

  async delete() {
    return { success: true, message: 'Deleted in local client mode' };
  }
};
