import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from 'src/typeorm/user.entity';
import { plainToInstance } from 'class-transformer';
import { CreateUserDto } from './types/CreateUserDto';
import { UserDto } from './types/UserDto';

@Injectable()
export class UserService {
	constructor(
		@InjectRepository(User) private readonly userRepository: Repository<User>,
	) { }

	async getUser(id: number): Promise<UserDto> {
		const user: User | null = await this.userRepository.findOneBy({id: id});

		if(!user) {
			throw new NotFoundException();
		}

		return plainToInstance(UserDto, user);
	}

	async createUser(user: CreateUserDto): Promise<UserDto> {
		const instance: User = await this.userRepository.create(user);
		const newUser: User = await this.userRepository.save(instance);

		return plainToInstance(UserDto, newUser);
	}
}
