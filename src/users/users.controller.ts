import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { AdminGuard } from '../common/guards/admin.guard';
import { UsersService } from './users.service';
@Controller('admin/users') @UseGuards(AdminGuard)
export class UsersController { constructor(private readonly users: UsersService) {} @Get(':id') findOne(@Param('id') id: string) { return this.users.findById(id); } }
