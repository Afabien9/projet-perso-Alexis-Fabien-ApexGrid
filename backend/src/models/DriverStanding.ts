export interface DriverStandings {
  position: number;
  Driver: {
    driverId: string;
  };
  Constructors: Array<{
    constructorId: string;
  }>;
}

export interface DriverStandingsResponse {
  MRData: {
    StandingsTable: {
      StandingsLists: Array<{
        DriverStandings: DriverStandings[];
      }>;
    };
  };
}
