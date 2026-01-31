let deferredPrompt;
let isInstalled = false;

// Проверка установки
if (window.matchMedia('(display-mode: standalone)').matches) {
    isInstalled = true;
}

// Регистрация Service Worker
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/service-worker.js')
            .then(registration => {
                console.log('Service Worker зарегистрирован:', registration.scope);
                
                // Проверка обновлений
                registration.addEventListener('updatefound', () => {
                    const newWorker = registration.installing;
                    newWorker.addEventListener('statechange', () => {
                        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                            // Доступно обновление
                            if (confirm('Доступна новая версия приложения. Обновить?')) {
                                newWorker.postMessage({ type: 'SKIP_WAITING' });
                                window.location.reload();
                            }
                        }
                    });
                });
            })
            .catch(error => {
                console.error('Ошибка регистрации Service Worker:', error);
            });
    });
}

// Обработка события установки
window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    
    // Показываем предложение установки через 10 секунд
    if (!isInstalled) {
        setTimeout(() => {
            showInstallPrompt();
        }, 10000);
    }
});

// Показать предложение установки
function showInstallPrompt() {
    const installPrompt = document.getElementById('installPrompt');
    if (installPrompt && !isInstalled) {
        installPrompt.style.display = 'block';
    }
}

// Установка приложения
function installApp() {
    const installPrompt = document.getElementById('installPrompt');
    
    if (deferredPrompt) {
        deferredPrompt.prompt();
        
        deferredPrompt.userChoice.then((choiceResult) => {
            if (choiceResult.outcome === 'accepted') {
                console.log('Пользователь установил приложение');
                isInstalled = true;
            } else {
                console.log('Пользователь отклонил установку');
            }
            
            deferredPrompt = null;
            if (installPrompt) {
                installPrompt.style.display = 'none';
            }
        });
    }
}

// Закрыть предложение
function dismissInstall() {
    const installPrompt = document.getElementById('installPrompt');
    if (installPrompt) {
        installPrompt.style.display = 'none';
    }
    
    // Сохранить отказ в localStorage
    localStorage.setItem('installDismissed', Date.now());
}

// Обработка успешной установки
window.addEventListener('appinstalled', () => {
    console.log('PWA успешно установлено');
    isInstalled = true;
    const installPrompt = document.getElementById('installPrompt');
    if (installPrompt) {
        installPrompt.style.display = 'none';
    }
});

// Проверка отказа от установки
document.addEventListener('DOMContentLoaded', () => {
    const dismissed = localStorage.getItem('installDismissed');
    if (dismissed) {
        const daysSinceDismiss = (Date.now() - parseInt(dismissed)) / (1000 * 60 * 60 * 24);
        if (daysSinceDismiss < 7) {
            // Не показывать предложение 7 дней
            return;
        }
    }
});
