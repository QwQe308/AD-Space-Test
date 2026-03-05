class PastEmpowerClass {
  constructor(){}

  get data(){
    return player.empowers.past
  }

  get freezing(){
    return this.data.frozenCurrency
  }

  set freezing(newVal){
    return this.data.frozenCurrency = newVal
  }
}

export const PastEmpower = new PastEmpowerClass()