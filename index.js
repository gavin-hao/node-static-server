
const child_process = require('child_process')

function isDebug(){
    return true;//process.env.NODE_ENV=='development'
}
if(isDebug()){
    process.execArgv.push('--debug-brk=5858')
}
var child = child_process.fork('./child.js',['dirs=./public1;./public2']);

child.on('message', function (m) {
    console.log('message from child: ' + JSON.stringify(m));
});

child.send({ from: 'parent' });
child.on('exit',()=>{
    console.log('child process had exited!')
})
child.on('error',(error)=>{
    console.log('an error accoured: ',error)
})
// setTimeout(function() {
//      child.kill()
// }, 5000);


