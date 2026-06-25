// ===== Авторизация =====
const Auth = {
  token: null,
  user: null,

  hasToken() {
    return !!localStorage.getItem('authToken');
  },

  getToken() {
    return localStorage.getItem('authToken') || null;
  },

  setToken(username, role) {
    localStorage.setItem('authToken', username);
    localStorage.setItem('userRole', role);
    this.token = username;
    this.user = { username, role };
  },

  clearToken() {
    localStorage.removeItem('authToken');
    localStorage.removeItem('userRole');
    this.token = null;
    this.user = null;
  },

  async login(username, password) {
    const response = await API.login(username, password);
    if (response.status === 'ok') {
      this.setToken(response.user.username, response.user.role);
      return response.user;
    }
    throw new Error(response.message || 'Неверное имя пользователя или пароль');
  },

  async validate() {
    const token = this.getToken();
    if (!token) return null;
    try {
      const response = await API.validate(token);
      if (response.status === 'ok') {
        this.user = response.user;
        return response.user;
      } else {
        this.clearToken();
        return null;
      }
    } catch (err) {
      this.clearToken();
      return null;
    }
  },

  logout() {
    this.clearToken();
    Cache.clearAll();
    window.location.reload();
  },

  getUser() {
    return this.user;
  },

  isAdmin() {
    return this.user && this.user.role === 'admin';
  }
};