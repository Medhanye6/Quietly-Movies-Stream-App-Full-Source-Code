import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type LanguageCode = 'en' | 'es' | 'ar';

interface Translations {
  [key: string]: {
    [key in LanguageCode]: string;
  };
}

const translations: Translations = {
  trending: { en: 'Trending', es: 'Tendencias', ar: 'الأكثر تداولاً' },
  popular: { en: 'Popular', es: 'Popular', ar: 'الشائع' },
  movies: { en: 'Movies', es: 'Películas', ar: 'أفلام' },
  tvShows: { en: 'TV Shows', es: 'Series', ar: 'برامج تلفزيونية' },
  anime: { en: 'Anime', es: 'Anime', ar: 'أنمي' },
  manga: { en: 'Manga', es: 'Manga', ar: 'مانجا' },
  profile: { en: 'Profile', es: 'Perfil', ar: 'الملف الشخصي' },
  myList: { en: 'My Lists', es: 'Mis Listas', ar: 'قوائمي' },
  bookmarks: { en: 'Bookmarks', es: 'Marcadores', ar: 'المحفوظات' },
  history: { en: 'History', es: 'Historial', ar: 'السجل' },
  search: { en: 'Search', es: 'Buscar', ar: 'بحث' },
  searchPlaceholder: { en: 'Movies, TV shows, anime…', es: 'Películas, series, anime…', ar: 'أفلام، مسلسلات، أنمي…' },
  recommended: { en: 'Recommended for you', es: 'Recomendado para ti', ar: 'موصى به لك' },
  noResults: { en: 'No results for', es: 'Sin resultados para', ar: 'لا توجد نتائج لـ' },
  noBookmarks: { en: 'No bookmarks yet', es: 'Sin marcadores aún', ar: 'لا توجد محفوظات بعد' },
  noHistory: { en: 'No watch history', es: 'Sin historial de reproducción', ar: 'لا يوجد سجل مشاهدة' },
  bookmarkSub: { en: 'Bookmark movies & shows to find them here', es: 'Marca películas y series para encontrarlas aquí', ar: 'احفظ الأفلام والبرامج لتجدها هنا' },
  historySub: { en: 'Start watching to build your history', es: 'Empieza a ver para crear tu historial', ar: 'ابدأ المشاهدة لبناء سجلك' },
  settings: { en: 'Settings', es: 'Ajustes', ar: 'إعدادات' },
  about: { en: 'About Us', es: 'Sobre nosotros', ar: 'معلومات عنا' },
  contact: { en: 'Contact Us', es: 'Contacto', ar: 'اتصل بنا' },
  logout: { en: 'Log Out', es: 'Cerrar sesión', ar: 'تسجيل الخروج' },
  appearance: { en: 'Appearance', es: 'Apariencia', ar: 'المظهر' },
  language: { en: 'Language', es: 'Idioma', ar: 'اللغة' },
  help: { en: 'Help Center', es: 'Centro de ayuda', ar: 'مركز المساعدة' },
  privacy: { en: 'Privacy Policy', es: 'Política de privacidad', ar: 'سياسة الخصوصية' },
  joinCommunity: { en: 'Join Our Community', es: 'Únete a nuestra comunidad', ar: 'انضم إلى مجتمعنا' },
  joinTelegram: { en: 'Join Quietly community for updates on Telegram!', es: '¡Únete a la comunidad de Quietly para actualizaciones en Telegram!', ar: 'انضم إلى مجتمع Quietly للحصول على التحديثات على تيليجرام!' },
  later: { en: 'Later', es: 'Luego', ar: 'لاحقاً' },
  join: { en: 'Join Now', es: 'Únete ahora', ar: 'انضم الآن' },
  details: { en: 'Details', es: 'Detalles', ar: 'التفاصيل' },
  watchNow: { en: 'WATCH NOW', es: 'VER AHORA', ar: 'شاهد الآن' },
  addList: { en: 'Add List', es: 'Añadir lista', ar: 'إضافة للقائمة' },
  inList: { en: 'In List', es: 'En lista', ar: 'في القائمة' },
  readManga: { en: 'Read Manga', es: 'Leer Manga', ar: 'اقرأ المانجا' },
  chapters: { en: 'Chapters', es: 'Capítulos', ar: 'فصول' },
  overview: { en: 'Overview', es: 'Resumen', ar: 'نظرة عامة' },
  loading: { en: 'Loading…', es: 'Cargando…', ar: 'جاري التحميل…' },
  loadingPlayer: { en: 'Loading player…', es: 'Cargando reproductor…', ar: 'جاري تحميل المشغل…' },
  back: { en: 'Back', es: 'Volver', ar: 'رجوع' },
  episodes: { en: 'Episodes', es: 'Episodios', ar: 'الحلقات' },
  cast: { en: 'Cast', es: 'Elenco', ar: 'طاقم العمل' },
  similar: { en: 'You May Also Like', es: 'También te puede gustar', ar: 'قد يعجبك أيضاً' },
  rating: { en: 'Rating', es: 'Calificación', ar: 'تقييم' },
  minutes: { en: 'min', es: 'min', ar: 'دقيقة' },
  season: { en: 'Season', es: 'Temporada', ar: 'موسم' },
  seasons: { en: 'Seasons', es: 'Temporadas', ar: 'مواسم' },
  accountSettings: { en: 'Account Settings', es: 'Ajustes de cuenta', ar: 'إعدادات الحساب' },
  preferences: { en: 'Preferences', es: 'Preferencias', ar: 'التفضيلات' },
  supportInfo: { en: 'Support & Info', es: 'Soporte e información', ar: 'الدعم والمعلومات' },
  darkMode: { en: 'Dark Mode Enabled', es: 'Modo oscuro activado', ar: 'تم تفعيل الوضع الداكن' },
  clearHistory: { en: 'Clear History', es: 'Borrar historial', ar: 'مسح السجل' },
  addedToLibrary: { en: 'Added to your list!', es: '¡Añadido a tu lista!', ar: 'تم الإضافة إلى قائمتك!' },
  removedFromList: { en: 'Removed from your list', es: 'Eliminado de tu lista', ar: 'تم الحذف من قائمتك' },
  editProfile: { en: 'Edit Profile', es: 'Editar Perfil', ar: 'تعديل الملف الشخصي' },
  notifications: { en: 'Notifications', es: 'Notificaciones', ar: 'الإشعارات' },
  signInHeader: { en: 'Sign In', es: 'Iniciar sesión', ar: 'تسجيل الدخول' },
  createAccount: { en: 'Create Account', es: 'Crear cuenta', ar: 'إنشاء حساب' },
  signInDesc: { en: 'Access your playlists and history', es: 'Accede a tus listas y historial', ar: 'الوصول إلى قوائم التشغيل والسجل الخاص بك' },
  signUpDesc: { en: 'Join the Quietly Stream community', es: 'Únete a la comunidad de Quietly Stream', ar: 'انضم إلى مجتمع كوايتلي ستريم' },
};

interface I18nContextValue {
  language: LanguageCode;
  setLanguage: (lang: LanguageCode) => void;
  t: (key: string) => string;
  isRTL: boolean;
}

const I18nContext = createContext<I18nContextValue>({
  language: 'en',
  setLanguage: () => {},
  t: (key) => key,
  isRTL: false,
});

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<LanguageCode>('en');

  useEffect(() => {
    AsyncStorage.getItem('app_language').then(lang => {
      if (lang) setLanguageState(lang as LanguageCode);
    });
  }, []);

  const setLanguage = (lang: LanguageCode) => {
    setLanguageState(lang);
    AsyncStorage.setItem('app_language', lang);
  };

  const t = (key: string) => {
    return translations[key]?.[language] || key;
  };

  const isRTL = language === 'ar';

  return (
    <I18nContext.Provider value={{ language, setLanguage, t, isRTL }}>
      <View style={{ flex: 1, direction: isRTL ? 'rtl' : 'ltr' }}>
        {children}
      </View>
    </I18nContext.Provider>
  );
}

export const useTranslation = () => useContext(I18nContext);

import { View } from 'react-native';
