class TimeUtilities {

    // Convert TeamCity's weird time notation to Unix timestamp.
    static tcTimeToUnix(tcTime) {
        let split    = tcTime.split('')
        let year     = split.slice(0, 4).join('')
        let month    = split.slice(4, 6).join('')
        let day      = split.slice(6, 8).join('')
        let t        = split.slice(8, 9).join('')
        let hour     = split.slice(9, 11).join('')
        let minute   = split.slice(11, 13).join('')
        let second   = split.slice(13, 15).join('')
        let timezone = split.slice(15, 23).join('')
        let date = new Date(`${year}-${month}-${day}T${hour}:${minute}:${second}.000${timezone}`)
        return date.getTime() // Unix timestamp from Date object.
    }

    // Convert Date to TeamCity's weird time notation.
    static DateToTcTime(date) {
        let year     = date.toISOString().substr(0, 4)
        let month    = date.toISOString().substr(5, 2)
        let day      = date.toISOString().substr(8, 2)
        let hour     = '00' // Well... let's not get nitty gritty here.
        let minute   = '00'
        let second   = '00'
        let timezone = '%2B0000' // +0000
        let tcTime = `${year}${month}${day}T${hour}${minute}${second}${timezone}` // TeamCity time format: 20221206T080035+0100
        return tcTime
    }

    // Convert HTML input datetime-local to TeamCity's weird time notation.
    static htmlDateTimeToTcTime(htmlDateTime) {
        let split    = htmlDateTime.split('') // 2022-12-22T23:15
        let year     = split.slice(0, 4).join('')
        let month    = split.slice(5, 7).join('')
        let day      = split.slice(8, 10).join('')
        let t        = split.slice(10, 11).join('')
        let hour     = split.slice(11, 13).join('')
        let minute   = split.slice(14, 16).join('')
        let second   = '00'
        let timezone = '%2B0000' // +0000
        let tcTime = `${year}${month}${day}T${hour}${minute}${second}${timezone}` // TeamCity time format: 20221206T080035+0100
        return tcTime
    }

    // Convert TeamCity's weird time notation to Unix timestamp.
    static htmlDateTimeToUnix(htmlDateTime) {
        let split    = htmlDateTime.split('') // 2022-12-22T23:15
        let year     = split.slice(0, 4).join('')
        let month    = split.slice(5, 7).join('')
        let day      = split.slice(8, 10).join('')
        let t        = split.slice(10, 11).join('')
        let hour     = split.slice(11, 13).join('')
        let minute   = split.slice(14, 16).join('')
        let date = new Date(`${year}-${month}-${day}T${hour}:${minute}`)
        return date.getTime() // Unix timestamp from Date object.
    }

    // Convert TeamCity's weird time notation to Unix timestamp.
    static htmlDateTimeToDate(htmlDateTime) {
        let split    = htmlDateTime.split('') // 2022-12-22T23:15
        let year     = split.slice(0, 4).join('')
        let month    = split.slice(5, 7).join('')
        let day      = split.slice(8, 10).join('')
        let t        = split.slice(10, 11).join('')
        let hour     = split.slice(11, 13).join('')
        let minute   = split.slice(14, 16).join('')
        return date = new Date(`${year}-${month}-${day}T${hour}:${minute}`)
    }

    // subtract build cutoff days from teamcity for api requests.
    static cutoffTcString(date) {
        if (!date)
            date = new Date()
        date.setDate(date.getDate()-build_cutoff_days)
        return this.DateToTcTime(date)
    }

    // subtract build cutoff days from unix time for rendering as display html.
    static cutoffUnixTime() {
        let date = new Date()
        date.setDate(date.getDate()-build_cutoff_days)
        return date.getTime()
    };
}