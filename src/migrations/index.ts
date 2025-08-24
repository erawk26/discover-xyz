import * as migration_20250823_144557_initial_schema from './20250823_144557_initial_schema';

export const migrations = [
  {
    up: migration_20250823_144557_initial_schema.up,
    down: migration_20250823_144557_initial_schema.down,
    name: '20250823_144557_initial_schema'
  },
];
