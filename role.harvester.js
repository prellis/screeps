/** @param {Creep} creep
    @param {boolean} toSource
*/
function toCommuting(creep, toSource) {
    var destinations;
    if (toSource) {
        destinations = creep.room.find(FIND_SOURCES);
    }
    else {
        destinations = creep.room.find(FIND_STRUCTURES, {
            filter: (structure) => {
                return ((structure.structureType ==
                         STRUCTURE_EXTENSION ||
                         structure.structureType == STRUCTURE_SPAWN) &&
                        structure.energy < structure.energyCapacity);
            }
        });
    }
    if (destinations.length > 0) {
        creep.memory.state = "commuting";
        creep.memory.destination = destinations[0].id;
        creep.say('commuting');
    }
}

var roleHarvester = {

    /** Harvesters are state machines.

       State: commuting

       Description: Harvester is moving to a source to harvest or to a
                    structure to deliver energy
       Memory: destination
       Transition to: Search for destination
       Transition from: Destination adjacent to harvester

       State: harvesting
       Description: Harvester is transfering energy from source to
                    screep
       Memory: None
       Transition to: creep.harvest()
       Transition from: creep.carry.energy == creep.carryCapacity

       State: delivering
       Description: Harvester is transfering energy to structure
       Memory: None
       Transition to: creep.transfer(, RESOURCE_ENERGY)
       Transition from: creep.carry.energy == 0
    */

    /** @param {Creep} creep **/
    run: function(creep) {
        if (creep.memory.state != "commuting" &&
            creep.memory.state != "delivering" &&
            creep.memory.state != "harvesting") {
            toCommuting(creep, true);
        }

        if (creep.memory.state == "commuting") {
            var destination = Game.getObjectById(creep.memory.destination);

            if (destination.pos.isNearTo(creep.pos)) {
                if (creep.carry.energy == 0) {
                    creep.memory.state = "harvesting";
                    creep.say('harvesting');
                }
                else {
                    creep.memory.state = "delivering";
                    creep.say('delivering');
                }
            }
            else {
                creep.moveTo(destination,
                             {visualizePathStyle: {stroke: '#ffaa00'}});
            }
        }
        else if (creep.memory.state == "harvesting") {
            if (creep.carry.energy == creep.carryCapacity) {
                toCommuting(creep, false);
            }
            else {
                var destination = Game.getObjectById(creep.memory.destination);
                creep.harvest(destination);
            }
        }
        else if (creep.memory.state == "delivering") {
            if (creep.carry.energy == 0) {
                toCommuting(creep, true);
            }
            else {
                var destination = Game.getObjectById(creep.memory.destination);
                creep.transfer(destination, RESOURCE_ENERGY);
            }
        }
    }
};

module.exports = roleHarvester;
