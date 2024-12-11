import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from 'src/typeorm/user.entity';
import { plainToInstance } from 'class-transformer';
import { CreateUserDto } from './types/CreateUserDto';
import { UserDto } from './types/UserDto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UserService {
	constructor(
		@InjectRepository(User) private readonly userRepository: Repository<User>,
	) { }

	async getUser(username: string): Promise<UserDto> {
		const user: User | null = await this.userRepository.findOneBy({username: username});

		if(!user) {
			throw new NotFoundException('Could not find the user');
		}

		return user;
	}

	async createUser(user: CreateUserDto): Promise<UserDto> {
		const saltOrRounds = 10;
		const hashedPassword = await bcrypt.hash(user.password, saltOrRounds);
		user.password = hashedPassword;

		const instance: User = await this.userRepository.create(user);
		const newUser: User = await this.userRepository.save(instance);

		return plainToInstance(UserDto, newUser);
	}
}
