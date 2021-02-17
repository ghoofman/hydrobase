const { spawn } = require("child_process");
const readline = require('readline');

function run_script(command, args, callback) {
    console.log("Starting Process.");
    var child = spawn(command, args, {
        cwd: __dirname + '/programs'
    });

    var scriptOutput = "";

    child.stdout.setEncoding('utf8');
    child.stdout.on('data', function(data) {
        console.log('stdout: ' + data);

        data=data.toString();
        scriptOutput+=data;
    });

    child.stderr.setEncoding('utf8');
    child.stderr.on('data', function(data) {
        console.log('stderr: ' + data);

        data=data.toString();
        scriptOutput+=data;
    });

    child.on('close', function(code) {
        callback(scriptOutput,code);
    });
}

// module.exports = function Run(program, arguments, lineCB) {
//     //run_script(program, arguments, lineCB);
//     //return;
//     console.log('Running: ' + program);
    
//     const p = spawn(program, arguments, {
//         cwd: __dirname + '/programs',
//         shell: false,
//         // detached: true,
//         stdio: 'inherit'
//     });
    
//     // p.stdout.setEncoding('utf8');

//     // p.stdout.pipe(process.stdout);
    
//     // p.stdout.on('data', (data) => {
//     //     console.log(data);
//     // });

//     // p.stderr.on('data', (data) => {
//     //     console.log(data);
//     // });

//     p.on('error', (data) => {
//         console.log('error', data);
//     });

//     p.on('disconnect', (data) => {
//         console.log(data);
//     });

//     p.on('message', (data) => {
//         console.log('message', data);
//     });

//     p.on('close', (code) => {
//         console.log(`child process close all stdio with code ${code}`);
//     });

//     p.on('exit', (code) => {
//         console.log('Process exit event with code: ', code);
//       });

//     readline.createInterface({
//         input     : process.stdout,
//         terminal  : true
//       }).on('line', function(line) {
//         console.log('line', line);
//         lineCB(line);
//       });

//     //   console.log('kill in 1 second');
//     //   setTimeout(() => {
//     //     console.log('killed');
//     //     p.kill(0);
//     //   }, 1000)
// }


module.exports = function Run(exe, args, cb) {
    return new Promise((resolve, reject) => {
        const env = Object.create(process.env);
        const options = {
            cwd: __dirname + '/programs',
            shell: true
            // stdio: 'inherit'
        };
        const child = spawn(exe, args, {
            ...options,
            env: {
                ...env,
                ...options.env,
            },
        });
        child.stdout.setEncoding('utf8');
        child.stderr.setEncoding('utf8');
        child.stdout.on('data', data => cb(data));
        child.stderr.on('data', data => console.log(data));
        child.on('error', error => reject(error));
        child.on('close', exitCode => {
            console.log('Exit code:', exitCode);
            resolve(exitCode);
        });
        
        console.log("spawned: " + child.pid);

        setInterval(function() {
            child.stdout.write("hi");
        }, 1000)
    });
}