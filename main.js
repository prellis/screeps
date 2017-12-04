var roleHarvester = require('role.harvester');
var roleUpgrader = require('role.upgrader');

module.exports.loop = function() {
    var startingCPU = Game.cpu.getUsed();
    

    for (var name in Memory.creeps) {
        if (!Game.creeps[name]) {
            delete Memory.creeps[name];
            console.log('Clearing non-existing creep memory:', name);
        }
    }


    var harvesters = _.filter(Game.creeps,
                              (creep) => creep.memory.role == 'harvester');
    var upgraders = _.filter(Game.creeps,
                             (creep) => creep.memory.role == 'upgrader');
    var testIfCanSpawn =
        Game.spawns['Spawn1'].spawnCreep([WORK, CARRY, MOVE],
                                         'creep' + Game.time,
                                         { dryRun: true });

    //    console.log('Harvesters: ' + harvesters.length);
    //    console.log('Upgraders: ' + upgraders.length);

    if (harvesters.length < 2) {
        if (testIfCanSpawn == OK) {
            var newName = 'harvester' + Game.time;
            console.log('Spawning new harvester: ' + newName);
            Game.spawns['Spawn1'].spawnCreep([WORK, CARRY, MOVE], newName,
		{memory: {role: 'harvester', state: 'new'}});
        }
    }

    if (upgraders.length < 2) {
        if (testIfCanSpawn == OK) {
            var newName = 'upgrader' + Game.time;
            console.log('Spawning new upgrader: ' + newName);
            Game.spawns['Spawn1'].spawnCreep([WORK, CARRY, MOVE],
                newName, {memory: {role: 'upgrader'}});
        }
    }

    var preLoopCPU = Game.cpu.getUsed() - startingCPU;
    var singleLoopCPU = 0;
    var allLoopCPU = 0;

    /* This wastes a bunch of CPU since the game only supports doing
       one action from run() per CPU.
       TODO: Use the cpu cycle feedback to MAKE MOAR SCREEPS
    */
    
    while (Game.cpu.tickLimit - 2 > allLoopCPU + 5 * singleLoopCPU) {
        var startLoopCPU = Game.cpu.getUsed();
        for (var name in Game.creeps) {
            var creep = Game.creeps[name];
            if (creep.memory.role == 'harvester') {
                roleHarvester.run(creep);
            }
            if (creep.memory.role == 'upgrader') {
                roleUpgrader.run(creep);
            }
        }
        singleLoopCPU = Game.cpu.getUsed() - startLoopCPU;
        allLoopCPU = allLoopCPU + singleLoopCPU;
    }

    console.log('CPU Stats');    
    console.log(' used in screeps loop: ' + allLoopCPU);
    console.log(' total used: ' + Game.cpu.getUsed());
    console.log(' bucket: ' + Game.cpu.bucket);    
}
