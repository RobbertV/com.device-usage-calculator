const sleep = async function (ms) {
    return new Promise((resolve) => {
      setTimeout(resolve, ms);
    });
};

const formattedDuration = function (milliSeconds, i18n, log) {
    const durationInSeconds = Math.abs(milliSeconds / 1000);

    const numberOfHours = parseInt(durationInSeconds) / 3600;
    const days = Math.floor(numberOfHours / 24);
    const remainder = numberOfHours % 24;
    const hours = Math.floor(remainder);
    const minutes = Math.floor(60 * (remainder - hours));
    const seconds = Math.floor(60 * (remainder - (hours + minutes)));

    log(`[calculateDuration] - days: ${days} - hours: ${hours} - minutes: ${minutes} - seconds: ${seconds}`);

    let TimeString = '';
    TimeString += days ? `${days}:` : '';
    TimeString += hours ? `${hours}:` : '';
    TimeString += minutes ? `${minutes}:` : '';
    TimeString += seconds;

    return TimeString.trim();
};

const singleOrPluralTime = function (i18n, number, type) {
    if (number === 1) {
        return `${number} ${i18n(`helpers.${type}`)}`;
    }

    return `${number} ${i18n(`helpers.${type}s`)}`;
};

export { sleep, formattedDuration };
