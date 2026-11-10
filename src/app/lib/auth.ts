import Cookies from 'js-cookie';

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: 'GUEST' | 'HOST';
}

export const getToken = () => Cookies.get('token');
export const setToken = (token: string) => Cookies.set('token', token, { expires: 7 });
export const removeToken = () => Cookies.remove('token');
export const isAuthenticated = () => !!getToken();