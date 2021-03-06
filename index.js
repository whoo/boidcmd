var cmd = require('node-cmd')
var convert = require('xml-js')
var fs = require('fs')
var client = require("./api.js")
const minimist = require('minimist')
const ora = require('ora')
const spinner = ora()
const readline = require('readline')
const { spawn } = require('child_process')
const exec = require('child_process').exec

var form = {
    email: '',
    password: '',
    invitedById: null,
    device: null
  }

var projectObject = {
    deviceId: '',
    wcgid: ''
}

module.exports = () => {
    const args = minimist(process.argv.slice(2))
    var boidcmd = args._[0]
    var value = args._[1]

    if(args.version || args.v) {
        boidcmd = 'version'
    }

    if(args.help || args.h || args._[0] == undefined) {
        boidcmd = 'help'
    }

    switch (boidcmd) {
        case 'setCPU':
        setCPU(value)
        break
        case 'devices':
        checkDevices()
        break
        case 'setup':
        setupBoid()
        break
        case 'install':
        installBoid()
        break
        case 'run':
        runBoid()
        break
        case 'quit':
        quitBoid()
        break
        case 'resume':
        resume()
        break
        case 'suspend':
        suspend()
        break
        case 'status':
        statusBoid()
        break
        case 'help':
        require('./help')
        break
        case 'version':
        require('./version')
        break
        default:
        console.error(`"${boidcmd}" is not a valid command!`)
        process.exit(1)
        break
    }
}

var rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function isProcessRunning(processName){
    const cmd = `ps -A`
    return new Promise(function(resolve,reject){
       exec(cmd, function(err,stdout,stderr) {
          //console.log(stdout.indexOf('boinc'))
	  resolve(stdout.toLowerCase().indexOf(processName.toLowerCase()) > -1)
       })
    })
}

async function verifyBoinc(){
    let status = await isProcessRunning('boinc')   
    if(!status){
          console.log("boinc process is not running, please run systemctl start boinc-client")
          process.exit(-1)           
    } 
}
 
async function setupBoid(){
 
    await verifyBoinc()
  
    var form = {}
    rl.stdoutMuted = false
    rl.question('Boid Account Email:', (email) => {
        form.email = email
        rl.question('Boid Account Password: ', (password) => {
            form.password = password
            client.send(form,client.endPoint.authenticateUser,function(response){
                response = JSON.parse(response)
                if (response.invalid){
                    console.log()
                    console.log(response.invalid)
                    return setupBoid()
                }
                client.setUserData(response)
                rl.close()
                setupBoinc()
            })
        })
        rl.stdoutMuted = true
    })

    rl._writeToOutput = function _writeToOutput(stringToWrite) {
      if (rl.stdoutMuted)
        rl.output.write("*")
      else
        rl.output.write(stringToWrite)
    }
}

async function checkDevices(value){

    var form = {}
    rl.stdoutMuted = false
    rl.question('Boid Account Email:', (email) => {
        form.email = email
        rl.question('Boid Account Password: ', (password) => {
            form.password = password
            client.send(form,client.endPoint.authenticateUser,function(response){
                response = JSON.parse(response)
                if (response.invalid){
                    console.log()
                    console.log(response.invalid)
                    return checkDevices(value)
                }
                client.setUserData(response)
                rl.close()
                client.send({"id":response.id},client.endPoint.getUser,function(obj){
                    //console.log(obj)
                    var json = JSON.parse(obj)
                    if(value == "csv"){
                      console.log("\nUsername:        ", json.username )
                      console.log("User Boid Power: ", json.dPower)
                      console.log("Registered devices (CSV format):")
                      console.log("ID,STATUS,TYPE,POWER,PENDING,NAME")
                      for(count in json.devices){
                          console.log(json.devices[count].id+","+json.devices[count].status+","+json.devices[count].type+","+json.devices[count].power+","+json.devices[count].pending+","+json.devices[count].name)
                      }
                    }
                    else {
                       console.log(json)
                    }
                })
            })
        })
        rl.stdoutMuted = true
        // rl.history = rl.history.slice(1)
    })

    rl._writeToOutput = function _writeToOutput(stringToWrite) {
      if (rl.stdoutMuted)
        rl.output.write("*")
      else
        rl.output.write(stringToWrite)
    }
}

