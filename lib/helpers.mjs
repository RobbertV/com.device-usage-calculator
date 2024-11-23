import { intervalToDuration } from 'date-fns';

const sleep = async function (ms) {
    return new Promise((resolve) => {
      setTimeout(resolve, ms);
    });
};

const formattedDuration = function (milliSeconds) {
    const duration = intervalToDuration({ start: 0, end: milliSeconds });

    let TimeString = '';
    TimeString += duration.days ? `${duration.days}:` : '';
    TimeString += duration.hours ? `${duration.hours}:` : '';
    TimeString += duration.minutes ? `${duration.minutes}:` : '';
    TimeString += duration.seconds;

    return TimeString.trim();
};

export { sleep, formattedDuration };
