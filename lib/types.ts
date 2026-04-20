export type Team = 'Varsity' | 'JV';
export type Year = 'Freshman' | 'Sophomore' | 'Junior' | 'Senior' | '';
export type Status = 'Active' | 'Pending';
export type Hand = 'R' | 'L' | 'S';

export interface PlayerRow {
  id: string;
  num: number;
  name: string;
  pos: string;
  year: Year | string;
  bats: Hand | string;
  throws: Hand | string;
  team: Team;
  status: Status | string;
  created_at?: string;
}

export interface PlayerFormValues {
  firstName: string;
  lastName: string;
  num: number;
  pos1: string;
  pos2: string;
  year: string;
  team: Team;
  bats: string;
  throws: string;
  status: string;
}

export const POSITIONS = ['P', 'C', '1B', '2B', 'SS', '3B', 'LF', 'CF', 'RF', 'DH', 'UTIL'] as const;
export const YEARS: Year[] = ['Freshman', 'Sophomore', 'Junior', 'Senior'];
