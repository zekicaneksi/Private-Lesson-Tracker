export function dateToString(date) {
    let yyyy = date.getFullYear().toString();
    let yy = yyyy.substring(yyyy.length - 2);
    let mm = date.getMonth() + 1; // Months start at 0!
    let dd = date.getDate();

    if (dd < 10) dd = '0' + dd;
    if (mm < 10) mm = '0' + mm;

    return (dd + '/' + mm + '/' + yy);
}

export function convertTimeToMinutes(time) {
    let timeParts = time.split(":");
    let timeInMinutes = (timeParts[0] * 60) + timeParts[1];
    return timeInMinutes;
}