function runBoid(){
    const subprocess = spawn('boinc',['--dir', '/var/lib/boinc-client/', '--daemon', '--allow_remote_gui_rpc'], {
        detached: true,
        stdio: 'ignore'
      });

      subprocess.unref();
}

function quitBoid(){
    const subprocess = spawn('boinccmd',['--quit'], {
        detached: true,
        stdio: 'ignore'
      });

    subprocess.unref();

    console.log("boinc stopped..")
    process.exit(0)
}

async function installBoid() {

    await verifyBoinc()

    cmd.get(
        `
            boinccmd --project_attach http://www.worldcommunitygrid.org/ 1061556_a0c611b081f8692b7ef0c11d39e6105c
        `,
        function(err, data, stderr){
            if (!err) {
                console.log("\nwaiting for project information")
                spinner.start()
                setTimeout(projectCheck,3000)
            } else {
               console.log('error', err)
            }

        }
    );
}

function projectCheck(){
    fs.readFile( '/var/lib/boinc-client/client_state.xml', function(err, data) {
        var result1 = convert.xml2json(data, {compact: true, spaces: 4});
        var object = JSON.parse(result1);
        var hostInfo = object.client_state.host_info
        var project = object.client_state.project
        var name = hostInfo.domain_name._text
        var cpid = hostInfo.host_cpid._text
        var threads = hostInfo.p_ncpus._text
        var model = hostInfo.p_model._text

        if (project == undefined){
           console.error("ERROR: you have no project attached, the boinc daemon is likely not installed or running.")
           process.exit(-1)
        }
        if (project.length > 1){
            console.error("ERROR: you have more than 1 project already configured, boidcmd requires you to only be attached to www.worldcommunitygrid.org")
            process.exit(-1)
        }

        var wcgid = project.hostid._text

        if(wcgid == "0"){
            setTimeout(projectCheck,3000)
            console.log("Timeout while checking project status.")
        }else{
            spinner.stop()
            console.log("Success!")
        }
     });
}

function valBetween(v, min, max) {
    return Math.min(max, Math.max(min, v))
}

async function setCPU(value){

    await verifyBoinc()

    fs.readFile( '/var/lib/boinc-client/global_prefs_override.xml', function(err, data) {
        var result1 = convert.xml2json(data, {compact: true, spaces: 4});
        var object = JSON.parse(result1);
        object.global_preferences.cpu_usage_limit = valBetween(value,0,100)
        var options = {compact:true, ignoreComment:true, spaces:4};
        var xmlResult = convert.json2xml(object,options);
        console.log(object)
        console.log(xmlResult)
        fs.writeFile('/var/lib/boinc-client/global_prefs_override.xml',xmlResult,function(err){
            if (err) throw err;
            readGlobalPrefsOverride()
        })
     });
}

async function readGlobalPrefsOverride(){

    await verifyBoinc()

    isProcessRunning("boinc", (status) => {
                if(!status){
                   console.log("boinc process is not running, please run systemctl start boinc-client")
                   process.exit(-1)
                }
    })

    spinner.start()
    cmd.get(
        `
            boinccmd --read_global_prefs_override
        `,
        function(err, data, stderr){
            if (!err) {
                console.log("Sucessfully set cpu limit")
                spinner.stop()
                console.log(data)
                console.log(stderr)
                process.exit(0);
            } else {
               console.log('error', err)
            }
        }
    );
}

async function setupBoinc(){

    await verifyBoinc()

    cmd.get(
        `
            boinccmd --project_attach http://www.worldcommunitygrid.org/ 1061556_a0c611b081f8692b7ef0c11d39e6105c
        `,
        function(err, data, stderr){
            if (!err) {
                console.log("\nwaiting for project information")
                spinner.start()
                setTimeout(readFiles,3000)

            } else {
                // if (error.search(''))
               console.log('error', err)
               setTimeout(readFiles,3000)
            }
        }
    );
}

