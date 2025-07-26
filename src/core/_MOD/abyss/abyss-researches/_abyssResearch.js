import { GameMechanicState } from "../../utils";

class AbyssResearch extends GameMechanicState{
  id;depth;type;x;y
  constructor(config){
    super(config)
    this.id = config.id
    this.depth = config.depth
    this.type = config.type
    this.x = config.position[0] * 100 + 5000
    this.y = config.position[1] * 100 + 5000
  }
  get level(){
    
  }
}