import { randomUUID } from 'node:crypto';

import { BadRequestException, ConflictException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, EntityManager, In, Repository } from 'typeorm';

import { generateSingleElimination } from '~common/brackets/core';
import { CompetitorKind, GameWinnerSide, ScheduleKind, TournamentStatus } from '~common/enums';

import { Category } from '../category/category.entity';
import { Registration } from '../registration/registration.entity';
import { Team } from '../registration/team.entity';
import { TournamentCategory } from '../tournament/tournament-category.entity';
import { Tournament } from '../tournament/tournament.entity';

import { CompetitorRefDto } from './dto/competitor-ref.dto';
import { Game } from './game.entity';
import {
  competitorKindForDiscipline,
  mapGeneratedBracketToGames,
  type ScheduleParticipant,
} from './map-single-elimination';
import { Match } from './match.entity';
import { Schedule } from './schedule.entity';

@Injectable()
export class ScheduleService {
  private readonly logger = new Logger(ScheduleService.name);

  constructor(
    private readonly dataSource: DataSource,
    @InjectRepository(Schedule)
    private readonly scheduleRepository: Repository<Schedule>,
    @InjectRepository(Tournament)
    private readonly tournamentRepository: Repository<Tournament>,
    @InjectRepository(TournamentCategory)
    private readonly tournamentCategoryRepository: Repository<TournamentCategory>,
    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,
    @InjectRepository(Registration)
    private readonly registrationRepository: Repository<Registration>,
    @InjectRepository(Team)
    private readonly teamRepository: Repository<Team>,
  ) {}

  async create(tournamentId: string, categoryId: string): Promise<Schedule> {
    const { tournament, category } = await this.loadTournamentCategory(tournamentId, categoryId);
    if (tournament.status !== TournamentStatus.IN_PROGRESS) {
      throw new BadRequestException('Schedule can only be generated when the tournament is in progress');
    }

    const existing = await this.scheduleRepository.findOne({ where: { tournamentId, categoryId } });
    if (existing) {
      throw new ConflictException('Schedule already exists for this tournament category');
    }

    const competitorKind = competitorKindForDiscipline(category.discipline);
    const participants = await this.loadParticipants(tournamentId, categoryId, competitorKind);
    if (participants.length < 2) {
      throw new BadRequestException('Single elimination needs at least 2 participants');
    }

    const saved = await this.dataSource.transaction(async (manager) =>
      this.persistGeneratedSchedule(manager, tournamentId, categoryId, competitorKind, participants),
    );

    this.logger.log(`Created schedule ${saved.id} for tournament ${tournamentId} category ${categoryId}`);
    return this.findByTournamentAndCategoryOrFail(tournamentId, categoryId);
  }

  async regenerate(tournamentId: string, categoryId: string): Promise<Schedule> {
    const { tournament, category } = await this.loadTournamentCategory(tournamentId, categoryId);
    if (tournament.status !== TournamentStatus.IN_PROGRESS) {
      throw new BadRequestException('Schedule can only be generated when the tournament is in progress');
    }

    const existing = await this.scheduleRepository.findOne({ where: { tournamentId, categoryId } });
    if (!existing) {
      throw new ConflictException('Schedule does not exist for this tournament category');
    }

    const competitorKind = competitorKindForDiscipline(category.discipline);
    const participants = await this.loadParticipants(tournamentId, categoryId, competitorKind);
    if (participants.length < 2) {
      throw new BadRequestException('Single elimination needs at least 2 participants');
    }

    const saved = await this.dataSource.transaction(async (manager) => {
      await manager.getRepository(Schedule).delete(existing.id);
      return this.persistGeneratedSchedule(manager, tournamentId, categoryId, competitorKind, participants);
    });

    this.logger.log(`Regenerated schedule ${saved.id} for tournament ${tournamentId} category ${categoryId}`);
    return this.findByTournamentAndCategoryOrFail(tournamentId, categoryId);
  }

  async findByTournamentAndCategory(tournamentId: string, categoryId: string): Promise<Schedule | null> {
    await this.loadTournamentCategory(tournamentId, categoryId);
    const schedule = await this.scheduleRepository.findOne({
      where: { tournamentId, categoryId },
      relations: ['games', 'games.matches'],
    });
    if (schedule?.games) {
      schedule.games.sort((a, b) => a.key.localeCompare(b.key, undefined, { numeric: true }));
    }
    return schedule;
  }

  async findByTournamentAndCategoryOrFail(tournamentId: string, categoryId: string): Promise<Schedule> {
    const schedule = await this.findByTournamentAndCategory(tournamentId, categoryId);
    if (!schedule) {
      throw new NotFoundException('Schedule not found for this tournament category');
    }
    return schedule;
  }

  async loadCompetitorRefs(schedule: Schedule): Promise<Map<string, CompetitorRefDto>> {
    const ids = new Set<string>();
    for (const game of schedule.games ?? []) {
      if (game.slotACompetitorId) {
        ids.add(game.slotACompetitorId);
      }
      if (game.slotBCompetitorId) {
        ids.add(game.slotBCompetitorId);
      }
      for (const match of game.matches ?? []) {
        if (match.competitorAId) {
          ids.add(match.competitorAId);
        }
        if (match.competitorBId) {
          ids.add(match.competitorBId);
        }
      }
    }
    const kind =
      schedule.games?.flatMap((game) => game.matches ?? []).find((match) => match.competitorKind)?.competitorKind ??
      CompetitorKind.REGISTRATION;
    return this.loadCompetitors(kind, [...ids]);
  }

