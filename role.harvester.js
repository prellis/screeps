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

function findDestination(creep, destinations, errStr) {
    if (destinations.length > 0) {
        return destinations[0];
    }
    else {
        if (null != errStr) {
            creep.say(errStr);
        }
        return null;
    }
}

function findDeliveryDestination(creep) {
    destinations = creep.room.find(FIND_STRUCTURES, {
        filter: (structure) => {
            return ((structure.structureType == STRUCTURE_EXTENSION ||
                     structure.structureType == STRUCTURE_SPAWN) &&
                    structure.energy < structure.energyCapacity);
        }
    });
    
    return findDestination(creep, destinations,
                           "No DelDest");
}

function findHarvestingDestination(creep) {
    destinations = creep.room.find(FIND_SOURCES);

    return findDestination(creep, destinations, 
                           "No HarDest");
}

function getErrorCommutingDestination(creep) {
    var destination = findHarvestingDestination(creep);
    if (null == destination) {
        destination = findDeliveryDestination(creep);
    }
    
    if (null == destination) {
        console.log("getErrorCommutingDestination() " +
                    "unrecognized state in memory! :'(");            
    }
    
    return destination;
}

function Commuting(creep, destination) {
    this._destination = destination;
    this._creep = creep;

    this.tick = function(context) {
        if (this._destination.pos.isNearTo(creep.pos)) {
            if (this._creep.carry.energy == 0) {
                context.setState("harvesting", destination);
            }
            else {
                context.setState("delivering", destination);
            }
        }
        else {
            this._creep.moveTo(destination,
                               {visualizePathStyle: {stroke: '#ffaa00'}});
        }
    }
    this.report = function() {
        this._creep.say('commuting');
    }
}

function Harvesting(creep, destination) {
    this._destination = destination;
    this._creep = creep;

    this.tick = function(context) {
        if (this._creep.carry.energy == this._creep.carryCapacity) {
            var deliveryDestination = findDeliveryDestination(this._creep);
            if (deliveryDestination != null) {
                context.setState("commuting", deliveryDestination);
            }
        }
        else {
            this._creep.harvest(this._destination);
        }
    }

    this.report = function() {
        this._creep.say('harvesting');
    }
}

function Delivering(creep, destination) {
    this._destination = destination;
    this._creep = creep;

    this.tick = function(context) {
        if (this._creep.carry.energy == 0) {
            var destination = findHarvestingDestination(creep);
            if (destinations != null) {
                context.setState("commuting", destination);
            }
        }
        else {
            this._creep.transfer(this._destination, RESOURCE_ENERGY);
        }
    }

    this.report = function() {
        this._creep.say('delivering');
    }
}

/**
   null destination is expected
*/
function Error(creep, destination)  {
    this._destination = destination;
    this._creep = creep;
    
    this.tick = function(context) {
        console.log("Error:tick() Error state reached.");
        var destination = getErrorCommutingDestination(this._creep);
        if (null == destination) {
            console.log("Error::tick() " +
                        "Fallback to to commuting state failed.");
        }
        else {
            context.setState("commuting", destination);
        }
    }

    this.report = function() {
        this._creep.say("In a bad state!  Pls Halp.");
    }
}

/* Encapsulates
   * Current state
   * Saving state in screeps memory
   * Restoring state from screeps memory
   */
/* State can only change once per tick. */
/** @param {Creep} creep **/
function StateContext(creep) {
    this._stateConstructorMap = {commuting: Commuting,
                                 delivering: Delivering,
                                 harvesting: Harvesting};
    
    this._creep = creep;
    this._state =
        getStateFromScreepsMem(this._stateConstructorMap,
                               this._creep.memory);
    
    /* Unknown state in memory.  Try to go to commuting? */
    if (null == this._state) {
        var destination = getErrorCommutingDestination(this._creep);
        if (null == destination) {
            console.log("StateContext::ctor() " +
                        "Fallback to to commuting state failed.");
            this._state = new Error(this._creep, destination);
        }
        else {
            var stateConstructor = this._stateConstructorMap["commuting"];
            this._state = new stateConstructor(this._creep, destination);
        }
    }

    function getStateFromScreepsMem(stateConstructorMap, memory) {
        return getStateFromStrings(stateConstructorMap,
                                   memory.state,
                                   memory.destination);
    }

    function getStateFromStrings(stateConstructorMap,
                                 stateString,
                                 destinationString) {
        var stateConstructor = stateConstructorMap[stateString];
        var destination = Game.getObjectById(destinationString);

        if (stateConstructor != null) {
            return new stateConstructor(creep, destination);
        }
        return null;
    }

    function commitToScreepsMem(memory, stateString, destinationString) {
        memory.state = stateString;
        memory.destination = destinationString;
    }

    this.setState = function(stateString, destination) {
        var stateConstructor = this._stateConstructorMap[stateString];

        if (stateConstructor != null) {
            this._state = new stateConstructor(this._creep, destination);
            commitToScreepsMem(this._creep.memory,
                               stateString,
                               destination.id);
            this.report();
        }
        else {
            console.log("StateContext::setState() " +
                        "unrecognized state '" + stateString + ".' :'(");
        }
    }

    this.tick = function() {
        this._state.tick(this);
    }

    this.report = function() {
        return this._state.report();
    }

    this.logStateToConsole = function() {
        console.log(this._creep.memory.state + " " +
                    this._creep.memory.destination)
    }    
}

var roleHarvester = {
    /** @param {Creep} creep **/
    run: function(creep) {
        var context = new StateContext(creep);
        context.tick();
    }
};

module.exports = roleHarvester;
