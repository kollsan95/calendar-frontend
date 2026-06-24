// ===== Авторизация =====

const Auth = {
  token: null,
  user: null,

  /**
   * Проверить, есть ли токен в localStorage
   */
  hasToken() {
    return !!localStorage.getItem('authToken');
  },

  /**
   * Получить токен
   */
  getToken() {
    return localStorage.getItem('authToken') || null;
  },

  /**
   * Сохранить токен
   */
  setToken(username, role) {
    localStorage.setItem('authToken', username);
    localStorage.setItem('userRole', role);
    this.token = username;
    this.user = { username, role };
  },

  /**
   * Очистить токен
   */
  clearToken() {
    localStorage.removeItem('authToken');
    localStorage.removeItem('userRole');
    this.token = null;
    this.user = null;
  },

  /**
   * Вход
   */
  async login(username, password) {
    const response = await API.login(username, password);
    if (response.status === 'ok') {
      this.setToken(response.user.username, response.user.role);
      return response.user;
    } else {
      throw new Error(response.message || 'Неверное имя пользователя или пароль');
    }
  },

  /**
   * Валидация токена
   */
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

  /**
   * Выход
   */
  logout() {
    this.clearToken();
    Cache.clearAll();
    window.location.reload();
  },

  /**
   * Получить текущего пользователя
   */
  getUser() {
    return this.user;
  },

  /**
   * Проверить, является ли пользователь админом
   */
  isAdmin() {
    return this.user && this.user.role === 'admin';
  }
};