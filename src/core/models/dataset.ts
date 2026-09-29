/**
 * Core Domain Models: Dataset, Sample, and Population
 *
 * Pure entities representing biological samples and population groupings
 * parsed from smartPCA .evec files. Independent of visualization frameworks.
 */

export interface Sample {
  /** Sequential zero-based row index in the dataset, ensuring unique identity even with duplicate sample IDs */
  key: number;
  /** Sample identifier from .evec column 1 */
  id: string;
  /** Population or ancestry group label from the final .evec column */
  population: string;
  /** Principal component coordinates [PC1, PC2, ... PCn] */
  pcs: number[];
}

export interface Population {
  /** Population name */
  name: string;
  /** Number of samples belonging to this population */
  count: number;
  /** Base assigned palette color */
  color: string;
}

export interface Dataset {
  /** Dataset filename or display title */
  name: string;
  /** Array of all sample rows */
  samples: Sample[];
  /** Alphabetically sorted list of distinct populations */
  populations: Population[];
  /** Total number of principal components available in the dataset */
  pcCount: number;
  /** Eigenvalues from #eigvals: header (empty if missing) */
  eigenvalues: number[];
  /** Non-fatal warnings encountered during parsing (e.g. duplicate sample IDs) */
  warnings: string[];
  /** Flag indicating whether this is the synthetic demonstration dataset */
  example?: boolean;
}
