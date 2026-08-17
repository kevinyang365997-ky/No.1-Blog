(() => {
    'use strict';

    const STORAGE_KEY = 'freecat-language';
    const DEFAULT_LANGUAGE = 'zh-CN';

    const translations = {
        'zh-CN': {
            home: '首页',
            articles: '文章',
            resume: '个人履历',
            projects: '项目',
            gallery: '图库',
            videos: '视频',
            about: '关于',
            chooseLanguage: '选择语言',
            languageDescription:
                '请选择网站界面使用的语言。',
            currentChoice: '当前选择',
            searchPlaceholder: '搜索文章……',
            searchLabel: '搜索',
            closeSearchLabel: '关闭搜索',
            tagsLabel: '查看标签',
            themeLabel: '切换主题'
        },

        'zh-TW': {
            home: '首頁',
            articles: '文章',
            resume: '個人履歷',
            projects: '專案',
            gallery: '圖庫',
            videos: '影片',
            about: '關於',
            chooseLanguage: '選擇語言',
            languageDescription:
                '請選擇網站介面使用的語言。',
            currentChoice: '目前選擇',
            searchPlaceholder: '搜尋文章……',
            searchLabel: '搜尋',
            closeSearchLabel: '關閉搜尋',
            tagsLabel: '查看標籤',
            themeLabel: '切換主題'
        },

        'en-US': {
            home: 'Home',
            articles: 'Articles',
            resume: 'Resume',
            projects: 'Projects',
            gallery: 'Gallery',
            videos: 'Videos',
            about: 'About',
            chooseLanguage: 'Choose a language',
            languageDescription:
                'Choose the language used by the website interface.',
            currentChoice: 'Current selection',
            searchPlaceholder: 'Search articles...',
            searchLabel: 'Search',
            closeSearchLabel: 'Close search',
            tagsLabel: 'View tags',
            themeLabel: 'Toggle theme'
        },

        'en-GB': {
            home: 'Home',
            articles: 'Articles',
            resume: 'CV',
            projects: 'Projects',
            gallery: 'Gallery',
            videos: 'Videos',
            about: 'About',
            chooseLanguage: 'Choose a language',
            languageDescription:
                'Choose the language used by the website interface.',
            currentChoice: 'Current selection',
            searchPlaceholder: 'Search articles...',
            searchLabel: 'Search',
            closeSearchLabel: 'Close search',
            tagsLabel: 'View tags',
            themeLabel: 'Toggle theme'
        },

        es: {
            home: 'Inicio',
            articles: 'Artículos',
            resume: 'Currículum',
            projects: 'Proyectos',
            gallery: 'Galería',
            videos: 'Vídeos',
            about: 'Acerca de',
            chooseLanguage: 'Elegir idioma',
            languageDescription:
                'Elige el idioma de la interfaz del sitio web.',
            currentChoice: 'Selección actual',
            searchPlaceholder: 'Buscar artículos...',
            searchLabel: 'Buscar',
            closeSearchLabel: 'Cerrar búsqueda',
            tagsLabel: 'Ver etiquetas',
            themeLabel: 'Cambiar tema'
        },

        pt: {
            home: 'Início',
            articles: 'Artigos',
            resume: 'Currículo',
            projects: 'Projetos',
            gallery: 'Galeria',
            videos: 'Vídeos',
            about: 'Sobre',
            chooseLanguage: 'Escolher idioma',
            languageDescription:
                'Escolha o idioma da interface do site.',
            currentChoice: 'Seleção atual',
            searchPlaceholder: 'Pesquisar artigos...',
            searchLabel: 'Pesquisar',
            closeSearchLabel: 'Fechar pesquisa',
            tagsLabel: 'Ver etiquetas',
            themeLabel: 'Alternar tema'
        },

        de: {
            home: 'Startseite',
            articles: 'Artikel',
            resume: 'Lebenslauf',
            projects: 'Projekte',
            gallery: 'Galerie',
            videos: 'Videos',
            about: 'Über mich',
            chooseLanguage: 'Sprache wählen',
            languageDescription:
                'Wähle die Sprache der Website-Oberfläche.',
            currentChoice: 'Aktuelle Auswahl',
            searchPlaceholder: 'Artikel suchen...',
            searchLabel: 'Suchen',
            closeSearchLabel: 'Suche schließen',
            tagsLabel: 'Schlagwörter anzeigen',
            themeLabel: 'Design wechseln'
        },

        fr: {
            home: 'Accueil',
            articles: 'Articles',
            resume: 'CV',
            projects: 'Projets',
            gallery: 'Galerie',
            videos: 'Vidéos',
            about: 'À propos',
            chooseLanguage: 'Choisir une langue',
            languageDescription:
                'Choisissez la langue de l’interface du site.',
            currentChoice: 'Sélection actuelle',
            searchPlaceholder: 'Rechercher des articles...',
            searchLabel: 'Rechercher',
            closeSearchLabel: 'Fermer la recherche',
            tagsLabel: 'Voir les étiquettes',
            themeLabel: 'Changer de thème'
        },

        ru: {
            home: 'Главная',
            articles: 'Статьи',
            resume: 'Резюме',
            projects: 'Проекты',
            gallery: 'Галерея',
            videos: 'Видео',
            about: 'Обо мне',
            chooseLanguage: 'Выберите язык',
            languageDescription:
                'Выберите язык интерфейса сайта.',
            currentChoice: 'Текущий выбор',
            searchPlaceholder: 'Поиск статей...',
            searchLabel: 'Поиск',
            closeSearchLabel: 'Закрыть поиск',
            tagsLabel: 'Показать теги',
            themeLabel: 'Сменить тему'
        }
    };

    function getSavedLanguage() {
        try {
            const savedLanguage =
                localStorage.getItem(STORAGE_KEY);

            if (
                savedLanguage &&
                translations[savedLanguage]
            ) {
                return savedLanguage;
            }

            return DEFAULT_LANGUAGE;
        } catch (error) {
            return DEFAULT_LANGUAGE;
        }
    }

    function saveLanguage(languageCode) {
        try {
            localStorage.setItem(
                STORAGE_KEY,
                languageCode
            );
        } catch (error) {
            /*
             * 某些浏览器可能禁止本地存储。
             * 即使保存失败，本次页面仍可正常切换语言。
             */
        }
    }

    function setText(selector, value) {
        const element =
            document.querySelector(selector);

        if (element && value) {
            element.textContent = value;
        }
    }

    function setAttribute(
        selector,
        attribute,
        value
    ) {
        const element =
            document.querySelector(selector);

        if (element && value) {
            element.setAttribute(
                attribute,
                value
            );
        }
    }

    function getLanguageName(languageCode) {
        const card = document.querySelector(
            `[data-language="${languageCode}"]`
        );

        if (!card) {
            return languageCode;
        }

        return (
            card.dataset.languageName ||
            languageCode
        );
    }

    function applyDirection(languageCode) {
        document.documentElement.lang =
            languageCode;

        document.documentElement.setAttribute(
            'dir',
            'ltr'
        );

        if (document.body) {
            document.body.removeAttribute('dir');
            document.body.classList.remove(
                'freecat-rtl'
            );
        }
    }

    function applyNavigation(dictionary) {
        setText(
            '#nav-links a[href="/"]',
            dictionary.home
        );

        setText(
            '#nav-links a[href="/all"]',
            dictionary.articles
        );

        setText(
            '#nav-links a[href="/resume"]',
            dictionary.resume
        );

        setText(
            '#nav-links a[href="/projects"]',
            dictionary.projects
        );

        setText(
            '#nav-links a[href="/gallery"]',
            dictionary.gallery
        );

        setText(
            '#nav-links a[href="/videos"]',
            dictionary.videos
        );

        setText(
            '#nav-links a[href="/about"]',
            dictionary.about
        );

        const navigation =
            document.getElementById('nav-links');

        if (navigation) {
            navigation.setAttribute(
                'dir',
                'ltr'
            );
        }
    }

    function applyLanguagePanel(
        languageCode,
        dictionary
    ) {
        const menu =
            document.getElementById(
                'language-menu'
            );

        if (!menu) {
            return;
        }

        /*
         * 菜单保持左到右排列，避免阿拉伯语选中后
         * 整个语言卡片面板镜像移动。
         */
        menu.setAttribute('dir', 'ltr');

        const panelTitle =
            menu.querySelector('div h2');

        const panelDescription =
            menu.querySelector('div h2 + p');

        const status =
            document.getElementById(
                'language-selection-status'
            );

        if (panelTitle) {
            panelTitle.textContent =
                dictionary.chooseLanguage;

            panelTitle.setAttribute(
                'dir',
                languageCode === 'ar'
                    ? 'rtl'
                    : 'ltr'
            );
        }

        if (panelDescription) {
            panelDescription.textContent =
                dictionary.languageDescription;

            panelDescription.setAttribute(
                'dir',
                languageCode === 'ar'
                    ? 'rtl'
                    : 'ltr'
            );
        }

        if (status) {
            status.textContent =
                `${dictionary.currentChoice}: ` +
                getLanguageName(languageCode);

            status.setAttribute(
                'dir',
                languageCode === 'ar'
                    ? 'rtl'
                    : 'ltr'
            );
        }
    }

    function applyControls(dictionary) {
        setAttribute(
            '#search-toggle',
            'aria-label',
            dictionary.searchLabel
        );

        setAttribute(
            '#search-close',
            'aria-label',
            dictionary.closeSearchLabel
        );

        setAttribute(
            '#tag-menu-toggle',
            'aria-label',
            dictionary.tagsLabel
        );

        setAttribute(
            '#theme-toggle',
            'aria-label',
            dictionary.themeLabel
        );

        setAttribute(
            '#search-input',
            'placeholder',
            dictionary.searchPlaceholder
        );
    }

    function updateSelectedCard(languageCode) {
        const languageCards =
            document.querySelectorAll(
                '[data-language]'
            );

        languageCards.forEach((card) => {
            const selected =
                card.dataset.language ===
                languageCode;

            card.setAttribute(
                'aria-current',
                selected ? 'true' : 'false'
            );

            card.classList.toggle(
                'border-primary',
                selected
            );

            card.classList.toggle(
                'bg-emerald-50',
                selected
            );

            card.classList.toggle(
                'dark:bg-emerald-950/30',
                selected
            );
        });
    }

    function applyLanguage(languageCode) {
        const safeLanguageCode =
            translations[languageCode]
                ? languageCode
                : DEFAULT_LANGUAGE;

        const dictionary =
            translations[safeLanguageCode];

        applyDirection(safeLanguageCode);
        applyNavigation(dictionary);
        applyLanguagePanel(
            safeLanguageCode,
            dictionary
        );
        applyControls(dictionary);
        updateSelectedCard(
            safeLanguageCode
        );

        document.dispatchEvent(
            new CustomEvent(
                'freecat:language-changed',
                {
                    detail: {
                        language:
                            safeLanguageCode
                    }
                }
            )
        );
    }

    function handleLanguageClick(event) {
        const languageCard =
            event.target.closest(
                '[data-language]'
            );

        if (!languageCard) {
            return;
        }

        const languageCode =
            languageCard.dataset.language;

        if (!translations[languageCode]) {
            return;
        }

        saveLanguage(languageCode);

        /*
         * 等 header.html 中的菜单脚本完成后，
         * 再更新公共界面。
         */
        window.setTimeout(() => {
            applyLanguage(languageCode);
        }, 0);
    }

    function initialiseLanguageSystem() {
        applyLanguage(
            getSavedLanguage()
        );

        document.addEventListener(
            'click',
            handleLanguageClick
        );
    }

    if (document.readyState === 'loading') {
        document.addEventListener(
            'DOMContentLoaded',
            initialiseLanguageSystem,
            {
                once: true
            }
        );
    } else {
        initialiseLanguageSystem();
    }

    window.FreeCatI18n = {
        applyLanguage,
        getLanguage: getSavedLanguage,
        translations
    };
})();
