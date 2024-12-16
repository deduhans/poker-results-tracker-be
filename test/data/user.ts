import { AuthDto } from "src/auth/types/AuthDto";
import { CreateUserDto } from "src/user/types/CreateUserDto";

export function getBaseUser(user?: Partial<CreateUserDto>): CreateUserDto {
    let newUser: CreateUserDto = {
        username: 'pokermaster',
        password: 'secret'
    }

    if (user) {
        Object.assign(newUser, user);
    }

    return newUser;
}

export function getBaseAuth(auth?: Partial<AuthDto>): AuthDto {
    const user = getBaseUser();
    let newAuth: AuthDto = {
        username: user.username,
        password: user.password
    };

    if (auth) {
        Object.assign(newAuth, auth);
    }

    return newAuth;
}