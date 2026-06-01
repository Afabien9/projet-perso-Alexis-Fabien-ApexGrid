export interface Constructor {
  constructorId: string;
  name: string;
}

export interface ConstructorStanding {
  position: string;
  Constructor: Constructor;
}

export interface ConstructorStandingsResponse {
  MRData: {
    StandingsTable: {
      StandingsLists: Array<{
        ConstructorStandings: ConstructorStanding[];
      }>;
    };
  };
}