  private async persistGeneratedSchedule(
    manager: EntityManager,
    tournamentId: string,
    categoryId: string,
    competitorKind: CompetitorKind,
    participants: ScheduleParticipant[],
  ): Promise<Schedule> {
    const generated = generateSingleElimination(participants, (item) => item.id, { includeThirdPlace: true });
    const mappedGames = mapGeneratedBracketToGames(generated);
    const idByKey = new Map(mappedGames.map((game) => [game.key, randomUUID()] as const));

    const schedule = await manager.getRepository(Schedule).save(
      manager.getRepository(Schedule).create({
        tournamentId,
        categoryId,
        kind: ScheduleKind.SINGLE_ELIMINATION,
        size: generated.size,
      }),
    );

    const gameRepo = manager.getRepository(Game);
    const games = mappedGames.map((game) =>
      gameRepo.create({
        id: idByKey.get(game.key),
        scheduleId: schedule.id,
        key: game.key,
        isThirdPlace: game.isThirdPlace,
        isBye: game.isBye,
        winnerSide: game.winnerSide,
        slotAKind: game.slotA.kind,
        slotBKind: game.slotB.kind,
        slotACompetitorId: game.slotA.competitorId,
        slotBCompetitorId: game.slotB.competitorId,
        slotAFromGameId: null,
        slotBFromGameId: null,
        slotAOutcome: game.slotA.outcome,
        slotBOutcome: game.slotB.outcome,
      }),
    );
    await gameRepo.save(games);

    for (const game of mappedGames) {
      const slotAFromGameId = game.slotA.fromKey ? (idByKey.get(game.slotA.fromKey) ?? null) : null;
      const slotBFromGameId = game.slotB.fromKey ? (idByKey.get(game.slotB.fromKey) ?? null) : null;
      if (!slotAFromGameId && !slotBFromGameId) {
        continue;
      }
      await gameRepo.update({ id: idByKey.get(game.key) }, { slotAFromGameId, slotBFromGameId });
    }

    const matchRepo = manager.getRepository(Match);
    const matches = mappedGames
      .filter((game) => !game.isBye)
      .map((game) => {
        const winnerId =
          game.winnerSide === GameWinnerSide.ITEM
            ? game.slotA.competitorId
            : game.winnerSide === GameWinnerSide.ITEM2
              ? game.slotB.competitorId
              : null;
        return matchRepo.create({
          gameId: idByKey.get(game.key),
          competitorKind,
          competitorAId: game.slotA.competitorId,
          competitorBId: game.slotB.competitorId,
          winnerId,
        });
      });
    if (matches.length > 0) {
      await matchRepo.save(matches);
    }

    return schedule;
  }

  private async loadTournamentCategory(
    tournamentId: string,
    categoryId: string,
  ): Promise<{ tournament: Tournament; category: Category }> {
    const tournament = await this.tournamentRepository.findOne({ where: { id: tournamentId } });
    if (!tournament) {
      throw new NotFoundException(`Tournament with ID ${tournamentId} not found`);
    }
    const category = await this.categoryRepository.findOne({ where: { id: categoryId } });
    if (!category) {
      throw new NotFoundException(`Category with ID ${categoryId} not found`);
    }
    const assigned = await this.tournamentCategoryRepository.findOne({ where: { tournamentId, categoryId } });
    if (!assigned) {
      throw new NotFoundException(`Category with ID ${categoryId} is not part of tournament ${tournamentId}`);
    }
    return { tournament, category };
  }

  private async loadParticipants(
    tournamentId: string,
    categoryId: string,
    competitorKind: CompetitorKind,
  ): Promise<ScheduleParticipant[]> {
    if (competitorKind === CompetitorKind.TEAM) {
      const teams = await this.teamRepository.find({
        where: { tournamentId, categoryId },
        order: { createdAt: 'ASC' },
      });
      return teams.map((team) => ({ id: team.id }));
    }
    const registrations = await this.registrationRepository.find({
      where: { tournamentId, categoryId },
      order: { createdAt: 'ASC' },
    });
    return registrations.map((registration) => ({ id: registration.id }));
  }

  private async loadCompetitors(kind: CompetitorKind, ids: string[]): Promise<Map<string, CompetitorRefDto>> {
    const map = new Map<string, CompetitorRefDto>();
    if (ids.length === 0) {
      return map;
    }
    if (kind === CompetitorKind.TEAM) {
      const teams = await this.teamRepository.find({
        where: { id: In(ids) },
        relations: ['club'],
      });
      for (const team of teams) {
        map.set(
          team.id,
          new CompetitorRefDto({
            id: team.id,
            kind: CompetitorKind.TEAM,
            displayName: team.club?.name ?? 'Team',
          }),
        );
      }
      return map;
    }
    const registrations = await this.registrationRepository.find({
      where: { id: In(ids) },
      relations: ['user'],
    });
    for (const registration of registrations) {
      const name = [registration.user?.firstName, registration.user?.lastName].filter(Boolean).join(' ').trim();
      map.set(
        registration.id,
        new CompetitorRefDto({
          id: registration.id,
          kind: CompetitorKind.REGISTRATION,
          displayName: name || null,
        }),
      );
    }
    return map;
  }
}
