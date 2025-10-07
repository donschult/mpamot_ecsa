export type FeeBracket = {
  min: number;
  max: number;
  primary: number;
  secondary: number;
};

export type TableDefinition = {
  id: string;
  name: string;
  description?: string;
  brackets: FeeBracket[];
};

export type AdjustmentFactor = {
  name: string;
  factor: number;
  note?: string;
};

export type StageDefinition = Record<string, number>;

export type EcsaData = {
  tables: Record<string, TableDefinition>;
  factors: Record<string, AdjustmentFactor[]>;
  stages: Record<string, StageDefinition>;
  tableStageMap: Record<string, keyof EcsaData['stages']>;
};

export const ECSA_DATA: EcsaData = {
  tables: {
    '1': {
      id: '1',
      name: 'Civil & Structural Engineering (Engineering Projects)',
      description: 'Guideline fees for engineering projects as per Table 1.',
      brackets: [
        { min: 1_050_000, max: 2_100_000, primary: 178_500, secondary: 17.0 },
        { min: 2_100_000, max: 10_500_000, primary: 336_000, secondary: 12.5 },
        { min: 10_500_000, max: 21_000_000, primary: 1_386_000, secondary: 10.5 },
        { min: 21_000_000, max: 52_500_000, primary: 2_488_500, secondary: 9.0 },
        { min: 52_500_000, max: 105_000_000, primary: 5_323_500, secondary: 8.0 },
        { min: 105_000_000, max: 630_000_000, primary: 9_523_500, secondary: 7.0 },
        { min: 630_000_000, max: Number.POSITIVE_INFINITY, primary: 46_273_500, secondary: 6.0 }
      ]
    },
    '2': {
      id: '2',
      name: 'Additional Design Fee: Reinforced Concrete & Structural Steel',
      description: 'Supplementary fees in addition to Table 1 for reinforced concrete and structural steel.',
      brackets: [
        { min: 1_050_000, max: 2_100_000, primary: 84_000, secondary: 8.0 },
        { min: 2_100_000, max: 10_500_000, primary: 157_500, secondary: 5.5 },
        { min: 10_500_000, max: 21_000_000, primary: 619_500, secondary: 4.5 },
        { min: 21_000_000, max: 52_500_000, primary: 1_092_000, secondary: 3.5 },
        { min: 52_500_000, max: 105_000_000, primary: 2_194_500, secondary: 3.0 },
        { min: 105_000_000, max: Number.POSITIVE_INFINITY, primary: 3_769_500, secondary: 2.5 }
      ]
    },
    '3': {
      id: '3',
      name: 'Civil Engineering (Building Projects)',
      brackets: [
        { min: 1_050_000, max: 2_100_000, primary: 178_500, secondary: 17.0 },
        { min: 2_100_000, max: 10_500_000, primary: 336_000, secondary: 12.5 },
        { min: 10_500_000, max: 21_000_000, primary: 1_386_000, secondary: 10.5 },
        { min: 21_000_000, max: 52_500_000, primary: 2_488_500, secondary: 9.5 },
        { min: 52_500_000, max: Number.POSITIVE_INFINITY, primary: 5_481_000, secondary: 8.5 }
      ]
    },
    '4': {
      id: '4',
      name: 'Structural Engineering (Building Projects)',
      brackets: [
        { min: 1_050_000, max: 2_100_000, primary: 178_500, secondary: 17.0 },
        { min: 2_100_000, max: 10_500_000, primary: 336_000, secondary: 12.5 },
        { min: 10_500_000, max: 21_000_000, primary: 1_386_000, secondary: 10.5 },
        { min: 21_000_000, max: 52_500_000, primary: 2_488_500, secondary: 9.5 },
        { min: 52_500_000, max: Number.POSITIVE_INFINITY, primary: 5_481_000, secondary: 8.5 }
      ]
    },
    '5': {
      id: '5',
      name: 'Mechanical Engineering (Engineering Projects)',
      brackets: [
        { min: 1_050_000, max: 2_100_000, primary: 178_500, secondary: 17.0 },
        { min: 2_100_000, max: 10_500_000, primary: 336_000, secondary: 12.5 },
        { min: 10_500_000, max: 21_000_000, primary: 1_386_000, secondary: 10.5 },
        { min: 21_000_000, max: 52_500_000, primary: 2_488_500, secondary: 9.0 },
        { min: 52_500_000, max: 105_000_000, primary: 5_323_500, secondary: 8.0 },
        { min: 105_000_000, max: 630_000_000, primary: 9_523_500, secondary: 7.0 },
        { min: 630_000_000, max: Number.POSITIVE_INFINITY, primary: 46_273_500, secondary: 6.5 }
      ]
    },
    '6': {
      id: '6',
      name: 'Electrical Engineering (Engineering Projects)',
      brackets: [
        { min: 1_050_000, max: 2_100_000, primary: 178_500, secondary: 17.0 },
        { min: 2_100_000, max: 10_500_000, primary: 336_000, secondary: 12.5 },
        { min: 10_500_000, max: 21_000_000, primary: 1_386_000, secondary: 10.5 },
        { min: 21_000_000, max: 52_500_000, primary: 2_488_500, secondary: 9.0 },
        { min: 52_500_000, max: 105_000_000, primary: 5_323_500, secondary: 8.0 },
        { min: 105_000_000, max: 630_000_000, primary: 9_523_500, secondary: 7.0 },
        { min: 630_000_000, max: Number.POSITIVE_INFINITY, primary: 46_273_500, secondary: 6.5 }
      ]
    },
    '7': {
      id: '7',
      name: 'Mechanical Engineering (Building Projects)',
      brackets: [
        { min: 1_050_000, max: 2_100_000, primary: 210_000, secondary: 20.0 },
        { min: 2_100_000, max: 10_500_000, primary: 399_000, secondary: 15.0 },
        { min: 10_500_000, max: 21_000_000, primary: 1_659_000, secondary: 13.0 },
        { min: 21_000_000, max: 52_500_000, primary: 3_024_000, secondary: 11.5 },
        { min: 52_500_000, max: 105_000_000, primary: 6_646_500, secondary: 10.5 },
        { min: 105_000_000, max: 630_000_000, primary: 12_159_000, secondary: 10.0 }
      ]
    },
    '8': {
      id: '8',
      name: 'Electrical Engineering (Building Projects)',
      brackets: [
        { min: 1_050_000, max: 2_100_000, primary: 210_000, secondary: 20.0 },
        { min: 2_100_000, max: 10_500_000, primary: 399_000, secondary: 15.0 },
        { min: 10_500_000, max: 21_000_000, primary: 1_659_000, secondary: 13.0 },
        { min: 21_000_000, max: 52_500_000, primary: 3_024_000, secondary: 11.5 },
        { min: 52_500_000, max: 105_000_000, primary: 6_646_500, secondary: 10.5 },
        { min: 105_000_000, max: Number.POSITIVE_INFINITY, primary: 12_159_000, secondary: 10.0 }
      ]
    }
  },
  factors: {
    '2A': [
      { name: 'Rural roads', factor: 0.85 },
      { name: 'Alterations to existing works', factor: 1.25 },
      { name: 'Duplication of works', factor: 0.25 },
      { name: 'Financial administration handled by QS', factor: 0.85 }
    ],
    '3A': [
      { name: 'Alterations to existing works', factor: 1.25 },
      { name: 'Internal water and drainage for buildings', factor: 1.25 },
      { name: 'Mass concrete foundations, brickwork and cladding', factor: 0.33 },
      { name: 'Duplication of works', factor: 0.25 }
    ],
    '4A': [
      { name: 'Alterations to existing works', factor: 1.25 },
      { name: 'Mass concrete foundations, brickwork and cladding', factor: 0.33 },
      { name: 'Duplication of works', factor: 0.25 }
    ],
    '5A': [
      { name: 'Multi-tenant installations', factor: 1.25 },
      { name: 'Alterations to existing works', factor: 1.25 },
      { name: 'Duplication of works', factor: 0.25 },
      { name: 'Financial administration handled by QS', factor: 0.85 }
    ],
    '6A': [
      { name: 'Multi-tenant installations', factor: 1.25 },
      { name: 'Alterations to existing works', factor: 1.25 },
      { name: 'Duplication of works', factor: 0.25 },
      { name: 'Financial administration handled by QS', factor: 0.85 }
    ],
    '7A': [
      { name: 'Multi-tenant installations', factor: 1.25 },
      { name: 'Alterations to existing works', factor: 1.25 },
      { name: 'Duplication of works', factor: 0.25 },
      { name: 'Financial administration handled by QS', factor: 0.85 }
    ],
    '8A': [
      { name: 'Multi-tenant installations', factor: 1.25 },
      { name: 'Alterations to existing works', factor: 1.25 },
      { name: 'Duplication of works', factor: 0.25 },
      { name: 'Financial administration handled by QS', factor: 0.85 }
    ]
  },
  stages: {
    'Civil Engineering Projects': {
      'Inception': 5,
      'Concept and Viability': 25,
      'Design Development': 25,
      'Documentation and Procurement': 25,
      'Contract Administration and Inspection': 15,
      'Close-Out': 5
    },
    'Structural Engineering Projects': {
      'Inception': 5,
      'Concept and Viability': 25,
      'Design Development': 30,
      'Documentation and Procurement': 10,
      'Contract Administration and Inspection': 25,
      'Close-Out': 5
    },
    'Building Projects': {
      'Inception': 5,
      'Concept and Viability': 25,
      'Design Development': 25,
      'Documentation and Procurement': 15,
      'Contract Administration and Inspection': 25,
      'Close-Out': 5
    },
    'Mechanical and Electrical Projects': {
      'Inception': 5,
      'Concept and Viability': 15,
      'Design Development': 20,
      'Documentation and Procurement': 20,
      'Contract Administration and Inspection': 35,
      'Close-Out': 5
    }
  },
  tableStageMap: {
    '1': 'Civil Engineering Projects',
    '2': 'Civil Engineering Projects',
    '3': 'Building Projects',
    '4': 'Structural Engineering Projects',
    '5': 'Mechanical and Electrical Projects',
    '6': 'Mechanical and Electrical Projects',
    '7': 'Mechanical and Electrical Projects',
    '8': 'Mechanical and Electrical Projects'
  }
};

export const MIN_PROJECT_VALUE = 1_000_000;
