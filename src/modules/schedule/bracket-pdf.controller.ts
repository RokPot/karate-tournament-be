import {
  Controller,
  ForbiddenException,
  Get,
  NotFoundException,
  Param,
  ParseUUIDPipe,
  Query,
  Res,
  StreamableFile,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiProduces, ApiResponse, ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';

import { isAdmin, isClubStaff } from '~common/auth';

import { TournamentService } from '../tournament/tournament.service';
import { CurrentUserEntity } from '../user/user.decorators';
import { User } from '../user/user.entity';

import { BracketPdfService, type BracketPdfResult } from './bracket-pdf.service';
import { BracketPdfQueryDto } from './dto/bracket-pdf-query.dto';

@ApiTags('Schedules')
@Controller('tournaments/:tournamentId')
@ApiBearerAuth('Authorization')
export class BracketPdfController {
  constructor(
    private readonly bracketPdfService: BracketPdfService,
    private readonly tournamentService: TournamentService,
  ) {}

  @Get('brackets/pdf')
  @ApiOperation({
    summary: 'Download all category brackets as one PDF',
    description:
      'Admin or owning club staff. One A4 landscape page per category, in tournament category order. Cards and type use one fixed print size and are not scaled to the page. Kata and kata-team brackets include blank judge score boxes (scoreCount); other disciplines do not. By default only categories that already have a schedule are printed; pass generateMissing=true to generate schedules for categories that have at least 2 competitors (tournament must be in_progress).',
  })
  @ApiParam({ name: 'tournamentId', description: 'Tournament ID' })
  @ApiProduces('application/pdf')
  @ApiResponse({
    status: 200,
    description: 'PDF file',
    content: { 'application/pdf': { schema: { type: 'string', format: 'binary' } } },
  })
  @ApiResponse({ status: 400, description: 'Tournament not in progress (generateMissing=true)' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Tournament not found or nothing to print' })
  async downloadTournament(
    @CurrentUserEntity() currentUser: User,
    @Param('tournamentId', ParseUUIDPipe) tournamentId: string,
    @Query() query: BracketPdfQueryDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<StreamableFile> {
    const caller = this.requireUser(currentUser);
    const tournament = await this.tournamentService.findByIdOrFail(tournamentId);
    this.assertCanAccess(caller, tournament.clubId);
    const result = await this.bracketPdfService.renderTournament({
      tournament,
      generateMissing: query.generateMissing ?? false,
      scoreCount: query.scoreCount,
    });
    return this.toResponse(res, result);
  }

  @Get('categories/:categoryId/bracket/pdf')
  @ApiOperation({
    summary: 'Download one category bracket as a PDF',
    description:
      'Admin or owning club staff. Same rules as the tournament export. With generateMissing=true a missing schedule is created first (400 if the tournament is not in progress or there are fewer than 2 competitors).',
  })
  @ApiParam({ name: 'tournamentId', description: 'Tournament ID' })
  @ApiParam({ name: 'categoryId', description: 'Category ID' })
  @ApiProduces('application/pdf')
  @ApiResponse({
    status: 200,
    description: 'PDF file',
    content: { 'application/pdf': { schema: { type: 'string', format: 'binary' } } },
  })
  @ApiResponse({ status: 400, description: 'Cannot generate schedule (generateMissing=true)' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Tournament, category, or schedule not found' })
  async downloadCategory(
    @CurrentUserEntity() currentUser: User,
    @Param('tournamentId', ParseUUIDPipe) tournamentId: string,
    @Param('categoryId', ParseUUIDPipe) categoryId: string,
    @Query() query: BracketPdfQueryDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<StreamableFile> {
    const caller = this.requireUser(currentUser);
    const tournament = await this.tournamentService.findByIdOrFail(tournamentId);
    this.assertCanAccess(caller, tournament.clubId);
    const result = await this.bracketPdfService.renderCategory({
      tournament,
      categoryId,
      generateMissing: query.generateMissing ?? false,
      scoreCount: query.scoreCount,
    });
    return this.toResponse(res, result);
  }

  private toResponse(res: Response, result: BracketPdfResult): StreamableFile {
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${result.filename}"`,
      'Cache-Control': 'no-store',
    });
    return new StreamableFile(result.buffer);
  }

  private requireUser(user: User | undefined): User {
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  private assertCanAccess(user: User, clubId: string | null): void {
    if (isAdmin(user.roles)) {
      return;
    }
    if (isClubStaff(user.roles) && user.clubId && clubId === user.clubId) {
      return;
    }
    throw new ForbiddenException('Insufficient permissions to access this tournament');
  }
}
