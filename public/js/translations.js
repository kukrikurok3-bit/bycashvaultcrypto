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
        view_more: "View More Markets",
        welcome_back: "Welcome back",
        login_subtitle: "Enter your credentials to access your account",
        email_address: "Email Address",
        password: "Password",
        no_account: "Don't have an account?",
        create_one: "Create one",
        register_subtitle: "Start your crypto journey with ByCash Vault",
        referral_id: "Referral ID (Optional)",
        agree_terms: "I agree to the Terms of Service and Privacy Policy.",
        already_have_account: "Already have an account?",
        dashboard: "Dashboard"
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
        view_more: "Посмотреть все рынки",
        welcome_back: "С возвращением",
        login_subtitle: "Введите свои данные для доступа к аккаунту",
        email_address: "Электронная почта",
        password: "Пароль",
        no_account: "Нет аккаунта?",
        create_one: "Создать",
        register_subtitle: "Начните свое крипто-путешествие с ByCash Vault",
        referral_id: "ID реферала (опционально)",
        agree_terms: "Я согласен с Условиями обслуживания и Политикой конфиденциальности.",
        already_have_account: "Уже есть аккаунт?",
        dashboard: "Панель управления"
    }
};

function setLanguage(lang) {
    localStorage.setItem('lang', lang);
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (translations[lang] && translations[lang][key]) {
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
