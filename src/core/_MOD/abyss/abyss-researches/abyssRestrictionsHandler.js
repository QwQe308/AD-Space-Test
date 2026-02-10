import { FailableRestriction, Restriction } from "../../restrictionHandler.js";

export class AbyssRestriction extends Restriction{
  constructor(config, nodeId, index){
    super(config);

    this.nodeId = nodeId
    this.index = index
  }

  get data(){
    return player.abyssResearches[this.nodeId].restrictionData[this.index]
  }

  get restrictionNerf(){
    return this.config.restrictionNerf()
  }
}

export class AbyssFailableRestriction extends FailableRestriction{
  constructor(config, nodeId, index){
    super(config);

    this.nodeId = nodeId
    this.index = index
  }

  get data(){
    return player.abyssResearches[this.nodeId].restrictionData[this.index]
  }

  get restrictionNerf(){
    return this.config.restrictionNerf()
  }
}