import { Controller, Post, Get, Body, Param, NotFoundException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';

import { Public } from '~common/auth';

import { CurrentUserEntity } from '../user/user.decorators';
import { User } from '../user/user.entity';
import { RegistrationService } from './registration.service';
import { CreateRegistrationDto } from './dto/create-registration.dto';
import { CreateRegistrationWithUserDto } from './dto/create-registration-with-user.dto';
import { RegistrationResponseDto } from './dto/registration-response.dto';

/**
 * Registration Controller
 * Handles HTTP requests for registration operations.
 */
@ApiTags('Registrations')
@Controller('registrations')
@ApiBearerAuth('Authorization')
export class RegistrationController {
  constructor(private readonly registrationService: RegistrationService) {}

  @Post()
  @ApiOperation({
    summary: 'Create a new registration',
    description: 'Creates a new registration for the authenticated user or a specified user (for coaches registering athletes)',
  })
  @ApiResponse({ status: 201, description: 'Registration created', type: RegistrationResponseDto })
  @ApiResponse({ status: 400, description: 'Bad request - validation failed' })
  @ApiResponse({ status: 401, description: 'Unauthorized - missing or invalid token' })
  @ApiResponse({ status: 404, description: 'Not found - tournament, category, club, or user not found' })
  @ApiResponse({ status: 409, description: 'Conflict - registration already exists' })
  async create(
    @CurrentUserEntity() currentUser: User,
    @Body() createRegistrationDto: CreateRegistrationDto,
  ): Promise<RegistrationResponseDto> {
    if (!currentUser) {
      throw new NotFoundException('User not found');
    }

    const registration = await this.registrationService.create(createRegistrationDto, currentUser.id);
    const fullRegistration = await this.registrationService.findById(registration.id);
    
    if (!fullRegistration) {
      throw new NotFoundException('Registration not found after creation');
    }

    return RegistrationResponseDto.fromDomain(fullRegistration);
  }

  @Public()
  @Post('public')
  @ApiOperation({
    summary: 'Create a registration with user information (public)',
    description: 'Creates a user from email/name and then creates a registration. This endpoint is public and does not require authentication.',
  })
  @ApiResponse({ status: 201, description: 'Registration created', type: RegistrationResponseDto })
  @ApiResponse({ status: 400, description: 'Bad request - validation failed' })
  @ApiResponse({ status: 404, description: 'Not found - tournament, category, or club not found' })
  @ApiResponse({ status: 409, description: 'Conflict - registration already exists' })
  async createWithUser(
    @Body() createRegistrationWithUserDto: CreateRegistrationWithUserDto,
  ): Promise<RegistrationResponseDto> {
    const registration = await this.registrationService.createWithUser(createRegistrationWithUserDto);
    const fullRegistration = await this.registrationService.findById(registration.id);
    
    if (!fullRegistration) {
      throw new NotFoundException('Registration not found after creation');
    }

    return RegistrationResponseDto.fromDomain(fullRegistration);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get registration by ID',
    description: 'Retrieves a specific registration by its ID',
  })
  @ApiResponse({ status: 200, description: 'Registration found', type: RegistrationResponseDto })
  @ApiResponse({ status: 401, description: 'Unauthorized - missing or invalid token' })
  @ApiResponse({ status: 404, description: 'Registration not found' })
  async findOne(@Param('id') id: string): Promise<RegistrationResponseDto> {
    const registration = await this.registrationService.findById(id);
    if (!registration) {
      throw new NotFoundException(`Registration with ID ${id} not found`);
    }
    return RegistrationResponseDto.fromDomain(registration);
  }
}
