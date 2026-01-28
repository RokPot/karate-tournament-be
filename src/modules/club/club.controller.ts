import { Controller, Get, Post, Put, Delete, Body, Param, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBearerAuth } from '@nestjs/swagger';

import { ClubService } from './club.service';
import { ClubResponseDto } from './dto/club-response.dto';
import { CreateClubDto } from './dto/create-club.dto';
import { UpdateClubDto } from './dto/update-club.dto';

/**
 * Club Controller
 * Handles HTTP requests for club operations.
 */
@ApiTags('Clubs')
@Controller('clubs')
@ApiBearerAuth('Authorization')
export class ClubController {
  constructor(private readonly clubService: ClubService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new club', description: 'Creates a new karate club' })
  @ApiResponse({ status: 201, description: 'Club created successfully', type: ClubResponseDto })
  @ApiResponse({ status: 400, description: 'Bad request - validation failed' })
  @ApiResponse({ status: 401, description: 'Unauthorized - missing or invalid token' })
  async create(@Body() createClubDto: CreateClubDto): Promise<ClubResponseDto> {
    const club = await this.clubService.create(createClubDto);
    return ClubResponseDto.fromDomain(club);
  }

  @Get()
  @ApiOperation({ summary: 'Get all clubs', description: 'Retrieves a list of all clubs' })
  @ApiResponse({ status: 200, description: 'List of clubs', type: [ClubResponseDto] })
  @ApiResponse({ status: 401, description: 'Unauthorized - missing or invalid token' })
  async findAll(): Promise<ClubResponseDto[]> {
    const clubs = await this.clubService.findAll();
    return clubs.map((club) => ClubResponseDto.fromDomain(club));
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get club by ID', description: 'Retrieves a specific club by its ID' })
  @ApiParam({ name: 'id', description: 'Club ID', example: '123e4567-e89b-12d3-a456-426614174000' })
  @ApiResponse({ status: 200, description: 'Club found', type: ClubResponseDto })
  @ApiResponse({ status: 401, description: 'Unauthorized - missing or invalid token' })
  @ApiResponse({ status: 404, description: 'Club not found' })
  async findOne(@Param('id') id: string): Promise<ClubResponseDto> {
    const club = await this.clubService.findByIdOrFail(id);
    return ClubResponseDto.fromDomain(club);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update club', description: 'Updates an existing club' })
  @ApiParam({ name: 'id', description: 'Club ID', example: '123e4567-e89b-12d3-a456-426614174000' })
  @ApiResponse({ status: 200, description: 'Club updated successfully', type: ClubResponseDto })
  @ApiResponse({ status: 400, description: 'Bad request - validation failed' })
  @ApiResponse({ status: 401, description: 'Unauthorized - missing or invalid token' })
  @ApiResponse({ status: 404, description: 'Club not found' })
  async update(@Param('id') id: string, @Body() updateClubDto: UpdateClubDto): Promise<ClubResponseDto> {
    const club = await this.clubService.update(id, updateClubDto);
    return ClubResponseDto.fromDomain(club);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete club', description: 'Deletes a club by ID' })
  @ApiParam({ name: 'id', description: 'Club ID', example: '123e4567-e89b-12d3-a456-426614174000' })
  @ApiResponse({ status: 204, description: 'Club deleted successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized - missing or invalid token' })
  @ApiResponse({ status: 404, description: 'Club not found' })
  async remove(@Param('id') id: string): Promise<void> {
    await this.clubService.delete(id);
  }
}
