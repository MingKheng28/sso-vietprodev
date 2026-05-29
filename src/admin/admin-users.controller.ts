import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { AdminGuard } from '../common/guards/admin.guard';
import { UsersService } from '../users/users.service';
@Controller('admin/users-v2') @UseGuards(AdminGuard)
export class AdminUsersController { constructor(private readonly users: UsersService) {} @Get(':id') get(@Param('id') id: string) { return this.users.findById(id); } }
