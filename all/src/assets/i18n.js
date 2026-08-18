(() => {
    'use strict';

    const STORAGE_KEY = 'freecat-language';
    const DEFAULT_LANGUAGE = 'zh-CN';
    const EN_US_CONFIG_URL = '/i18n/en-US.json';

    let dynamicTranslationTimer = null;
    let dynamicTranslationObserver = null;

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
            themeLabel: '切换主题',
            updateSortLabel: '按更新排序',
            recentUpdates: '最近更新',
            searchGoBack: '返回',
            searchEmptyPrompt: '请在上方搜索框中输入关键词。',
            searchingFor: '正在搜索：',
            searchNoResultsTitle: '没有找到结果',
            searchNoResultsDescription: '请尝试使用其他关键词搜索',
            projectsPageTitle: '项目与解决方案',
            projectsPageDescription:
                '记录我主导和协作参与的项目，以及在实践中整理形成的解决方案。',
            projectsAll: '全部项目',
            projectsLead: '主导项目',
            projectsCollaboration: '协作项目',
            projectsSolutions: '解决方案',
            projectsEmptyTitle: '暂无项目',
            projectsEmptyDescription:
                '当前分类的内容正在整理中。',
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
            themeLabel: '切換主題',
            updateSortLabel: '按更新時間排序',
            recentUpdates: '最近更新',
            searchGoBack: '返回',
            searchEmptyPrompt: '請在上方搜尋框中輸入關鍵字。',
            searchingFor: '正在搜尋：',
            searchNoResultsTitle: '找不到結果',
            searchNoResultsDescription: '請嘗試使用其他關鍵字搜尋',
            projectsPageTitle: '專案與解決方案',
            projectsPageDescription:
                '記錄我主導和協作參與的專案，以及在實踐中整理形成的解決方案。',
            projectsAll: '全部專案',
            projectsLead: '主導專案',
            projectsCollaboration: '協作專案',
            projectsSolutions: '解決方案',
            projectsEmptyTitle: '暫無專案',
            projectsEmptyDescription:
                '目前分類的內容正在整理中。',
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
            themeLabel: 'Toggle theme',
            updateSortLabel: 'Sort by last update',
            recentUpdates: 'Recent Updates',
            searchGoBack: 'Go Back',
            searchEmptyPrompt: 'Enter a search term in the search box above.',
            searchingFor: 'Searching for:',
            searchNoResultsTitle: 'No results found',
            searchNoResultsDescription: 'Try searching with different keywords',
            projectsPageTitle: 'Projects & Solutions',
            projectsPageDescription:
                'Projects I led or participated in, along with reusable solutions developed through practice.',
            projectsAll: 'All Projects',
            projectsLead: 'Lead Projects',
            projectsCollaboration: 'Collaborative Projects',
            projectsSolutions: 'Solutions',
            projectsEmptyTitle: 'No Projects Yet',
            projectsEmptyDescription:
                'No projects are available in this category.',
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
            themeLabel: 'Toggle theme',
            updateSortLabel: 'Sort by last update',
            recentUpdates: 'Recent Updates',
            searchGoBack: 'Go Back',
            searchEmptyPrompt: 'Enter a search term in the search box above.',
            searchingFor: 'Searching for:',
            searchNoResultsTitle: 'No results found',
            searchNoResultsDescription: 'Try searching with different keywords'
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
            themeLabel: 'Cambiar tema',
            updateSortLabel: 'Ordenar por actualización',
            recentUpdates: 'Actualizaciones recientes',
            searchGoBack: 'Volver',
            searchEmptyPrompt: 'Introduce un término de búsqueda en el cuadro de arriba.',
            searchingFor: 'Buscando:',
            searchNoResultsTitle: 'No se encontraron resultados',
            searchNoResultsDescription: 'Prueba a buscar con otras palabras clave'
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
            themeLabel: 'Alternar tema',
            updateSortLabel: 'Ordenar por atualização',
            recentUpdates: 'Atualizações recentes',
            searchGoBack: 'Voltar',
            searchEmptyPrompt: 'Introduza um termo de pesquisa na caixa acima.',
            searchingFor: 'A pesquisar:',
            searchNoResultsTitle: 'Nenhum resultado encontrado',
            searchNoResultsDescription: 'Tente pesquisar com outras palavras-chave'
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
            themeLabel: 'Design wechseln',
            updateSortLabel: 'Nach Aktualisierung sortieren',
            recentUpdates: 'Neueste Aktualisierungen',
            searchGoBack: 'Zurück',
            searchEmptyPrompt: 'Gib oben einen Suchbegriff ein.',
            searchingFor: 'Suche nach:',
            searchNoResultsTitle: 'Keine Ergebnisse gefunden',
            searchNoResultsDescription: 'Versuche es mit anderen Suchbegriffen'
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
            themeLabel: 'Changer de thème',
            updateSortLabel: 'Trier par mise à jour',
            recentUpdates: 'Mises à jour récentes',
            searchGoBack: 'Retour',
            searchEmptyPrompt: 'Saisissez un terme dans le champ de recherche ci-dessus.',
            searchingFor: 'Recherche :',
            searchNoResultsTitle: 'Aucun résultat trouvé',
            searchNoResultsDescription: 'Essayez avec d’autres mots-clés'
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
            themeLabel: 'Сменить тему',
            updateSortLabel: 'Сортировать по обновлению',
            recentUpdates: 'Последние обновления',
            searchGoBack: 'Назад',
            searchEmptyPrompt: 'Введите поисковый запрос в поле выше.',
            searchingFor: 'Поиск:',
            searchNoResultsTitle: 'Ничего не найдено',
            searchNoResultsDescription: 'Попробуйте использовать другие ключевые слова'
        }
    };

    function mergeEnglishConfig(config) {
        const current =
            translations['en-US'];

        const navigation =
            config.navigation || {};

        const languageSelector =
            config.languageSelector || {};

        const home =
            config.home || {};

        const searchPage =
            config.searchPage || {};

        translations['en-US'] = {
            ...current,
            home:
                navigation.home ||
                current.home,
            articles:
                navigation.articles ||
                current.articles,
            resume:
                navigation.resume ||
                current.resume,
            projects:
                navigation.projects ||
                current.projects,
            gallery:
                navigation.gallery ||
                current.gallery,
            videos:
                navigation.videos ||
                current.videos,
            about:
                navigation.about ||
                current.about,
            chooseLanguage:
                languageSelector.title ||
                current.chooseLanguage,
            languageDescription:
                languageSelector.description ||
                current.languageDescription,
            currentChoice:
                languageSelector.currentSelection ||
                current.currentChoice,
            recentUpdates:
                home.recentUpdates ||
                current.recentUpdates,
            searchGoBack:
                searchPage.goBack ||
                current.searchGoBack,
            searchEmptyPrompt:
                searchPage.emptyPrompt ||
                current.searchEmptyPrompt,
            searchingFor:
                searchPage.searchingFor ||
                current.searchingFor,
            searchNoResultsTitle:
                searchPage.noResultsTitle ||
                current.searchNoResultsTitle,
            searchNoResultsDescription:
                searchPage.noResultsDescription ||
                current.searchNoResultsDescription
        };
    }

    async function loadExternalTranslations() {
        try {
            const response = await fetch(
                EN_US_CONFIG_URL,
                {
                    cache: 'no-cache'
                }
            );

            if (!response.ok) {
                throw new Error(
                    `HTTP ${response.status}`
                );
            }

            const config =
                await response.json();

            mergeEnglishConfig(config);
        } catch (error) {
            console.warn(
                'Unable to load English translation config; using built-in fallback.',
                error
            );
        }
    }

    
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
            '#update-sort-switch',
            'aria-label',
            dictionary.updateSortLabel
        );

        setText(
            '#update-sort-label',
            dictionary.updateSortLabel
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

    /*
     * 先以简体中文作为公共后备字典，
     * 再覆盖当前语言已有的翻译。
     *
     * 这样尚未补齐项目页翻译的语言，
     * 不会出现 undefined 或空白文字。
     */
    const dictionary = {
        ...translations[DEFAULT_LANGUAGE],
        ...translations[safeLanguageCode]
    };

    applyDirection(safeLanguageCode);
    applyNavigation(dictionary);

    applyLanguagePanel(
        safeLanguageCode,
        dictionary
    );

    applyControls(dictionary);

    /*
     * 首页侧栏
     */
    setText(
        '#recent-updates-heading',
        dictionary.recentUpdates
    );

    /*
     * 搜索页面
     */
    setText(
        '#search-go-back',
        dictionary.searchGoBack
    );

    setText(
        '#search-empty-prompt',
        dictionary.searchEmptyPrompt
    );

    setText(
        '#searching-for-label',
        dictionary.searchingFor
    );

    setText(
        '#search-no-results-title',
        dictionary.searchNoResultsTitle
    );

    setText(
        '#search-no-results-description',
        dictionary.searchNoResultsDescription
    );

    /*
     * 项目列表页面
     */
    setText(
        '#projects-page-title',
        dictionary.projectsPageTitle
    );

    setText(
        '#projects-page-description',
        dictionary.projectsPageDescription
    );

    setText(
        '#projects-filter-all',
        dictionary.projectsAll
    );

    setText(
        '#projects-filter-lead',
        dictionary.projectsLead
    );

    setText(
        '#projects-filter-collaboration',
        dictionary.projectsCollaboration
    );

    setText(
        '#projects-filter-solutions',
        dictionary.projectsSolutions
    );

    setText(
        '#projects-empty-title',
        dictionary.projectsEmptyTitle
    );

    setText(
        '#projects-empty-description',
        dictionary.projectsEmptyDescription
    );

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
    
        function observeDynamicContent() {
        if (
            dynamicTranslationObserver ||
            !document.body
        ) {
            return;
        }

        dynamicTranslationObserver =
            new MutationObserver((mutations) => {
                const hasNewContent =
                    mutations.some(
                        (mutation) =>
                            mutation.addedNodes.length > 0
                    );

                if (!hasNewContent) {
                    return;
                }

                window.clearTimeout(
                    dynamicTranslationTimer
                );

                dynamicTranslationTimer =
                    window.setTimeout(() => {
                        dynamicTranslationObserver.disconnect();

                        applyLanguage(
                            getSavedLanguage()
                        );

                        dynamicTranslationObserver.observe(
                            document.body,
                            {
                                childList: true,
                                subtree: true
                            }
                        );
                    }, 50);
            });

        dynamicTranslationObserver.observe(
            document.body,
            {
                childList: true,
                subtree: true
            }
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

        async function initialiseLanguageSystem() {
        await loadExternalTranslations();

        applyLanguage(
            getSavedLanguage()
        );

        observeDynamicContent();

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
