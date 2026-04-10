const translations = {
    en: {
        trade: "Trade",
        buy_crypto: "Buy Crypto",
        market_tools: "Market Tools",
        finance: "Finance",
        news: "News",
        sign_in: "Sign In",
        create_account: "Create Account",
        settings: "Settings",
        logout: "Logout",
        hero_title: "Buy, sell and store over <br> 300 digital assets at <br> <span class='text-accent'>ByCash Vault</span>",
        hero_subtitle: "Trade Bitcoin, Ethereum, USDT and the top altcoins on the crypto exchange.",
        start_trading: "Start Trading",
        balance: "Balance",
        market_trend: "Market Trend",
        market_subtitle: "Real-time market data for top cryptocurrencies.",
        view_more: "View More Markets"
    },
    ru: {
        trade: "Торговля",
        buy_crypto: "Купить крипто",
        market_tools: "Инструменты рынка",
        finance: "Финансы",
        news: "Новости",
        sign_in: "Войти",
        create_account: "Создать аккаунт",
        settings: "Настройки",
        logout: "Выйти",
        hero_title: "Покупайте, продавайте и храните более <br> 300 цифровых активов в <br> <span class='text-accent'>ByCash Vault</span>",
        hero_subtitle: "Торгуйте Bitcoin, Ethereum, USDT и топовыми альткоинами на криптобирже.",
        start_trading: "Начать торговлю",
        balance: "Баланс",
        market_trend: "Тренды рынка",
        market_subtitle: "Рыночные данные в реальном времени для топовых криптовалют.",
        view_more: "Посмотреть все рынки"
    },
    de: {
        trade: "Handel",
        buy_crypto: "Krypto kaufen",
        market_tools: "Markt-Tools",
        finance: "Finanzen",
        news: "Nachrichten",
        sign_in: "Anmelden",
        create_account: "Konto erstellen",
        settings: "Einstellungen",
        logout: "Abmelden",
        hero_title: "Kaufen, verkaufen und speichern Sie über <br> 300 digitale Assets bei <br> <span class='text-accent'>ByCash Vault</span>",
        hero_subtitle: "Handeln Sie Bitcoin, Ethereum, USDT und die Top-Altcoins an der Krypto-Börse.",
        start_trading: "Handel starten",
        balance: "Kontostand",
        market_trend: "Markttrend",
        market_subtitle: "Echtzeit-Marktdaten für Top-Kryptowährungen.",
        view_more: "Mehr Märkte anzeigen"
    },
    es: {
        trade: "Comercio",
        buy_crypto: "Comprar Cripto",
        market_tools: "Herramientas de Mercado",
        finance: "Finanzas",
        news: "Noticias",
        sign_in: "Iniciar Sesión",
        create_account: "Crear Cuenta",
        settings: "Ajustes",
        logout: "Cerrar Sesión",
        hero_title: "Compre, venda и almacene más de <br> 300 activos digitales en <br> <span class='text-accent'>ByCash Vault</span>",
        hero_subtitle: "Opere con Bitcoin, Ethereum, USDT и las principales altcoins en el intercambio de criptomonedas.",
        start_trading: "Empezar a Operar",
        balance: "Saldo",
        market_trend: "Tendencia del Mercado",
        market_subtitle: "Datos de mercado en tiempo real para las principales criptomonedas.",
        view_more: "Ver más mercados"
    },
    pt: {
        trade: "Negociar",
        buy_crypto: "Comprar Cripto",
        market_tools: "Ferramentas de Mercado",
        finance: "Finanças",
        news: "Notícias",
        sign_in: "Entrar",
        create_account: "Criar Conta",
        settings: "Configurações",
        logout: "Sair",
        hero_title: "Compre, venda e armazene mais de <br> 300 ativos digitais na <br> <span class='text-accent'>ByCash Vault</span>",
        hero_subtitle: "Negocie Bitcoin, Ethereum, USDT e as principais altcoins na exchange de criptomoedas.",
        start_trading: "Começar a Negociar",
        balance: "Saldo",
        market_trend: "Tendência de Mercado",
        market_subtitle: "Dados de mercado em tempo real para as principais criptomoedas.",
        view_more: "Ver mais mercados"
    }
};

function setLanguage(lang) {
    localStorage.setItem('lang', lang);
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (translations[lang][key]) {
            el.innerHTML = translations[lang][key];
        }
    });
}

function initTheme() {
    const theme = localStorage.getItem('theme') || 'dark';
    document.documentElement.setAttribute('data-theme', theme);
    const circle = document.getElementById('theme-circle');
    if (circle) {
        circle.style.right = theme === 'dark' ? '2px' : 'auto';
        circle.style.left = theme === 'light' ? '2px' : 'auto';
    }
}

function toggleTheme() {
    const current = document.documentElement.getAttribute('data-theme');
    const next = current === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('theme', next);
    initTheme();
}

window.addEventListener('DOMContentLoaded', () => {
    const savedLang = localStorage.getItem('lang') || 'en';
    const langSelect = document.getElementById('lang-select');
    if (langSelect) {
        langSelect.value = savedLang;
        langSelect.addEventListener('change', (e) => setLanguage(e.target.value));
    }
    setLanguage(savedLang);
    initTheme();
    
    const themeToggle = document.getElementById('theme-toggle');
    if (themeToggle) themeToggle.addEventListener('click', toggleTheme);
});
