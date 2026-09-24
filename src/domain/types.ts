export interface Sample {
  /** Row identity is independent of sample names, which need not be unique. */
  key: number;
  id: string;
  population: string;
  pcs: number[];
}
export interface Population {
  name: string;
  count: number;
  color: string;
}
export interface Dataset {
  name: string;
  samples: Sample[];
  populations: Population[];
  pcCount: number;
  eigenvalues: number[];
  warnings: string[];
  example?: boolean;
}
