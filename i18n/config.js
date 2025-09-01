// i18n/config.js
export const LOCALES = ['en', 'es', 'fr'];

const EN = {
  'brand.name': 'Liason',
  'menu.home': 'Home',
  'menu.visas': 'Visas',
  'menu.about': 'About',
  'menu.policies': 'Policies',
  'menu.logout': 'Log out',
  'auth.login': 'Login',
  'auth.loggedIn': 'Logged in',
};

const ES = {
  'brand.name': 'Liason',
  'menu.home': 'Inicio',
  'menu.visas': 'Visas',
  'menu.about': 'Acerca de',
  'menu.policies': 'Políticas',
  'menu.logout': 'Cerrar sesión',
  'auth.login': 'Iniciar sesión',
  'auth.loggedIn': 'Conectado',
};

const FR = {
  'brand.name': 'Liason',
  'menu.home': 'Accueil',
  'menu.visas': 'Visas',
  'menu.about': 'À propos',
  'menu.policies': 'Politiques',
  'menu.logout': 'Se déconnecter',
  'auth.login': 'Connexion',
  'auth.loggedIn': 'Connecté',
};

export function getDict(locale) {
  switch ((locale || 'en').split('-')[0]) {
    case 'es': return ES;
    case 'fr': return FR;
    default:   return EN;
  }
}
