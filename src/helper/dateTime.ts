import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import relativeTime from 'dayjs/plugin/relativeTime';
import timezone from 'dayjs/plugin/timezone'; // dependent on utc plugin

dayjs.extend(timezone);

dayjs.extend(relativeTime);

dayjs.extend(utc);

dayjs.tz.setDefault('America/New_York');
const dateTime = dayjs;
export default dateTime;
