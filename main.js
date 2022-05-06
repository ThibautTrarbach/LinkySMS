const CronJob = require('cron').CronJob;
const linky = require('linky');
const https = require('https');
require('dotenv').config();

let sessionLinky;
const UP = process.env.UP;
const AT = process.env.AT;
const RT = process.env.RT;
const FREE_USER = process.env.FREE_USER;
const FREE_PASS = process.env.FREE_PASS;

function openSessionLinky(accessToken, refreshToken) {
    console.log("Refresh Linky Connection")
    sessionLinky = new linky.Session({
        accessToken: accessToken,
        refreshToken: refreshToken,
        usagePointId: UP,
        onTokenRefresh: (accessToken, refreshToken) => {
            openSessionLinky(accessToken, refreshToken);
        },
    })
}

async function workflowData(startTime, endTime, semaine = false) {
    let dailyConsuption = await sessionLinky.getDailyConsumption(startTime, endTime);
    let unite = dailyConsuption.unit;

    let dataLength = dailyConsuption.data.length
    let datavalue = dailyConsuption.data.at(dataLength - 1).value
    let dataDate = dailyConsuption.data.at(dataLength - 1).date

    let smsSemaine = `Linky - ${datavalue}${unite} le ${dataDate}`
    await worflowSendFreeSMS(smsSemaine);

    if (semaine) {
        let maxSemValue = 0;
        let maxSemDate;
        let minSemValue = 6000000;
        let minSemDate;

        dailyConsuption.data.forEach(data => {
            let value = data.value;
            let date = data.date;

            if (maxSemValue < value) {
                maxSemValue = value;
                maxSemDate = date;
            }

            if (minSemValue > value) {
                minSemValue = value;
                minSemDate = date;
            }
        })

        let smsSemaine = `Linky - Du ${startTime} au ${endTime}. Consommation minimale = ${minSemValue + unite} le ${minSemDate}, Consommation maximale = ${maxSemValue + unite} le ${maxSemDate}`
        await worflowSendFreeSMS(smsSemaine);
    }
}

async function worflowSendFreeSMS(sms) {
    const apiUrl = `https://smsapi.free-mobile.fr/sendmsg?user=${FREE_USER}&pass=${FREE_PASS}&msg=${sms}`;

    console.log(sms);

    https.get(apiUrl, function(res) {
        if(res !== 200) console.log("Une erreur est survenu pendant l'envois du SMS")
        res.resume();
    }).on('error', function(e) {
        console.error(e);
    });
}

function getDate(d) {
    let date = new Date(d)

    let year = date.getFullYear();
    let month = ("0" + (date.getMonth() + 1)).slice(-2);
    let day = ("0" + (date.getDate())).slice(-2);

    return `${year}-${month}-${day}`
}

const semaineCron = new CronJob(
    '0 0 9 * * 1',
    function () {
        let now = new Date();
        let lastWeek = new Date(new Date().setDate(now.getDate() - 7));

        workflowData(getDate(lastWeek), getDate(now), true).then(r => console.log("Week Result = " + r))
    },
    null,
    true,
    'Europe/Paris'
);

const dayCron = new CronJob(
    '0 0 9 * * *',
    function () {
        let now = new Date();
        let lastWeek = new Date(new Date().setDate(now.getDate() - 1));

        console.log(now)
        console.log(lastWeek)

        workflowData(getDate(lastWeek), getDate(now)).then(r => console.log("Week Result = " + r))
    },
    null,
    true,
    'Europe/Paris'
);

// Load First Session
openSessionLinky(AT, RT)

semaineCron.start()
dayCron.start()