async function resume() {

    await verifyBoinc()

    cmd.get(
        `
            boinccmd --project http://www.worldcommunitygrid.org/ resume
        `,
        function(err, data, stderr){
            if (!err) {
               console.log(data)
               console.log(stderr)
               process.exit(0);
            } else {
               console.log('error', err)
            }

        }
    );
}

async function suspend() {

    await verifyBoinc()

    cmd.get(
        `
            boinccmd --project http://www.worldcommunitygrid.org/ suspend
        `,
        function(err, data, stderr){
            if (!err) {
               console.log(data)
               console.log(stderr)
               process.exit(0);
            } else {
               console.log('error', err)
            }

        }
    );
}

async function statusBoid() {

    await verifyBoinc() 

    var pass = "n/a"
    fs.readFile('/var/lib/boinc-client/gui_rpc_auth.cfg', function(err, data) { 
      console.log(data)
      pass = data 
      console.log(err)
    })

    console.log(pass)

    cmd.get(
        `
            boinccmd --get_simple_gui_info
        `,
        function(err, data, stderr){
            if (!err) {
               console.log(data)
               console.log(stderr)
               process.exit(0);
            } else {
               console.log('error', err)
            }

        }
    );
}

function readFiles(callback) {
    fs.readFile( '/var/lib/boinc-client/client_state.xml', function(err, data) {
        var result1 = convert.xml2json(data, {compact: true, spaces: 4});
        var object = JSON.parse(result1);
        var hostInfo = object.client_state.host_info
        var name = hostInfo.domain_name._text
        var cpid = hostInfo.host_cpid._text
        var threads = hostInfo.p_ncpus._text
        var model = hostInfo.p_model._text
        var project = object.client_state.project

        if (project == undefined){
            console.error("ERROR: you have no project attached, the boinc daemon is likely not installed or running.")
            process.exit(-1)
        }

        if (project.length > 1){
            console.error("ERROR: you have more than 1 project already configured, boidcmd requires you to only be attached to www.worldcommunitygrid.org")
            process.exit(-1)
        }
        var wcgid = project.hostid._text

        if(wcgid == "0"){
            setTimeout(readFiles,3000)
        }else{
            spinner.stop()
            projectObject.wcgid = wcgid
            var device = {
                cpid:cpid,
                //cpid:makeid(),
                name:name,
                type:"LINUX"
            }
            console.log("Adding device to boid account")
            client.send(device,client.endPoint.addDevice,function(obj){
                var json = JSON.parse(obj)
                if(json.error != undefined) {
                    console.log("error adding Device")
                }else{
                    console.log("Added device to boid account")
                    var deviceId = json.id
                    client.send({"id":deviceId},client.endPoint.getDevice,function(obj){
                        var json = JSON.parse(obj)
                        console.log(json)
                        projectObject.deviceId = json.id
                        client.send(projectObject,client.endPoint.updateDevice,function(obj){
                            var json = JSON.parse(obj)
                            console.log(json)
                            console.log("Setting up project")
                            if (json.error == undefined) {
                                //console.log(json.error)
                            }else{
                                client.send({"id":projectObject.deviceId},client.endPoint.getDevice,function(obj){
                                    var json = JSON.parse(obj)
                                    if(json.wcgid != null){
                                        if(projectObject.wcgid == json.wcgid){
                                            console.log("Project setup Success!")
                                        }else {
                                            console.log(" Device is using a different wcgid wcgid:"+json.wcgid)
                                        }
                                    }else{
                                        //some other issue caused a problem
                                    }
                                    console.log('Setup complete. Run "boidcmd status" to view project status')
                                    process.exit(0);
                                })
                            }
                        })
                    })
                }
            })
        }
     });
}

// sudo aptitude install boinc-client
// sudo aptitude purge boinc-client

