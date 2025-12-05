import {
  Controller,
  Get,
  Put,
  Body,
  Param,
  HttpCode,
  HttpStatus,
  NotFoundException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';

import { CurrentUserEntity } from './user.decorators';
import { UserService } from './user.service';
import { User } from './user.entity';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserResponseDto } from './dto/user-response.dto';

/**
 * User Controller
 * Handles HTTP requests for user operations.
 */
@ApiTags('Users')
@Controller('users')
@ApiBearerAuth('Authorization')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get('me')
  @ApiOperation({
    summary: 'Get current user profile',
    description: 'Retrieves the profile of the currently authenticated user',
  })
  @ApiResponse({ status: 200, description: 'User profile', type: UserResponseDto })
  @ApiResponse({ status: 401, description: 'Unauthorized - missing or invalid token' })
  async getProfile(@CurrentUserEntity() user: User): Promise<UserResponseDto> {
    if (!user) {
      throw new NotFoundException('User not found');
    }
    // Fetch user with relations
    const fullUser = await this.userService.findById(user.id);
    if (!fullUser) {
      throw new NotFoundException('User not found');
    }
    return fullUser as UserResponseDto;
  }

  @Put('me')
  @ApiOperation({
    summary: 'Update current user profile',
    description: 'Updates the profile of the currently authenticated user',
  })
  @ApiResponse({ status: 200, description: 'User profile updated', type: UserResponseDto })
  @ApiResponse({ status: 400, description: 'Bad request - validation failed' })
  @ApiResponse({ status: 401, description: 'Unauthorized - missing or invalid token' })
  async updateProfile(
    @CurrentUserEntity() user: User,
    @Body() updateUserDto: UpdateUserDto,
  ): Promise<UserResponseDto> {
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Convert date string to Date object if provided
    const updateData: any = { ...updateUserDto };
    if (updateUserDto.birthDate) {
      updateData.birthDate = new Date(updateUserDto.birthDate);
    }

    const updated = await this.userService.update(user.id, updateData);
    return updated as UserResponseDto;
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get user by ID',
    description: 'Retrieves a specific user by their ID',
  })
  @ApiResponse({ status: 200, description: 'User found', type: UserResponseDto })
  @ApiResponse({ status: 401, description: 'Unauthorized - missing or invalid token' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async findOne(@CurrentUserEntity() currentUser: User, @Param('id') id: string): Promise<UserResponseDto> {
    // TODO: Add authorization check - users can only view their own profile or have admin role
    const user = await this.userService.findById(id);
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    return user as UserResponseDto;
  }
}

