import { DC } from "../../../constants.js";
import { FailableRestriction, Restriction } from "../../restrictionHandler.js";

export class AbyssRestriction extends Restriction{
  constructor(config, nodeId, index){
    config.nodeId = nodeId
    config.index = index

    if(!config.nerf) config.nerf = () => DC.D1

    super(config);
  }

  get data(){
    return player.abyssResearches[this.config.nodeId].restrictionData[this.config.index]
  }

  get nerf(){
    return this.config.nerf()
  }
}

export class AbyssFailableRestriction extends FailableRestriction{
  constructor(config, nodeId, index){
    config.nodeId = nodeId
    config.index = index

    if(!config.nerf) config.nerf = () => DC.D1

    super(config);
  }

  get data(){
    return player.abyssResearches[this.config.nodeId].restrictionData[this.config.index]
  }

  get nerf(){
    return this.config.nerf()
  }
}