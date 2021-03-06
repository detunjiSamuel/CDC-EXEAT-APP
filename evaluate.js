require('dotenv').config();
global.fetch = require("node-fetch");
const axiosCookieJarSupport = require('axios-cookiejar-support').default;
const tough = require('tough-cookie');

const puppeteer = require('puppeteer');
const axios = require('axios'); // typescript const axios = require('axios').default;

axiosCookieJarSupport(axios);
 
const cookieJar = new tough.CookieJar();

const LOGIN_URL = 'https://moodle.covenantuniversity.edu.ng/login/index.php';
let feedbackId = 43858;



const evaluation = async (username = process.env.USER_ID, password = process.env.USER_PASSWORD) => {
    const browser = await puppeteer.launch({
        headless: process.env.NODE_ENV == 'development' ? false : true,
        //slowMo: 250, // slow down by 250ms 
    });

    //login portion
    const page = await browser.newPage();
    await login(page, username, password);
    //get sessionID
    await page.setRequestInterception(true);
    page.on('request', async request => {
        // console.log(request.method());

        const url = request.url();
        if (url.endsWith('notifications')) {
            const sessKey = getSessionKey(url)
            request.abort();
            const cookie = await page.cookies(url);
            await browser.close();
            const { err, data } = await getCourseDetails(cookie[0].value, sessKey);
            courseIds = extractId(data['courses']);

            for(courseid in courseIds)
            {
                console.log('doing' + courseid)

                await runFeedback(feedbackId, courseid , sessKey ,cookie , /* courseid['shortname'] */)
            }


        }
        else
            request.continue();
    });



}

const runFeedback = async (feedbackId, courseId, sessionKey, cookie ,courseName=0) => {
    const url = `https://moodle.covenantuniversity.edu.ng/mod/feedback/complete.php?id=${feedbackId}&courseid=${courseId}`;
    const data = {
        id: 43858,
        courseid: courseId,
        gopage: 0,
        lastpage: null ,
        startitempos: null,
        lastitempos: null,
        sesskey: sessionKey,
        _qf__mod_feedback_complete_form: 1,
        multichoice_392: 1,
        multichoice_393: 4,
        multichoice_395: 4,
        multichoice_396: 4,
        multichoice_398: 1,
        multichoice_399: 4,
        multichoice_422: 4,
        multichoice_400: 2,
        multichoice_423: 3,
        multichoice_402: 2,
        multichoice_403: 2,
        multichoice_404: 3,
        multichoice_406: 3,
        multichoice_424: 3,
        multichoice_407: 2,
        multichoice_425: 3,
        multichoice_410: 3,
        multichoice_409: 2,
        multichoice_412: 2,
        multichoice_413: 3,
        multichoice_415: 2,
        multichoice_426: 3,
        multichoice_416: 3,
        multichoice_428: 2,
        multichoice_429: 3,
        multichoice_431: 3,
        multichoice_432: 2,
        multichoice_418: 3,
        multichoice_419: 2,
        textfield_433: 'dr',
        multichoice_421: 4,
        savevalues: 'Submit your answers'
    }

    const config = {
        method: 'post',
        url,
       jar: cookieJar, 
        withCredentials: true,
        headers: {
            'Cookie': `MoodleSession=${cookie}`,
            'Content-Type': 'text/plain'
        },
        data
    };
    console.log('got to responae top'+courseName)
    const response = await axios(config);
    
    console.log(`done with ${courseName} with `)



}

const extractId = (courses) => {
    const data = {};
    for (course of courses) {
        data[course.id] = course.shortname
        console.log(course.id)
    }
    return data;
}

const getCourseDetails = async (cookie, sessionKey) => {
    const data = '[{"index":0,"methodname":"core_course_get_enrolled_courses_by_timeline_classification","args":{"offset":0,"limit":0,"classification":"all","sort":"fullname","customfieldname":"","customfieldvalue":""}}]';

    const config = {
        method: 'post',
        url: `https://moodle.covenantuniversity.edu.ng/lib/ajax/service.php?sesskey=${sessionKey}&info=core_course_get_enrolled_courses_by_timeline_classification`,
        headers: {
            'Cookie': `MoodleSession=${cookie}`,
            'Content-Type': 'text/plain'
        },
        data
    };

    const response = await axios(config);
    return response.data[0];
}

const getSessionKey = (url) => {
    //Todo optimize
    return url.slice(url.indexOf('=') + 1, url.indexOf('&'))
}

const login = async (pageInstance, username, password) => {
    await pageInstance.goto(LOGIN_URL);
    await handleTying(pageInstance, '#username', username);
    await handleTying(pageInstance, '#password', password);
    await (await pageInstance.$('#loginbtn')).click();
    return;
}

const handleTying = async (page, selectorId, inserted) => {
    const field = await page.$(selectorId)
    await field.type(inserted);
    return;
}

evaluation();
