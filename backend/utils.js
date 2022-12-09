export function convertTimeToMinutes(time) {
    let timeParts = time.split(":");
    let timeInMinutes = (timeParts[0] * 60) + timeParts[1];
    return timeInMinutes;
}