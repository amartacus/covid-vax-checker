const { exec } = require("child_process");

const MINUTE_INTERVAL = 2;
const twilioClient = require("twilio")(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
let setIntervalId;

const sendTextMessage = (message) => {
  twilioClient.messages
    .create({
      body: message,
      from: "+18507547573",
      to: process.env.MY_PHONE_NUMBER,
    })
    .then(
      (message) => {
        console.log("message sent", message.sid);
      },
      (error) => {
        console.error("Call failed!  Reason: " + error.message);
      }
    );
};

const parseResult = (result) => {
  const data = JSON.parse(result).responsePayloadData.data.NJ;
  // log data
  console.log("-----------");
  console.log(new Date().toLocaleString());
  console.table(data);
  const available_appt = data.filter((item) => item.status === 'Available');
  const createTextBody = (data) => {
    const availableLocations = data.map((item) => item.city).join(", ");
    return "Vaccine appointments are available at the following locations: " + availableLocations + "." + 
    " Visit https://www.cvs.com/immunizations/covid-19-vaccine to book.";
  };

  if (available_appt.length > 0) {
    // We found appointments!
    // Output to console
    console.log("------ Available Appointments ------");
    console.log("https://www.cvs.com/immunizations/covid-19-vaccine");
    console.table(available_appt);
    // Send text message
    sendTextMessage(createTextBody(available_appt));
    // Halt interval and run again after some time
    clearInterval(setIntervalId);
    setTimeout(run, 20 * 1000 * 60);
    return;
  }
};

const run = () => {
  setIntervalId = setInterval(() => {
    exec("./cvs-curl.sh", (error, stdout, stderr) => {
      if (error != null) {
        sendTextMessage(`exec error: ${error}`);
        // Limit one message per process
        clearInterval(setIntervalId);
        return;
      }
      parseResult(stdout);
    });
  }, MINUTE_INTERVAL * 1000 * 60);
};

run();
