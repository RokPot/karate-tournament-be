import { Injectable, Logger } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

import { GLOBAL_CATEGORIES } from '~database/seeds/global-categories';

export type TournamentCleanupCounts = {
  tournaments: number;
  schedules: number;
  games: number;
  matches: number;
  scores: number;
  registrations: number;
  submissions: number;
  teams: number;
  teamMembers: number;
  tournamentCategories: number;
  globalCategories: number;
  clubCategories: number;
  users: number;
  clubs: number;
  invitations: number;
  auditLogs: number;
};

const COUNT_SQL = `
  SELECT
    (SELECT COUNT(*)::int FROM tournaments) AS tournaments,
    (SELECT COUNT(*)::int FROM schedules) AS schedules,
    (SELECT COUNT(*)::int FROM games) AS games,
    (SELECT COUNT(*)::int FROM matches) AS matches,
    (SELECT COUNT(*)::int FROM scores) AS scores,
    (SELECT COUNT(*)::int FROM registrations) AS registrations,
    (SELECT COUNT(*)::int FROM registration_submissions) AS "submissions",
    (SELECT COUNT(*)::int FROM teams) AS teams,
    (SELECT COUNT(*)::int FROM team_members) AS "teamMembers",
    (SELECT COUNT(*)::int FROM tournament_categories) AS "tournamentCategories",
    (SELECT COUNT(*)::int FROM categories WHERE "clubId" IS NULL) AS "globalCategories",
    (SELECT COUNT(*)::int FROM categories WHERE "clubId" IS NOT NULL) AS "clubCategories",
    (SELECT COUNT(*)::int FROM users) AS users,
    (SELECT COUNT(*)::int FROM clubs) AS clubs,
    (SELECT COUNT(*)::int FROM invitations) AS invitations,
    (SELECT COUNT(*)::int FROM audit_logs) AS "auditLogs"
`;

@Injectable()
export class MaintenanceService {
  private readonly logger = new Logger(MaintenanceService.name);

  constructor(@InjectDataSource() private readonly dataSource: DataSource) {}

  async resetTournamentData(): Promise<{ before: TournamentCleanupCounts; after: TournamentCleanupCounts }> {
    return this.dataSource.transaction(async (manager) => {
      const [before] = await manager.query(COUNT_SQL);

      await manager.query(`
        TRUNCATE TABLE
          scores,
          matches,
          games,
          schedules,
          team_members,
          teams,
          registrations,
          registration_submissions,
          tournament_categories,
          tournaments,
          audit_logs
        RESTART IDENTITY CASCADE
      `);

      await manager.query(`DELETE FROM categories WHERE "clubId" IS NOT NULL`);

      const extras: Array<{ id: string; name: string; discipline: string }> = await manager.query(
        `SELECT id, name, discipline FROM categories WHERE "clubId" IS NULL`,
      );
      const seeded = new Set(GLOBAL_CATEGORIES.map((category) => `${category.discipline}|${category.name}`));
      const extraIds = extras.filter((row) => !seeded.has(`${row.discipline}|${row.name}`)).map((row) => row.id);
      if (extraIds.length > 0) {
        await manager.query(`DELETE FROM categories WHERE id = ANY($1::uuid[])`, [extraIds]);
      }

      const [after] = await manager.query(COUNT_SQL);
      this.logger.warn(
        `Reset tournament data: tournaments ${before.tournaments}→${after.tournaments}, global categories ${after.globalCategories}`,
      );
      return { before, after };
    });
  }
}
