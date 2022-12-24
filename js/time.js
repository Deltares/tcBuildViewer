// Convert TeamCity's weird time notation to Unix timestamp.
function tcTimeToUnix(tcTime) {
    split    = tcTime.split('')
    year     = split.slice(0, 4).join('')
    month    = split.slice(4, 6).join('')
    day      = split.slice(6, 8).join('')
    t        = split.slice(8, 9).join('')
    hour     = split.slice(9, 11).join('')
    minute   = split.slice(11, 13).join('')
    second   = split.slice(13, 15).join('')
    timezone = split.slice(15, 23).join('')
    let date = new Date(`${year}-${month}-${day}T${hour}:${minute}:${second}.000${timezone}`)
    return date.getTime() // Unix timestamp from Date object.
}

// Convert Date to TeamCity's weird time notation.
function DateToTcTime(date) {
    year     = date.toISOString().substr(0, 4)
    month    = date.toISOString().substr(5, 2)
    day      = date.toISOString().substr(8, 2)
    hour     = '00' // Well... let's not get nitty gritty here.
    minute   = '00'
    second   = '00'
    timezone = '%2B0000' // +0000
    let tcTime = `${year}${month}${day}T${hour}${minute}${second}${timezone}` // TeamCity time format: 20221206T080035+0100
    return tcTime
}

// Convert HTML input datetime-local to TeamCity's weird time notation.
function htmlDateTimeToTcTime(htmlDateTime) {
    split    = htmlDateTime.split('') // 2022-12-22T23:15
    year     = split.slice(0, 4).join('')
    month    = split.slice(5, 7).join('')
    day      = split.slice(8, 10).join('')
    t        = split.slice(10, 11).join('')
    hour     = split.slice(11, 13).join('')
    minute   = split.slice(14, 16).join('')
    second   = '00'
    timezone = '%2B0000' // +0000
    let tcTime = `${year}${month}${day}T${hour}${minute}${second}${timezone}` // TeamCity time format: 20221206T080035+0100
    return tcTime
}

// Convert TeamCity's weird time notation to Unix timestamp.
function htmlDateTimeToUnix(htmlDateTime) {
    split    = htmlDateTime.split('') // 2022-12-22T23:15
    year     = split.slice(0, 4).join('')
    month    = split.slice(5, 7).join('')
    day      = split.slice(8, 10).join('')
    t        = split.slice(10, 11).join('')
    hour     = split.slice(11, 13).join('')
    minute   = split.slice(14, 16).join('')
    let date = new Date(`${year}-${month}-${day}T${hour}:${minute}`)
    return date.getTime() // Unix timestamp from Date object.
}

// Convert TeamCity's weird time notation to Unix timestamp.
function htmlDateTimeToDate(htmlDateTime) {
    split    = htmlDateTime.split('') // 2022-12-22T23:15
    year     = split.slice(0, 4).join('')
    month    = split.slice(5, 7).join('')
    day      = split.slice(8, 10).join('')
    t        = split.slice(10, 11).join('')
    hour     = split.slice(11, 13).join('')
    minute   = split.slice(14, 16).join('')
    return date = new Date(`${year}-${month}-${day}T${hour}:${minute}`)
}

// Cut-off date in TeamCity's weird time notation, used for API calls.
const cutoffTcString = function (d) {
    if (!d)
        d = new Date()
    d.setDate(d.getDate()-build_cutoff_days)
    return DateToTcTime(d)
}

// Ol' reliable Unix-time.
const cutoffUnixTime = function () {
    let d = new Date()
    d.setDate(d.getDate()-build_cutoff_days)
    return d.getTime()
};