import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { disciplineHasPoints } from '~common/enums';

import { Category } from '../category/category.entity';
import { TournamentCategory } from '../tournament/tournament-category.entity';
import { Tournament } from '../tournament/tournament.entity';

import { buildBracketFromGames } from './bracket-from-games';
import { DEFAULT_SCORE_COUNT, renderBracketsHtml, type BracketPdfSection } from './bracket-pdf-html';
import { PdfRendererService } from './pdf-renderer.service';
import { ScheduleService } from './schedule.service';

export type BracketPdfResult = { buffer: Buffer; filename: string };

export type BracketPdfParams = {
  tournament: Tournament;
  generateMissing: boolean;
  scoreCount?: number;
};

const MIN_COMPETITORS = 2;

const slug = (value: string): string =>
  value
    .normalize('NFKD')
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .toLowerCase() || 'brackets';

@Injectable()
export class BracketPdfService {
  constructor(
    private readonly scheduleService: ScheduleService,
    private readonly pdfRenderer: PdfRendererService,
    @InjectRepository(TournamentCategory)
    private readonly tournamentCategoryRepository: Repository<TournamentCategory>,
  ) {}

  /** One PDF with every tournament category that has (or, if asked, can get) a bracket. */
  async renderTournament(params: BracketPdfParams): Promise<BracketPdfResult> {
    const { tournament, generateMissing, scoreCount } = params;
    const assignments = await this.tournamentCategoryRepository.find({
      where: { tournamentId: tournament.id },
      relations: ['category'],
      order: { sortOrder: 'ASC' },
    });

    const sections: BracketPdfSection[] = [];
    for (const assignment of assignments) {
      const section = await this.buildSection(tournament, assignment.category, generateMissing, false, scoreCount);
      if (section) {
        sections.push(section);
      }
    }
    if (sections.length === 0) {
      throw new NotFoundException(
        generateMissing
          ? 'No category has enough competitors for a bracket'
          : 'No brackets exist yet. Generate schedules first or pass generateMissing=true',
      );
    }
    return this.render(sections, `${slug(tournament.name)}-brackets`);
  }

  /** PDF for a single tournament category. */
  async renderCategory(params: BracketPdfParams & { categoryId: string }): Promise<BracketPdfResult> {
    const { tournament, categoryId, generateMissing, scoreCount } = params;
    const assignment = await this.tournamentCategoryRepository.findOne({
      where: { tournamentId: tournament.id, categoryId },
      relations: ['category'],
    });
    if (!assignment) {
      throw new NotFoundException(`Category with ID ${categoryId} is not part of tournament ${tournament.id}`);
    }
    const section = await this.buildSection(tournament, assignment.category, generateMissing, true, scoreCount);
    if (!section) {
      throw new NotFoundException('Schedule not found for this tournament category');
    }
    return this.render([section], `${slug(assignment.category.name)}-bracket`);
  }

  private async render(sections: BracketPdfSection[], filename: string): Promise<BracketPdfResult> {
    const html = renderBracketsHtml(sections, { documentTitle: filename });
    const buffer = await this.pdfRenderer.renderHtml(html);
    return { buffer, filename: `${filename}.pdf` };
  }

  private async buildSection(
    tournament: Tournament,
    category: Category,
    generateMissing: boolean,
    strict: boolean,
    requestedScoreCount: number | undefined,
  ): Promise<BracketPdfSection | null> {
    let schedule = await this.scheduleService.findByTournamentAndCategory(tournament.id, category.id);

    if (!schedule && generateMissing) {
      // Combined export quietly skips categories that cannot have a bracket.
      // A single-category export lets create() explain why it cannot.
      if (strict || (await this.scheduleService.countCompetitors(tournament.id, category)) >= MIN_COMPETITORS) {
        await this.scheduleService.create(tournament.id, category.id);
        schedule = await this.scheduleService.findByTournamentAndCategory(tournament.id, category.id);
      }
    }
    if (!schedule) {
      return null;
    }

    const refs = await this.scheduleService.loadCompetitorRefs(schedule);
    const labels = new Map([...refs].map(([id, ref]) => [id, ref.displayName ?? '—'] as const));
    const bracket = buildBracketFromGames(schedule.games ?? [], labels);
    if (!bracket) {
      return null;
    }
    return {
      title: category.name,
      subtitle: `${tournament.name} · ${schedule.size} competitors`,
      bracket,
      // Only pointed disciplines (kata, kata-team) get judge boxes; the query cannot add them elsewhere.
      scoreCount: disciplineHasPoints(category.discipline) ? (requestedScoreCount ?? DEFAULT_SCORE_COUNT) : 0,
    };
  }
}
