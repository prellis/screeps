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

    var loopCPU = Game.cpu.getUsed() - startLoopCPU;

    console.log('CPU Stats');    
    console.log(' used in screeps loop: ' + loopCPU);
    console.log(' total used: ' + Game.cpu.getUsed());
    console.log(' bucket: ' + Game.cpu.bucket);    
}
