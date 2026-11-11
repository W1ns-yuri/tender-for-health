/**
 * Защита от случайного запуска разрушительных/демо-скриптов на боевой базе.
 * Эти скрипты удаляют данные или создают учётки с известными паролями (admin123).
 * Если очень нужно — запускать с ALLOW_DANGEROUS_SCRIPTS=true, понимая последствия.
 */
module.exports = function refuseInProduction(scriptName) {
    if (process.env.NODE_ENV === 'production' && process.env.ALLOW_DANGEROUS_SCRIPTS !== 'true') {
        console.error(`⛔ ${scriptName}: запуск запрещён при NODE_ENV=production (скрипт удаляет данные или создаёт демо-учётки).`);
        process.exit(1);
    }
};
