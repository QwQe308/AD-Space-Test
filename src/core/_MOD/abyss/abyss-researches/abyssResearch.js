export class ResearchManager {
  constructor() {
    this.activeResearches = new Set();
  }

  get maxConcurrent(){
    return 3
  }

  canStartResearch(node) {
    return (
      this.activeResearches.size < this.maxConcurrent &&
      node.requirements() &&
      node.unlocked()
    );
  }

  startResearch(node) {
    if(node.isResearching){
      this.activeResearches.delete(node.id);
      node.isResearching = false;
      return true
    }
    if (this.canStartResearch(node)) {
      this.activeResearches.add(node.id);
      node.isResearching = true;
      return true;
    }
    return false;
  }

  completeResearch(node) {
    this.activeResearches.delete(node.id);
    node.isResearching = false;
  }

  isResearching(node) {
    return this.activeResearches.has(node.id);
  }
}

export const researchManager = new ResearchManager()