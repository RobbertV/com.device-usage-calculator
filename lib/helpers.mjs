import { intervalToDuration } from 'date-fns';

const sleep = async function (ms) {
    return new Promise((resolve) => {
        setTimeout(resolve, ms);
    });
};

const formattedDuration = function (milliSeconds, i18n, showSecSettings) {
    const duration = intervalToDuration({ start: 0, end: milliSeconds });

    const showSeconds = duration.days || duration.hours || duration.minutes ? showSecSettings : true;

    let TimeString = '';
    TimeString += duration.days ? `${duration.days}${i18n('helpers.daysShort')} ` : '';
    TimeString += duration.hours ? `${duration.hours}${i18n('helpers.hoursShort')} ` : '';
    TimeString += duration.minutes ? `${duration.minutes}${i18n('helpers.minutesShort')} ` : '';
    if (showSeconds) {
        TimeString += duration.seconds ? `${duration.seconds}${i18n('helpers.secondsShort')}` : '';
    }

    return TimeString.trim();
};

export { sleep, formattedDuration };
