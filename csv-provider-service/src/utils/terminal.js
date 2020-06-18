let terminalTimerInterval = '';
let time = 0;

exports.startTimer = () => {
    terminalTimerInterval = setInterval(() => {
        replaceTerminalLine(`Upload time: ${time.toString()} sec`);
        time++;
    }, 1000);
};

exports.endTimer = () => {
    if(terminalTimerInterval) {
        clearInterval(terminalTimerInterval);
        time = 0;
        process.stdout.write(" \n");
    }
};

const replaceTerminalLine = line => {
    process.stdout.clearLine();
    process.stdout.cursorTo(0);
    process.stdout.write(line);
};