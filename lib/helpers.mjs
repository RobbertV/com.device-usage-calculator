import { intervalToDuration } from 'date-fns';

const sleep = async function (ms) {
    return new Promise((resolve) => {
        setTimeout(resolve, ms);
    });
};

const formattedDuration = function (milliSeconds, i18n, showSeconds) {
    const duration = intervalToDuration({ start: 0, end: milliSeconds });

    const showTheSeconds = duration.days || duration.hours || duration.minutes ? showSeconds : true;

    let TimeString = '';
    TimeString += duration.days ? `${duration.days}${i18n('helpers.daysShort')} ` : '';
    TimeString += duration.hours ? `${duration.hours}${i18n('helpers.hoursShort')} ` : '';
    TimeString += duration.minutes ? `${duration.minutes}${i18n('helpers.minutesShort')} ` : '';
    if (showTheSeconds) {
        TimeString += duration.seconds ? `${duration.seconds}${i18n('helpers.secondsShort')}` : '';
    }

    return TimeString.trim();
};

export { sleep, formattedDuration };
