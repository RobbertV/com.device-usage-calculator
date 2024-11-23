import { intervalToDuration } from 'date-fns';

const sleep = async function (ms) {
    return new Promise((resolve) => {
        setTimeout(resolve, ms);
    });
};

const formattedDuration = function (milliSeconds, i18n) {
    const duration = intervalToDuration({ start: 0, end: milliSeconds });

    let TimeString = '';
    TimeString += duration.days ? `${duration.days}${i18n('helpers.daysShort')} ` : '';
    TimeString += duration.hours ? `${duration.hours}${i18n('helpers.hoursShort')} ` : '';
    TimeString += duration.minutes ? `${duration.minutes}${i18n('helpers.minutesShort')} ` : '';
    TimeString += `${duration.seconds}${i18n('helpers.secondsShort')}`;

    return TimeString.trim();
};

export { sleep, formattedDuration };
