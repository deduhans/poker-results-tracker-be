import { ConflictException, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
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
		const user: User | null = await this.userRepository.findOneBy({ username: username });

		if (!user) {
			throw new UnauthorizedException('Could not find the user: ' + username)
		}

		return user;
	}

	async getUserById(id: number): Promise<User> {
		const user: User | null = await this.userRepository.findOneBy({ id: id });

		if (!user) {
			throw new UnauthorizedException('Could not find the user by id: ' + id)
		}

		return user;
	}

	async createUser(user: CreateUserDto): Promise<UserDto> {
		if (await this.isUserExists(user.username)) {
			throw new ConflictException('User already exist');
		}

		const saltOrRounds = 10;
		const hashedPassword = await bcrypt.hash(user.password, saltOrRounds);
		user.password = hashedPassword;

		const instance: User = await this.userRepository.create(user);
		const newUser: User = await this.userRepository.save(instance);

		return plainToInstance(UserDto, newUser);
	}

	private async isUserExists(username: string): Promise<boolean> {
		const user = await this.userRepository.findOneBy({ username: username });
		return user ? true : false;
	}
}
