import { useTranslation } from 'react-i18next';
import { useState } from 'react';

const LanguageSwitcher: React.FC = () => {
  const { i18n, t } = useTranslation();
  const [showMenu, setShowMenu] = useState(false);

  const currentLang = i18n.language;
  const isEnglish = currentLang.startsWith('en');
  const otherLang = isEnglish ? 'fr' : 'en';

  const flagMap: Record<string, string> = {
    en: 'https://flagcdn.com/w20/gb.png',
    fr: 'https://flagcdn.com/w20/fr.png',
  };

  const nameMap: Record<string, string> = {
    en: 'English',
    fr: 'Français',
  };

  const handleClick = () => {
    i18n.changeLanguage(otherLang);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setShowMenu(!showMenu)}
        className="flex items-center gap-2 p-1 rounded hover:bg-white/5 focus:outline-none focus:ring-2 focus:ring-ring"
        aria-label={t('header.language.switch')}
      >
        <img src={flagMap[currentLang]} alt={nameMap[currentLang]} className="w-5 h-5" />
        <span className="hidden ml-1">{nameMap[currentLang]}</span>
      </button>

      {showMenu && (
        <div className="absolute right-0 mt-2 w-48 p-2 bg-white/95 backdrop-blur-md border border-space-border rounded-md shadow-lg z-20">
          <button
            onClick={handleClick}
            className="flex w-full items-center gap-3 p-2 rounded hover:bg-white/10 transition-colors"
          >
            <img src={flagMap[otherLang]} alt={nameMap[otherLang]} className="w-5 h-5" />
            <span className="text-left">{nameMap[otherLang]}</span>
          </button>
        </div>
      )}
    </div>
  );
};

export default LanguageSwitcher;